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
    // NOTE: not using a class, because I need the full src of this to be inside a
    // single function definition that can be stringified easily.
    function EventEmitter() {
        var events = {};

        function addListener(type, fn, ctx, once) {
            if (typeof fn !== "function") {
                throw new TypeError("listener must be a function");
            }

            if (!event[type]) {
                events[type] = [];
            }
            events[type].push({ fn: fn, ctx: ctx, once: once });
        }

        this.on = function on(type, fn, ctx) {
            addListener(type, fn, ctx, false);
        };

        this.once = function once(type, fn, ctx) {
            addListener(type, fn, ctx, true);
        };

        this.off = function off(type, fn) {
            var listeners = events[type];
            if (!listeners) {
                return;
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
        };

        this.emit = function emit(type) {
            var listeners = events[type];

            if (!listeners || !listeners.length) {
                return;
            }

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            for (var i = 0; i < listeners.length; i += 1) {
                listeners[i].fn.apply(listeners[i].ctx || null, args);
                if (listeners[i].once) {
                    listeners.splice(i, 1);
                    i -= 1; // reset index, so we don't skip one
                }
            }
        };
    }

    exports.default = EventEmitter;
});
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
        global.fallback_thread = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

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

    var Thread = function () {
        function Thread(fn) {
            _classCallCheck(this, Thread);
        }

        _createClass(Thread, null, [{
            key: "start",
            value: function start(fn) {
                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
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
        define(["exports", "./fallback_thread", "./thread"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("./fallback_thread"), require("./thread"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.fallback_thread, global.thread);
        global.index = mod.exports;
    }
})(this, function (exports, _fallback_thread, _thread) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _fallback_thread2 = _interopRequireDefault(_fallback_thread);

    var _thread2 = _interopRequireDefault(_thread);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    // Feature Detection:
    /* eslint-disable no-new-func */
    // http://stackoverflow.com/a/31090240
    var IS_NODE = !new Function("try { return this === window; } catch (e) { return false; }");
    /* eslint-enable no-new-func */

    var BlobBuilder = undefined.BlobBuilder || undefined.WebKitBlobBuilder;
    var createObjectURL = undefined.URL && undefined.URL.createObjectURL || undefined.webkitURL && undefined.webkitURL.createObjectURL;
    var Blob = undefined.Blob;
    var BLOB_CONSTRUCTOR = (Blob || false) && new Blob(["test"]).size === 4;

    var Thread = void 0;

    if (IS_NODE) {
        Thread = global.require("../lib/node_thread");
    } else if (Blob && createObjectURL && (BLOB_CONSTRUCTOR || BlobBuilder)) {
        Thread = _thread2.default;
    } else {
        Thread = _fallback_thread2.default;
    }

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
        global.thread = mod.exports;
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

    var BlobBuilder = undefined.BlobBuilder || undefined.WebKitBlobBuilder;
    var createObjectURL = undefined.URL && undefined.URL.createObjectURL || undefined.webkitURL && undefined.webkitURL.createObjectURL;
    var Blob = undefined.Blob;
    var BLOB_CONSTRUCTOR = (Blob || false) && new Blob(["test"]).size === 4;

    function threadLoader() {
        var contexts = {};

        var Context = function () {
            function Context(id) {
                _classCallCheck(this, Context);

                this.__id__ = id;
                this.__emiter__ = new _event_emitter2.default();
            }

            _createClass(Context, [{
                key: "on",
                value: function on(type, fn) {
                    this.__emiter__.on(type, fn);
                }
            }, {
                key: "once",
                value: function once(type, fn) {
                    this.__emiter__.once(type, fn);
                }
            }, {
                key: "off",
                value: function off(type, fn) {
                    this.__emiter__.off(type, fn);
                }
            }, {
                key: "emit",
                value: function emit(type) {
                    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                        args[_key - 1] = arguments[_key];
                    }

                    postMessage({
                        args: args,
                        type: type,
                        id: this.__id__
                    });
                }
            }]);

            return Context;
        }();

        /* eslint-disable no-undef */
        onmessage = function onMessage(ev) {
            var _contexts$ev$data$id$;

            /* eslint-enable no-undef */
            switch (ev.data.type) {
                case "source":
                    {
                        var _ret = function () {
                            var context = contexts[ev.data.id] = new Context(ev.data.id);
                            /* eslint-disable no-eval */
                            var result = eval("(" + ev.data.src + ")").apply(context, ev.data.args);
                            /* eslint-enable no-eval */

                            if (result) {
                                if (result.then) {
                                    result.then(function (data) {
                                        return context.emit("done", data);
                                    });
                                } else {
                                    context.emit("done", result);
                                }
                            }
                            return "break";
                        }();

                        if (_ret === "break") break;
                    }
                default:
                    (_contexts$ev$data$id$ = contexts[ev.data.id].__emitter__).emit.apply(_contexts$ev$data$id$, [ev.data.type].concat(_toConsumableArray(ev.data.args)));
            }
        };
    }

    var loaderBlob = void 0;
    var loaderSrc = void 0;

    if (BLOB_CONSTRUCTOR) {
        loaderBlob = new Blob([_event_emitter2.default.toString(), threadLoader.toString()]);
    } else if (BlobBuilder) {
        var builder = new BlobBuilder();
        builder.append(_event_emitter2.default.toString());
        builder.append(threadLoader.toString());
        loaderBlob = builder.getBlob();
    }

    if (createObjectURL) {
        loaderSrc = createObjectURL(loaderBlob);
    }

    // TODO: max thread pool size
    var threadPool = [];
    var seq = 0;

    function spawnWorker() {
        var worker = new Worker(loaderSrc);

        worker.contexts = {};
        worker.lastContext = null;

        worker.onmessage = function onmessage(ev) {
            var _worker$lastContext$_;

            worker.lastContext = worker.contexts[ev.data.id];
            (_worker$lastContext$_ = worker.lastContext.__emitter__).emit.apply(_worker$lastContext$_, [ev.data.type].concat(_toConsumableArray(ev.data.args)));

            if (ev.data.type === "done") {
                threadPool.push(worker);
            }
        };

        worker.onerror = function onerror(err) {
            worker.lastContext.__emitter__.emit("error", err);
            worker.terminate();
        };

        return worker;
    }

    var Thread = function () {
        function Thread(fn) {
            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            _classCallCheck(this, Thread);

            if (threadPool.length) {
                this.worker = threadPool.shift();
            } else {
                this.worker = spawnWorker();
            }

            this.__id__ = new Date().getTime().toString() + (seq += 1);

            this.__worker__[this.__id__] = this.__worker__.lastContext = {
                result: null,
                thread: this
            };
            this.__emitter__ = new _event_emitter2.default();

            this.__worker__.postMessage({
                args: args,
                id: this.__id__,
                src: fn.toString(),
                type: "source"
            });
        }

        _createClass(Thread, [{
            key: "on",
            value: function on(type, fn) {
                this.__emitter__.on(type, fn);
            }
        }, {
            key: "once",
            value: function once(type, fn) {
                this.__emitter__.once(type, fn);
            }
        }, {
            key: "off",
            value: function off(type, fn) {
                this.__emitter__.off(type, fn);
            }
        }, {
            key: "emit",
            value: function emit(type) {
                for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                    args[_key3 - 1] = arguments[_key3];
                }

                this.__worker__.postMessage({
                    args: args,
                    type: type,
                    id: this.__id__
                });
            }
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
