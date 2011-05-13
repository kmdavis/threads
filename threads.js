(function () {
  var bb = new (window.BlobBuilder || window.WebKitBlobBuilder)(),
    threadPool = [],
    loaderSrc = "";

  bb.append("(" +
    (function () {
      console = {
        log: function () {
          postMessage({
            type: "log",
            message: [].slice.apply(arguments)
          });
        }
      };
      onmessage = function (ev) {
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
  }

  window.Thread = {
    start: function (fn, args) {
      var
        worker,
        result = null,
        events = {
          done: [],
          fail: []
        }, i;

      if (Worker || "" === loaderSrc) {
        if (0 === threadPool.length) {
          worker = new Worker(loaderSrc);

          worker.onmessage = function (ev) {
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

          worker.onerror = function (e) {
            for (i = 0; i < events.fail.length; i += 1) {
              events.fail[i](e);
            }
            worker.terminate();
          };
        } else {
          worker = threadPool.shift();
        }

        worker.postMessage({ // this assumes complex data is allowed.  need a fallback / detection system
          type: "source",
          src: fn.toString(),
          args: args
        });
      } else {
        try {
          result = fn.apply(null, args);
          for (i = 0; i < events.done.length; i += 1) {
            events.done[i](result);
          }
        } catch (e) {
          for (i = 0; i < events.fail.length; i += 1) {
            events.fail[i](e);
          }
          throw e;
        }
      }

      return {
        done: function (fn) {
          if (result) {
            fn(result);
          } else {
            events.done.push(fn);
          }
          return this;
        },
        fail: function (fn) {
          events.fail.push(fn);
          return this;
        },
        kill: function () {
          if (worker) {
            worker.terminate();
          }
        }
      }
    }
  };
}());
