import EventEmitter from "./event_emitter";

// There are several ways to build a blob, and we want to support all of them.
const BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
const createObjectURL = (window.URL && window.URL.createObjectURL) ||
    (window.webkitURL && window.webkitURL.createObjectURL);
const Blob = window.Blob;
const BLOB_CONSTRUCTOR = (Blob || false) && (new Blob(["test"]).size === 4);

// The `threadLoader` is the initial source of our worker threads, which will be used
// to facilitate communication between the worker and the UI, and to load and eval the
// functions that we want to execute on a Thread. This function has to be fully encapsulated
// so that it can be serialized into a Blob url.
function threadLoader () {
    const contexts = {};

    /**
     * Each Thread  will have it's own Context, so that each has it's own event emitters and a
     * consistent, stable, `this`.
     */
    function Context (id) {
        this.__id__ = id;
        this.__emitter__ = new self.EventEmitter();
    }

    /**
     * Listen for a particular event to be dispatched from the parent thread.
     *
     * @param  {String} type - Event to listen to
     * @param  {Function} fn - Callback
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * this.on("foo", (bar, baz) => console.log(bar, baz));
     */
    Context.prototype.on = function on (type, fn) {
        this.__emitter__.on(type, fn);
        return this;
    };

    /**
     * Listen for the next instance of a particular event to be dispatched from the parent thread.
     *
     * @param  {String}   type - Event to listen to one time
     * @param  {Function} fn - Callback
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * this.once("foo", (bar, baz) => console.log(bar, baz));
     */
    Context.prototype.once = function once (type, fn) {
        this.__emitter__.once(type, fn);
        return this;
    };

    /**
     * Stop listening for an event on the parent thread. If `fn` is provided,
     * only that listener will be unbound, otherwise it will unbind all listeners
     * for a particular type.
     *
     * @param  {String}   type - Event to stop listening to
     * @param  {Function} [fn] - Callback
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * this.off("foo", (bar, baz) => console.log(bar, baz));
     * this.off("foo");
     */
    Context.prototype.off = function off (type, fn) {
        this.__emitter__.off(type, fn);
        return this;
    };

    /**
     * Fire a particular event on the parent thread, with some optional arguments
     * which will be forwarded to any event listeners inside the parent thread.
     * NOTE: this fires events OUTSIDE this thread,
     * e.g. if you call `.on("foo", fn).emit("foo")`, fn will NOT be fired.
     *
     * @param  {String}   type - Event to emit
     * @param  {...Mixed} [args] - Params for the callbacks listening to this event.
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * this.emit("foo", "bar", "baz");
     */
    Context.prototype.emit = function emit (type, ...args) {
        postMessage({
            args,
            type,
            id: this.__id__,
        });
        return this;
    };

    /**
     * Forward to our parent thread, a request for logging.
     *
     * @param {...Mixed} args - Arguments for console.log
     */
    Context.prototype.log = function log (...args) {
        this.emit("log", ...args);
    };

    /* eslint-disable no-undef */
    onmessage = function onMessage (ev) {
    /* eslint-enable no-undef */
        switch (ev.data.type) {
        // We have received source for a function to execute.
        case "source": {
            // This function will have it's own Context.
            const context = contexts[ev.data.id] = new Context(ev.data.id);
            let result;

            // Eval the provided source and call the resultant method with our
            // new context, and the args that were provided.
            try {
                /* eslint-disable no-eval */
                result = eval(`(${ev.data.src})`).apply(context, ev.data.args);
                /* eslint-enable no-eval */
            } catch (err) {
                context.emit("error", err.stack);
                break;
            }

            // If there was a result from the eval, and if that result is not a Promise, then
            // return that result to the parent, via the "done" event. Otherwise, if it was a
            // Promise, then wait for the Promise to resolve before returning the result.
            if (result) {
                if (result.then) {
                    result.then(
                        data => context.emit("done", data),
                        err => context.emit("error", err.stack)
                    );
                } else {
                    context.emit("done", result);
                }
            }
            break;
        }
        // We have received a request to send a message internally.
        default: {
            // Look up the context for this message.
            const context = contexts[ev.data.id];

            // Emit the message on the context, and catch any errors that result.
            try {
                context.__emitter__.emit.apply(
                    context.__emitter__.emit,
                    [ev.data.type].concat(ev.data.args)
                );
            } catch (err) {
                context.emit("error", err.stack);
            }
        }}
    };

    // Inform our parent thread that we are ready.
    postMessage({ type: "worker_ready" });
}

