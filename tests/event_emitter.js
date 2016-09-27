/* eslint-disable func-names */

import EventEmitter from "../src/event_emitter";

describe("EventEmitter", () => {
    it("should support basic pub/sub behavior", () => {
        const ee = new EventEmitter();
        let called = false;
        let callCount = 0;
        ee.on("foo", (a, b) => {
            called = true;
            callCount += 1;
            a.should.equal("hi");
            b.should.equal("world");
        });
        called.should.be.false;
        callCount.should.equal(0);
        ee.emit("foo", "hi", "world");
        called.should.be.true;
        callCount.should.equal(1);
        ee.emit("foo", "hi", "world");
        callCount.should.equal(2);
    });

    it("should be able to bind multiple fn", () => {
        const ee = new EventEmitter();
        let calledA = false;
        let calledB = false;
        ee.on("foo", () => {
            calledA = true;
        });
        ee.on("foo", () => {
            calledB = true;
        });
        calledA.should.be.false;
        calledB.should.be.false;
        ee.emit("foo");
        calledA.should.be.true;
        calledB.should.be.true;
    });

    it("should not fire for unbound events", () => {
        const ee = new EventEmitter();
        let called = false;
        ee.on("foo", () => {
            called = true;
        });
        called.should.be.false;
        ee.emit("bar");
        called.should.be.false;
    });

    it("should be able to unbind", () => {
        const ee = new EventEmitter();
        let called = false;
        ee.on("foo", () => {
            called = true;
        });
        called.should.be.false;
        ee.off("foo");
        ee.emit("foo");
        called.should.be.false;
    });

    it("should be able to unbind a single fn", () => {
        const ee = new EventEmitter();
        let calledA = false;
        let calledB = false;
        ee.on("foo", () => {
            calledA = true;
        });
        const b = () => {
            calledB = true;
        };
        ee.on("foo", b);
        calledA.should.be.false;
        calledB.should.be.false;
        ee.off("foo", b);
        ee.emit("foo");
        calledA.should.be.true;
        calledB.should.be.false;
    });

    it("should be able to listen once", () => {
        const ee = new EventEmitter();
        let callCount = 0;
        ee.once("foo", () => {
            callCount += 1;
        });
        callCount.should.equal(0);
        ee.emit("foo");
        callCount.should.equal(1);
        ee.emit("foo");
        callCount.should.equal(1);
    });

    it("should be serializable as a class", () => {
        /* eslint-disable no-eval */
        const EE2 = eval(`(${EventEmitter.toString()})`);
        /* eslint-enable no-eval */

        const ee = new EE2();
        let callCount = 0;
        ee.on("foo", () => {
            callCount += 1;
        });
        ee.emit("foo");
        ee.emit("foo");
        callCount.should.equal(2);
    });

    it("should not blow up if a callback errors", () => {
        const ee = new EventEmitter();
        let called = false;
        ee.on("foo", () => { throw new Error(); });
        ee.on("foo", () => { called = true; });
        called.should.false;
        ee.emit("foo");
        called.should.be.true;
    });
});
