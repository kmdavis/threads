import EventEmitter from "./event_emitter";

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

const loaderSrc = `
${EventEmitter};
(${threadLoader})();
`;
const loaderFunction = `(function () {
    ${loaderSrc};
})`;

/* eslint-disable no-new-func */
// http://stackoverflow.com/a/31090240
const IS_NODE = !(new Function("try { return this === window; } catch (e) { return false; }"));
/* eslint-enable no-new-func */

let workerThreadLoader;

if (IS_NODE) {
    workerThreadLoader = eval(loaderFunction); // eslint-disable-line no-eval
} else {
    // There are several ways to build a blob, and we want to support all of them.
    const BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
    const createObjectURL = (window.URL && window.URL.createObjectURL) ||
        (window.webkitURL && window.webkitURL.createObjectURL);
    const Blob = window.Blob;
    const BLOB_CONSTRUCTOR = (Blob || false) && (new Blob(["test"]).size === 4);

    let loaderBlob;

    // The simplest (and newest) way to create a blob is to pass an array into the Blob constructor.
    if (BLOB_CONSTRUCTOR) {
        loaderBlob = new Blob([loaderSrc]);

    // If the Blob constructor doesn't accept params, then we need to use the deprecated BlobBuilder.
    } else if (BlobBuilder) {
        const builder = new BlobBuilder();
        builder.append(loaderSrc);
        loaderBlob = builder.getBlob();
    }

    // Convert our Blob into a Blob URL.
    if (createObjectURL) {
        workerThreadLoader = createObjectURL(loaderBlob);
    }
}

export default workerThreadLoader;