let loaderBlob;
let loaderSrc;

// The simplest (and newest) way to create a blob is to pass an array into the Blob constructor.
if (BLOB_CONSTRUCTOR) {
    loaderBlob = new Blob([EventEmitter.toString(), ";\n(", threadLoader.toString(), ")();"]);

// If the Blob constructor doesn't accept params, then we need to use the deprecated BlobBuilder.
} else if (BlobBuilder) {
    const builder = new BlobBuilder();
    builder.append(EventEmitter.toString());
    builder.append(";\n(");
    builder.append(threadLoader.toString());
    builder.append(")();");
    loaderBlob = builder.getBlob();
}

// Convert our Blob into a Blob URL.
if (createObjectURL) {
    loaderSrc = createObjectURL(loaderBlob);
}

// TODO: max thread pool size
const threadPool = [];
let seq = 0;

/**
 * Create a new Worker, with our loader as the source.
 *
 * @private
 */
function spawnWorker () {
    const worker = new Worker(loaderSrc);

    // Holds our contexts, by id.
    worker.contexts = {};
    // Hold on to our last context, in case we need it (e.g. there's an uncaught error).
    worker.lastContext = null;
    // Holds a queue of messages to be emitted once the worker is ready.
    worker.messageQueue = [];

    /**
     * @private
     * @param {Event}   ev
     * @param {Object}  ev.data
     * @param {String}  ev.data.type - What event was emitted?
     * @param {Mixed[]} ev.data.args - Args for the event listeners
     */
    worker.onmessage = function onmessage (ev) {
        // If the worker is letting us know that it is ready,
        // then flush our message queue and mark the worker as ready.
        if (ev.data.type === "worker_ready") {
            while (worker.messageQueue.length) {
                worker.postMessage(worker.messageQueue.shift());
            }
            worker.ready = true;
            return;
        }

        // Save a reference to the current context.
        worker.lastContext = worker.contexts[ev.data.id];
        // Emit the event to our audience.
        worker.lastContext.thread.__emitter__.emit(ev.data.type, ...ev.data.args);

        // And a few more special cases:
        switch (ev.data.type) {
        // The "done" message is sent if there is an immediate return value from the initial source.
        case "done":
            // So, since the worker is presumably done, put it back in the pool.
            threadPool.push(worker);
            break;
        // The "log" message is sent when the thread calls `this.log(...)`
        case "log":
            console.log(...ev.data.args); // eslint-disable-line no-console
            break;
        // The "error" message is sent when an error is caught inside the thread.
        case "error":
            console.error(...ev.data.args); // eslint-disable-line no-console
            break;
        default:
        }
    };

    /**
     * Catch any errors that were not caught inside the worker. As a result, the worker is now dirty
     * and must be terminated with extreme prejudice.
     *
     * @private
     * @param {Event} err - Error Event
     */
    worker.onerror = function onerror (err) {
        worker.lastContext.thread.__emitter__.emit("error", err);
        console.error(err.message, err.stack); // eslint-disable-line no-console
        worker.terminate();
    };

    return worker;
}

