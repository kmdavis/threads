/* eslint-disable func-names */

import Thread from "../src/fallback_thread";

describe("Fallback Threads", () => {
    describe("#constructor", () => {
        it("should execute and emit done", done => {
            new Thread(() => "this is a simple test").on("done", result => {
                result.should.equal("this is a simple test");
                done();
            });
        });

        it("should execute on the main thread", done => {
            new Thread(() => {
                try {
                    window.foo;
                } catch (e) {
                    return "window is undefined";
                }
                return "window is defined";
            }).on("done", result => {
                result.should.equal("window is defined");
                done();
            });
        });

        it("should pass messages from the worker to the master", done => {
            let fooCount = 0;
            new Thread(function () {
                this.emit("foo");
                this.emit("foo");
                this.emit("foo");
                this.emit("bar");
            })
                .on("foo", () => {
                    fooCount += 1;
                })
                .on("bar", () => {
                    fooCount.should.equal(3);
                    done();
                });
        });

        it("should pass messages from the master to the worker", done => {
            const t = new Thread(function () {
                this.on("foo", () => {
                    this.emit("bar");
                });
            });
            t.on("bar", () => {
                true.should.be.true;
                done();
            });
            setTimeout(() => t.emit("foo"));
        });
    });

    describe("#toPromise", () => {
        it("should return a Promise that resolves if the thread emits 'done'", () =>
            new Thread(() => "foo").toPromise()
                .should.eventually.equal("foo")
        );

        it("should return a Promise that rejects if the thread emits 'error'", () =>
            new Thread(() => { throw new Error(); }).toPromise()
                .should.eventually.be.rejected
        );
    });

    describe(".start", () => {
        it("should create a new Thread", done => {
            Thread.start(() => "this is a simple test").on("done", result => {
                result.should.equal("this is a simple test");
                done();
            });
        });
    });
});
