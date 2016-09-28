import loaderSrc from "./worker_thread_loader";

// TODO: max thread pool size
const threadPool = [];

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

export { threadPool, spawnWorker };
