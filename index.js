(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.event_emitter = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /**
     * Create a new Event Emitter, which can be used to emit and listen for events with arbitrary names.
     *
     * NOTE: not using a class, because I need the full src of this to be inside a
     * single function definition that can be stringified easily.
     */
    function EventEmitter() {
        var events = {};

        /**
         * @private
         * @param {String}   type - Event to listen to
         * @param {Function} fn - Callback
         * @param {Object}   [ctx] - Context for the callback
         * @param {Boolean}  once - Should this listener be unbound after firing?
         */
        function addListener(type, fn, ctx, once) {
            if (typeof fn !== "function") {
                throw new TypeError("listener must be a function");
            }

            if (!events[type]) {
                events[type] = [];
            }
            events[type].push({ fn: fn, ctx: ctx, once: once });
        }

        /**
         * Listen for a particular event to be emitted.
         *
         * @param  {String}   type - Event to listen to
         * @param  {Function} fn - Callback
         * @param  {Object}   [ctx] - Context for the callback
         * @return {EventEmitter} this - for chaining purposes
         *
         * @example
         * ee.on("foo", function (bar) { ... });
         * ee.on("foo", function (bar) { ... }, {});
         */
        this.on = function on(type, fn, ctx) {
            addListener(type, fn, ctx, false);
            return this;
        };

        /**
         * Listen for a particular event to be emitted, one time only.
         *
         * @param  {String}   type - Event to listen to
         * @param  {Function} fn - Callback
         * @param  {Object}   [ctx] - Context for the callback
         * @return {EventEmitter} this - for chaining purposes
         *
         * @example
         * ee.once("foo", function (bar) { ... });
         * ee.once("foo", function (bar) { ... }, {});
         */
        this.once = function once(type, fn, ctx) {
            addListener(type, fn, ctx, true);
            return this;
        };

        /**
         * Stop listening for an event. If `fn` is provided, only that listener will
         * be unbound, otherwise it will unbind all listeners for a particular type.
         *
         * @param  {String}   type - Event to stop listening to
         * @param  {Function} fn - Callback
         * @return {EventEmitter} this - for chaining purposes
         *
         * @example
         * ee.off("foo", function (bar) { ... });
         * ee.off("foo");
         */
        this.off = function off(type, fn) {
            var listeners = events[type];
            if (!listeners) {
                return this;
            }

            if (fn) {
                for (var i = 0; i < listeners.length; i += 1) {
                    if (listeners[i].fn === fn) {
                        listeners.splice(i, 1);
                        i -= 1; // reset index, so we don't skip one
                    }
                }
            } else {
                delete events[type];
            }
            return this;
        };

        /**
         * Fire a particular event, with some optional arguments
         * which will be forwarded to any event listeners
         *
         * @param  {String}   type - Event to emit
         * @param  {...Mixed} [args] - Params for the callbacks listening to this event.
         * @return {EventEmitter} this - for chaining purposes
         *
         * @example
         * ee.emit("foo", "bar");
         */
        this.emit = function emit(type) {
            var listeners = events[type];

            if (!listeners || !listeners.length) {
                return this;
            }

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            for (var i = 0; i < listeners.length; i += 1) {
                try {
                    listeners[i].fn.apply(listeners[i].ctx || null, args);
                } catch (err) {
                    console.error(err); // eslint-disable-line no-console
                }
                if (listeners[i].once) {
                    listeners.splice(i, 1);
                    i -= 1; // reset index, so we don't skip one
                }
            }
            return this;
        };
    }

    exports.default = EventEmitter;
});
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "./event_emitter"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("./event_emitter"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.event_emitter);
        global.fallback_thread = mod.exports;
    }
})(this, function (exports, _event_emitter) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _event_emitter2 = _interopRequireDefault(_event_emitter);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var Context = function () {
        function Context(parent) {
            _classCallCheck(this, Context);

            this.__parent__ = parent;
            this.__emitter__ = new _event_emitter2.default();
        }

        _createClass(Context, [{
            key: "on",
            value: function on(type, fn) {
                this.__emitter__.on(type, fn);
                return this;
            }
        }, {
            key: "once",
            value: function once(type, fn) {
                this.__emitter__.once(type, fn);
                return this;
            }
        }, {
            key: "off",
            value: function off(type, fn) {
                this.__emitter__.off(type, fn);
                return this;
            }
        }, {
            key: "emit",
            value: function emit(type) {
                var _parent__$__emitter_;

                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }

                (_parent__$__emitter_ = this.__parent__.__emitter__).emit.apply(_parent__$__emitter_, [type].concat(args));
                return this;
            }
        }, {
            key: "log",
            value: function log() {
                var _console;

                (_console = console).log.apply(_console, arguments);
            }
        }]);

        return Context;
    }();

    var Thread = function () {
        function Thread(fn) {
            var _this = this;

            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            _classCallCheck(this, Thread);

            this.__emitter__ = new _event_emitter2.default();
            this.__context__ = new Context(this);

            setTimeout(function () {
                var result = void 0;
                try {
                    result = fn.apply(_this.__context__, args);
                } catch (err) {
                    _this.__emitter__.emit("error", err.stack);
                }

                if (result) {
                    if (result.then) {
                        result.then(function (data) {
                            return _this.__emitter__.emit("done", data);
                        }, function (err) {
                            return _this.__emitter__.emit("error", err.stack);
                        });
                    } else {
                        _this.__emitter__.emit("done", result);
                    }
                }
            });
        }

        _createClass(Thread, [{
            key: "on",
            value: function on(type, fn) {
                this.__emitter__.on(type, fn);
                return this;
            }
        }, {
            key: "once",
            value: function once(type, fn) {
                this.__emitter__.once(type, fn);
                return this;
            }
        }, {
            key: "off",
            value: function off(type, fn) {
                this.__emitter__.off(type, fn);
                return this;
            }
        }, {
            key: "emit",
            value: function emit(type) {
                var _context__$__emitter;

                for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                    args[_key3 - 1] = arguments[_key3];
                }

                (_context__$__emitter = this.__context__.__emitter__).emit.apply(_context__$__emitter, [type].concat(args));
                return this;
            }
        }, {
            key: "kill",
            value: function kill() {}
        }], [{
            key: "start",
            value: function start(fn) {
                for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                    args[_key4 - 1] = arguments[_key4];
                }

                return new (Function.prototype.bind.apply(Thread, [null].concat([fn], args)))();
            }
        }]);

        return Thread;
    }();

    exports.default = Thread;
});
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "./fallback_thread", "./worker_thread"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("./fallback_thread"), require("./worker_thread"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.fallback_thread, global.worker_thread);
        global.index = mod.exports;
    }
})(this, function (exports, _fallback_thread, _worker_thread) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _fallback_thread2 = _interopRequireDefault(_fallback_thread);

    var _worker_thread2 = _interopRequireDefault(_worker_thread);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    /* eslint-disable no-new-func */
    // http://stackoverflow.com/a/31090240
    var IS_NODE = !new Function("try { return this === window; } catch (e) { return false; }");
    /* eslint-enable no-new-func */

    var Thread = void 0;

    if (IS_NODE) {
        global.Worker = global.require("tiny-worker");
        Thread = _worker_thread2.default;
    } else {
        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
        var createObjectURL = window.URL && window.URL.createObjectURL || window.webkitURL && window.webkitURL.createObjectURL;
        var Blob = window.Blob;
        var BLOB_CONSTRUCTOR = (Blob || false) && new Blob(["test"]).size === 4;

        if (Blob && createObjectURL && (BLOB_CONSTRUCTOR || BlobBuilder)) {
            Thread = _worker_thread2.default;
        } else {
            Thread = _fallback_thread2.default;
        }
    }

    exports.default = Thread;
});
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "./worker_thread_loader"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("./worker_thread_loader"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.worker_thread_loader);
        global.spawn_worker = mod.exports;
    }
})(this, function (exports, _worker_thread_loader) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.spawnWorker = exports.threadPool = undefined;

    var _worker_thread_loader2 = _interopRequireDefault(_worker_thread_loader);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

    // TODO: max thread pool size
    var threadPool = [];

    /**
     * Create a new Worker, with our loader as the source.
     *
     * @private
     */
    function spawnWorker() {
        var worker = new Worker(_worker_thread_loader2.default);

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
        worker.onmessage = function onmessage(ev) {
            var _worker$lastContext$t, _console, _console2;

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
            (_worker$lastContext$t = worker.lastContext.thread.__emitter__).emit.apply(_worker$lastContext$t, [ev.data.type].concat(_toConsumableArray(ev.data.args)));

            // And a few more special cases:
            switch (ev.data.type) {
                // The "done" message is sent if there is an immediate return value from the initial source.
                case "done":
                    // So, since the worker is presumably done, put it back in the pool.
                    threadPool.push(worker);
                    break;
                // The "log" message is sent when the thread calls `this.log(...)`
                case "log":
                    (_console = console).log.apply(_console, _toConsumableArray(ev.data.args)); // eslint-disable-line no-console
                    break;
                // The "error" message is sent when an error is caught inside the thread.
                case "error":
                    (_console2 = console).error.apply(_console2, _toConsumableArray(ev.data.args)); // eslint-disable-line no-console
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
        worker.onerror = function onerror(err) {
            worker.lastContext.thread.__emitter__.emit("error", err);
            console.error(err.message, err.stack); // eslint-disable-line no-console
            worker.terminate();
        };

        return worker;
    }

    exports.threadPool = threadPool;
    exports.spawnWorker = spawnWorker;
});
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "./event_emitter", "./spawn_worker"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("./event_emitter"), require("./spawn_worker"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.event_emitter, global.spawn_worker);
        global.worker_thread = mod.exports;
    }
})(this, function (exports, _event_emitter, _spawn_worker) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _event_emitter2 = _interopRequireDefault(_event_emitter);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var seq = 0;

    var Thread = function () {
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
        function Thread(fn) {
            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            _classCallCheck(this, Thread);

            // If we have any unused workers in our pool, use the oldest one,
            // otherwise, create a new worker.
            if (_spawn_worker.threadPool.length) {
                this.__worker__ = _spawn_worker.threadPool.shift();
            } else {
                this.__worker__ = (0, _spawn_worker.spawnWorker)();
            }

            // Each thread needs a unique id.
            this.__id__ = new Date().getTime().toString() + (seq += 1);

            // Each thread also needs a context
            this.__worker__.contexts[this.__id__] = this.__worker__.lastContext = {
                thread: this
            };

            // And each thread also needs an EventEmitter
            this.__emitter__ = new _event_emitter2.default();

            // The initial message for the worker, containing the source of our self contained method,
            // and our initial params for it.
            var msg = {
                args: args,
                id: this.__id__,
                src: fn.toString(), // TODO: simple static analysis to find undefined references
                type: "source"
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


        _createClass(Thread, [{
            key: "on",
            value: function on(type, fn) {
                this.__emitter__.on(type, fn);
                return this;
            }
        }, {
            key: "once",
            value: function once(type, fn) {
                this.__emitter__.once(type, fn);
                return this;
            }
        }, {
            key: "off",
            value: function off(type, fn) {
                this.__emitter__.off(type, fn);
                return this;
            }
        }, {
            key: "emit",
            value: function emit(type) {
                for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                }

                var msg = {
                    args: args,
                    type: type,
                    id: this.__id__
                };

                if (this.__worker__.ready) {
                    this.__worker__.postMessage(msg);
                } else {
                    this.__worker__.messageQueue.push(msg);
                }
                return this;
            }
        }, {
            key: "kill",
            value: function kill() {
                this.__worker__.terminate();
            }
        }], [{
            key: "start",
            value: function start(fn) {
                for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                    args[_key3 - 1] = arguments[_key3];
                }

                return new (Function.prototype.bind.apply(Thread, [null].concat([fn], args)))();
            }
        }]);

        return Thread;
    }();

    exports.default = Thread;
});
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "./event_emitter"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("./event_emitter"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.event_emitter);
        global.worker_thread_loader = mod.exports;
    }
})(this, function (exports, _event_emitter) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _event_emitter2 = _interopRequireDefault(_event_emitter);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    // The `threadLoader` is the initial source of our worker threads, which will be used
    // to facilitate communication between the worker and the UI, and to load and eval the
    // functions that we want to execute on a Thread. This function has to be fully encapsulated
    // so that it can be serialized into a Blob url.
    function threadLoader() {
        var contexts = {};

        /**
         * Each Thread  will have it's own Context, so that each has it's own event emitters and a
         * consistent, stable, `this`.
         */
        function Context(id) {
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
        Context.prototype.on = function on(type, fn) {
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
        Context.prototype.once = function once(type, fn) {
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
        Context.prototype.off = function off(type, fn) {
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
        Context.prototype.emit = function emit(type) {
            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            postMessage({
                args: args,
                type: type,
                id: this.__id__
            });
            return this;
        };

        /**
         * Forward to our parent thread, a request for logging.
         *
         * @param {...Mixed} args - Arguments for console.log
         */
        Context.prototype.log = function log() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            this.emit.apply(this, ["log"].concat(args));
        };

        /* eslint-disable no-undef */
        onmessage = function onMessage(ev) {
            /* eslint-enable no-undef */
            switch (ev.data.type) {
                // We have received source for a function to execute.
                case "source":
                    {
                        var _ret = function () {
                            // This function will have it's own Context.
                            var context = contexts[ev.data.id] = new Context(ev.data.id);
                            var result = void 0;

                            // Eval the provided source and call the resultant method with our
                            // new context, and the args that were provided.
                            try {
                                /* eslint-disable no-eval */
                                result = eval("(" + ev.data.src + ")").apply(context, ev.data.args);
                                /* eslint-enable no-eval */
                            } catch (err) {
                                context.emit("error", err.stack);
                                return "break";
                            }

                            // If there was a result from the eval, and if that result is not a Promise, then
                            // return that result to the parent, via the "done" event. Otherwise, if it was a
                            // Promise, then wait for the Promise to resolve before returning the result.
                            if (result) {
                                if (result.then) {
                                    result.then(function (data) {
                                        return context.emit("done", data);
                                    }, function (err) {
                                        return context.emit("error", err.stack);
                                    });
                                } else {
                                    context.emit("done", result);
                                }
                            }
                            return "break";
                        }();

                        if (_ret === "break") break;
                    }
                // We have received a request to send a message internally.
                default:
                    {
                        // Look up the context for this message.
                        var _context = contexts[ev.data.id];

                        // Emit the message on the context, and catch any errors that result.
                        try {
                            _context.__emitter__.emit.apply(_context.__emitter__.emit, [ev.data.type].concat(ev.data.args));
                        } catch (err) {
                            _context.emit("error", err.stack);
                        }
                    }}
        };

        // Inform our parent thread that we are ready.
        postMessage({ type: "worker_ready" });
    }

    var loaderSrc = "\n" + _event_emitter2.default + ";\n(" + threadLoader + ")();\n";
    var loaderFunction = "(function () {\n    " + loaderSrc + ";\n})";

    /* eslint-disable no-new-func */
    // http://stackoverflow.com/a/31090240
    var IS_NODE = !new Function("try { return this === window; } catch (e) { return false; }");
    /* eslint-enable no-new-func */

    var workerThreadLoader = void 0;

    if (IS_NODE) {
        workerThreadLoader = eval(loaderFunction); // eslint-disable-line no-eval
    } else {
        // There are several ways to build a blob, and we want to support all of them.
        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
        var createObjectURL = window.URL && window.URL.createObjectURL || window.webkitURL && window.webkitURL.createObjectURL;
        var Blob = window.Blob;
        var BLOB_CONSTRUCTOR = (Blob || false) && new Blob(["test"]).size === 4;

        var loaderBlob = void 0;

        // The simplest (and newest) way to create a blob is to pass an array into the Blob constructor.
        if (BLOB_CONSTRUCTOR) {
            loaderBlob = new Blob([loaderSrc]);

            // If the Blob constructor doesn't accept params, then we need to use the deprecated BlobBuilder.
        } else if (BlobBuilder) {
            var builder = new BlobBuilder();
            builder.append(loaderSrc);
            loaderBlob = builder.getBlob();
        }

        // Convert our Blob into a Blob URL.
        if (createObjectURL) {
            workerThreadLoader = createObjectURL(loaderBlob);
        }
    }

    exports.default = workerThreadLoader;
});
