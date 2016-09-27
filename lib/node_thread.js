import Worker from "tiny-worker";

class Thread {
    constructor (fn, ...args) {
        // TODO
    }

    static start (fn, ...args) {
        return new Thread(fn, ...args);
    }
}

export default Thread;
