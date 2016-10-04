```
        ,----,
      ,/   .`|
    ,`   .'  :  ,---,
  ;    ;     /,--.' |                                       ,---,
.'___,/    ,' |  |  :      __  ,-.                        ,---.'|          .--.
|    :     |  :  :  :    ,' ,'/ /|                        |   | :        .--,`|  .--.--.
;    |.';  ;  :  |  |,--.'  | |' | ,---.     ,--.--.      |   | |        |  |.  /  /    '
`----'  |  |  |  :  '   ||  |   ,'/     \   /       \   ,--.__| |        '--`_ |  :  /`./
    '   :  ;  |  |   /' :'  :  / /    /  | .--.  .-. | /   ,'   |        ,--,'||  :  ;_
    |   |  '  '  :  | | ||  | ' .    ' / |  \__\/: . ..   '  /  |        |  | ' \  \    `.
    '   :  |  |  |  ' | :;  : | '   ;   /|  ," .--.; |'   ; |:  |        :  | |  `----.   \
    ;   |.'   |  :  :_:,'|  , ; '   |  / | /  /  ,.  ||   | '/  '___   __|  : ' /  /`--'  /
    '---'     |  | ,'     ---'  |   :    |;  :   .'   \   :    :/  .\.'__/\_: |'--'.     /
              `--''              \   \  / |  ,     .-./\   \  / \  ; |   :    :  `--'---'
                                  `----'   `--`---'     `----'   `--" \   \  /
                                                                       `--`-'
```
===========================================================================================

Threads.js makes it easy to move your number crunching code into a separate thread.
It does so by using web workers, without requiring a separate file for your worker.
Works in both the browser and in node.

===========================================================================================

## Installation:

`npm install threadsjs`

### Node

In node, you can just `require("threadsjs");`

### Browser

In the browser, you need to include `./dist/index.min.js` in your frontend build. Having done so, you can then require Threads via AMD's require or via a global variable named `Thread`.

===========================================================================================

## Usage:

```js
import Thread from "threadsjs";

const myThread = new Thread(function (m) {
    function slowFibonacci (n) {
        if (n <= 1) {
            return n;
        } else {
            return slowFibonacci(n - 2) + slowFibonacci(n - 1);
        }
    }
    return slowFibonacci(m);
}, 1000000).on("done", (f) => console.log("Fibonacci eventually finished", f));
```

Without using threads (workers under the hood) this would block the UI thread for… well… a long time, but with threads, the ui remains usable (even while one of your CPU cores gets pegged).

If the thread fn doesn't return anything, the thread will just keep running, and can listen to and emit events with it's parent.
e.g.

```js
import Thread from "threadsjs";

const myThread = new Thread(function () {
    let seq = 0;
    const handle = setInterval(() => {
        this.emit("tick", seq);
        seq += 1;
    }, 1000);
    this.on("tock", () => {
        clearInterval(handle);
    });
}).on("tick", seq => console.log("tick", seq));

setTimeout(() => myThread.emit("tock"), 30 * 1000);
```

And if the thread fn returns a Promise, it'll wait on that promise before emitting "done"

```js
import Thread from "threadsjs";

const myThread = new Thread(function () {
    return new Promise(resolve => {
        let seq = 0;
        const handle = setInterval(() => {
            this.emit("tick", seq);
            seq += 1;
        }, 1000);
        this.on("tock", () => {
            clearInterval(handle);
            resolve();
        });
    });
})
    .on("tick", seq => console.log("tick", seq))
    .on("done", () => console.log("it's done"));

setTimeout(() => myThread.emit("tock"), 30 * 1000);
```

===========================================================================================

## API:

### In Parent Thread:

#### **new Thread** _(fn: Function[, ...args])_ -> _this_

> Execute `fn(...args)` in a new thread, emitting the result as the `done` event.

#### **#on** _(type: String, fn: Function)_ -> _this_

> Listen for an event of `type` coming from the worker thread.

#### **#once** _(type: String, fn: Function)_ -> _this_

> Listen for the the next event of `type` coming from the worker thread.

#### **#off** _(type: String[, fn: Function])_ -> _this_

> Stop listening for an event. If no `fn` is passed in, will stop all event listeners of `type`, otherwise will only stop that specific `fn`. If `fn` is listening more than once, all instances of that event will be stopped.

#### **#emit** _(type: String, ...args)_ -> _this_

> Fire a particular `type` of event into the worker thread, with the supplied `args` passed to each listener. The `args` must be json serializable.

#### **#kill** _()_

> Kill the thread.

#### **.start** _(fn: Function[, ...args])_ -> Thread

> Alternative syntax for creating a new Thread. Params are identical to the constructor.

### In Worker Thread:

#### **this.on** _(type: String, fn: Function)_ -> _this_

> Listen for an event of `type` coming from the parent thread.

#### **this.once** _(type: String, fn: Function)_ -> _this_

> Listen for an event of `type` coming from the parent thread.

#### **this.off** _(type: String[, fn: Function])_ -> _this_

> Stop listening for an event. If no `fn` is passed in, will stop all event listeners of `type`, otherwise will only stop that specific `fn`. If `fn` is listening more than once, all instances of that event will be stopped.

#### **this.emit** _(type: String, ...args)_ -> _this_

> Fire a particular `type` of event back out to the parent thread, with the supplied `args` passed to each listener. The `args` must be json serializable.

### Builtin Event Types:

#### **done** _(result: Mixed)_

> Fired when the initial function of a thread is done.

#### **log** _(...args)_

#### **error** _(stack: String)_