class Thread {
    /**
     * Creates a new Thread from a self contained function, and an optional set of params to be
     * passed to the new thread. If anything (other than a Promise (or other Thenable)) is returned
     * from the function, that value will be emitted as "done" on the Thread object.
     *
     * @param {Function} fn - The source for the new thread. MUST be completely self contained.
     * @param {...Mixed} [args] - Arguments to be passed to the new thread.
     *
     * @example
     * const myThread = new Thread(function (foo, bar) {
     *     return foo + bar; // trivial example
     * }, "foo", "bar")
     *     .on("done", result => console.log(result)); // "foobar"
     */
    constructor (fn, ...args) {
        // If we have any unused workers in our pool, use the oldest one,
        // otherwise, create a new worker.
        if (threadPool.length) {
            this.__worker__ = threadPool.shift();
        } else {
            this.__worker__ = spawnWorker();
        }

        // Each thread needs a unique id.
        this.__id__ = (new Date()).getTime().toString() + (seq += 1);

        // Each thread also needs a context
        this.__worker__.contexts[this.__id__] = this.__worker__.lastContext = {
            thread: this,
        };

        // And each thread also needs an EventEmitter
        this.__emitter__ = new EventEmitter();

        // The initial message for the worker, containing the source of our self contained method,
        // and our initial params for it.
        const msg = {
            args,
            id: this.__id__,
            src: fn.toString(), // TODO: simple static analysis to find undefined references
            type: "source",
        };

        // If the worker has already notified us that it is up and running, go ahead and send it our
        // initial message, otherwise, put the initial message in a queue.
        if (this.__worker__.ready) {
            this.__worker__.postMessage(msg);
        } else {
            this.__worker__.messageQueue.push(msg);
        }
    }

    /**
     * Listen for a particular event to be dispatched from the thread.
     *
     * @param  {String} type - Event to listen to
     * @param  {Function} fn - Callback
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * myThread.on("foo", (bar, baz) => console.log(bar, baz));
     */
    on (type, fn) {
        this.__emitter__.on(type, fn);
        return this;
    }

    /**
     * Listen for the next instance of a particular event to be dispatched from the thread.
     *
     * @param  {String}   type - Event to listen to one time
     * @param  {Function} fn - Callback
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * myThread.once("foo", (bar, baz) => console.log(bar, baz));
     */
    once (type, fn) {
        this.__emitter__.once(type, fn);
        return this;
    }

    /**
     * Stop listening for an event on the thread. If `fn` is provided,
     * only that listener will be unbound, otherwise it will unbind all listeners
     * for a particular type.
     *
     * @param  {String}   type - Event to stop listening to
     * @param  {Function} [fn] - Callback
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * myThread.off("foo", (bar, baz) => console.log(bar, baz));
     * myThread.off("foo");
     */
    off (type, fn) {
        this.__emitter__.off(type, fn);
        return this;
    }

    /**
     * Fire a particular event on the thread, with some optional arguments
     * which will be forwarded to any event listeners inside the thread.
     * NOTE: this fires events INSIDE the thread,
     * e.g. if you call `.on("foo", fn).emit("foo")`, fn will NOT be fired.
     *
     * @param  {String}   type - Event to emit
     * @param  {...Mixed} [args] - Params for the callbacks listening to this event.
     * @return {Thread} this - for chaining purposes
     *
     * @example
     * myThread.emit("foo", "bar", "baz");
     */
    emit (type, ...args) {
        const msg = {
            args,
            type,
            id: this.__id__,
        };

        if (this.__worker__.ready) {
            this.__worker__.postMessage(msg);
        } else {
            this.__worker__.messageQueue.push(msg);
        }
        return this;
    }

    /**
     * Kill a thread by killing it's worker.
     */
    kill () {
        this.__worker__.terminate();
    }

    /**
     * Alternative syntax for creating a new Thread. Otherwise, it's identical to the constructor.
     *
     * @param  {Function} fn - The source for the new thread. MUST be completely self contained.
     * @param  {...Mixed} [args] - Arguments to be passed to the new thread.
     * @return {Thread}
     *
     * @example
     * Thread.start(function () { ... });
     */
    static start (fn, ...args) {
        return new Thread(fn, ...args);
    }
}

export default Thread;
