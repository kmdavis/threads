import EventEmitter from "./event_emitter";
import { threadPool, spawnWorker } from "./spawn_worker";

let seq = 0;

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
     * Create a promise that will resolve if "done" is emitted, and reject if "error" is emitted.
     *
     * @return {Promise}
     *
     * @example
     * myThread.toPromise().then(result => { ... });
     */
    toPromise () {
        return new Promise((resolve, reject) => {
            this.on("done", resolve);
            this.on("error", reject);
        });
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
