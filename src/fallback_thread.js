import EventEmitter from "./event_emitter";

class Context {
    constructor (parent) {
        this.__parent__ = parent;
        this.__emitter__ = new EventEmitter();
    }

    on (type, fn) {
        this.__emitter__.on(type, fn);
        return this;
    }

    once (type, fn) {
        this.__emitter__.once(type, fn);
        return this;
    }

    off (type, fn) {
        this.__emitter__.off(type, fn);
        return this;
    }

    emit (type, ...args) {
        this.__parent__.__emitter__.emit(type, ...args);
        return this;
    }

    log (...args) {
        console.log(...args);
    }
}

class Thread {
    constructor (fn, ...args) {
        this.__emitter__ = new EventEmitter();
        this.__context__ = new Context(this);

        setTimeout(() => {
            let result;
            try {
                result = fn.apply(this.__context__, args);
            } catch (err) {
                this.__emitter__.emit("error", err.stack);
            }

            if (result) {
                if (result.then) {
                    result.then(
                        data => this.__emitter__.emit("done", data),
                        err => this.__emitter__.emit("error", err.stack)
                    );
                } else {
                    this.__emitter__.emit("done", result);
                }
            }
        });
    }

    on (type, fn) {
        this.__emitter__.on(type, fn);
        return this;
    }

    once (type, fn) {
        this.__emitter__.once(type, fn);
        return this;
    }

    off (type, fn) {
        this.__emitter__.off(type, fn);
        return this;
    }

    emit (type, ...args) {
        this.__context__.__emitter__.emit(type, ...args);
        return this;
    }

    toPromise () {
        return new Promise((resolve, reject) => {
            this.on("done", resolve);
            this.on("error", reject);
        });
    }

    kill () {} // noop

    static start (fn, ...args) {
        return new Thread(fn, ...args);
    }
}

export default Thread;
