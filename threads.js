(function threadWrapper () {
  if (window.Worker && (window.BlobBuilder || window.WebKitBlobBuilder) && (window.createBlobURL || window.webkitURL)) {
    var bb, threadPool = [], loaderSrc;

    if (window.BlobBuilder) {
      bb = new BlobBuilder();
    } else if (window.WebKitBlobBuilder) {
      bb = new WebKitBlobBuilder();
    } else {
      throw new Error("No Blob Builder Found");
    }

    bb.append("(" +
      (function threadLoader () {
        console = {
          log: function log () {
            postMessage({
              type: "log",
              message: [].slice.apply(arguments)
            });
          }
        };
        onmessage = function onMessage (ev) {
          if ("source" === ev.data.type) {
            postMessage({
              type: "done",
              result: eval("(" + ev.data.src + ")").apply(null, ev.data.args)
            });
          }
        };
      }).toString() + "())");

    if (window.createBlobURL) {
      loaderSrc = createBlobURL(bb.getBlob());
    } else if (window.webkitURL) {
      loaderSrc = webkitURL.createObjectURL(bb.getBlob());
    } else {
      throw new Error("No means to create a Blob URL");
    }

    // Semi Fake Threading:  Execute in Worker
    window.Thread = function Thread (fn, args) {
      var
        worker = null,
        result = null,
        failure = null,
        events = {
          done: [],
          fail: []
        }, i;

      if (0 === threadPool.length) {
        worker = new Worker(loaderSrc);

        worker.onmessage = function onmessage (ev) {
          var args;

          if ("done" === ev.data.type) {
            result = ev.data.result;
            for (i = 0; i < events.done.length; i += 1) {
              events.done[i](result);
            }
            threadPool.push(worker);
          } else if ("log" === ev.data.type) {
            if (window.console && console.log) {
              args = ev.data.message;
              try {

                // Firefox and Opera support using apply on native functions
                console.log.apply(this, args);

              } catch (e) {

                // IE and Webkit do not allow using apply on native functions, so, we have to do this the hard and ugly way
                switch (args.length) {
                case 1:
                  console.log(args[0]);
                  break;
                case 2:
                  console.log(args[0], args[1]);
                  break;
                case 3:
                  console.log(args[0], args[1], args[2]);
                  break;
                case 4:
                  console.log(args[0], args[1], args[2], args[3]);
                  break;
                case 5:
                  console.log(args[0], args[1], args[2], args[3], args[4]);
                  break;
                default:
                  console.log(args);
                }
              }
            }
          }
        };

        worker.onerror = function onerror (e) {
          failure = e;
          for (i = 0; i < events.fail.length; i += 1) {
            events.fail[i](e);
          }
          worker.terminate();
        };
      } else {
        worker = threadPool.shift();
      }

      this.done = function done (fn) {
        if (result) {
          fn(result);
        } else {
          events.done.push(fn);
        }

        return this;
      };
      this.fail = function fail (fn) {
        if (failure) {
          fn(failure);
        } else {
          events.fail.push(fn);
        }

        return this;
      };
      this.kill = function kill () {
        worker.terminate();
      };

      worker.postMessage({ // this assumes complex data is allowed.  need a fallback / detection system
        type: "source",
        src: fn.toString(),
        args: args
      });
    };

    Thread.usesWorkers = true;
  } else {

    // Really Fake Threading:  Execute in UI Thread
    window.Thread = function Thread (fn, args) {
      var
        result = null,
        failure = null,
        events = {
          done: [],
          fail: []
        }, i;

      try {
        result = fn.apply(null, args);
        for (i = 0; i < events.done.length; i += 1) {
          events.done[i](result);
        }
      } catch (e) {
        failure = e;
        for (i = 0; i < events.fail.length; i += 1) {
          events.fail[i](e);
        }
        throw e;
      }

      this.done = function done (fn) {
        if (result) {
          fn(result);
        } else {
          events.done.push(fn);
        }

        return this;
      };
      this.fail = function fail (fn) {
        if (failure) {
          fn(failure);
        } else {
          events.fail.push(fn);
        }

        return this;
      };
      this.kill = function kill () {};
    };

    Thread.usesWorkers = false;
  }

  window.Thread.start = function start (fn, args) {
    return new Thread(fn, args);
  };
}());
