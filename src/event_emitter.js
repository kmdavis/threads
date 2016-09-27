/**
 * Create a new Event Emitter, which can be used to emit and listen for events with arbitrary names.
 *
 * NOTE: not using a class, because I need the full src of this to be inside a
 * single function definition that can be stringified easily.
 */
function EventEmitter () {
    const events = {};

    /**
     * @private
     * @param {String}   type - Event to listen to
     * @param {Function} fn - Callback
     * @param {Object}   [ctx] - Context for the callback
     * @param {Boolean}  once - Should this listener be unbound after firing?
     */
    function addListener (type, fn, ctx, once) {
        if (typeof fn !== "function") {
            throw new TypeError("listener must be a function");
        }

        if (!events[type]) {
            events[type] = [];
        }
        events[type].push({ fn, ctx, once });
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
    this.on = function on (type, fn, ctx) {
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
    this.once = function once (type, fn, ctx) {
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
    this.off = function off (type, fn) {
        const listeners = events[type];
        if (!listeners) {
            return this;
        }

        if (fn) {
            for (let i = 0; i < listeners.length; i += 1) {
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
    this.emit = function emit (type, ...args) {
        const listeners = events[type];

        if (!listeners || !listeners.length) {
            return this;
        }

        for (let i = 0; i < listeners.length; i += 1) {
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

export default EventEmitter;
