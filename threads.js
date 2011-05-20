(function threadWrapper () {
  if (window.Worker && (window.BlobBuilder || window.WebKitBlobBuilder) && (window.createBlobURL || window.URL || window.webkitURL)) {
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

        var listeners = {};

        onmessage = function onMessage (ev) {
          var i, listening, context = {
            listen: function (fn) {
              listening.push(fn);
            },

            tell: function () {
              postMessage({
                type: "tell",
                id: ev.data.id,
                args: [].slice.apply(arguments)
              });
            }
          };

          if ("source" === ev.data.type) {
            listening = listeners[ev.data.id] = [],

            postMessage({
              type: "done",
              id: ev.data.id,
              result: eval("(" + ev.data.src + ")").apply(context, ev.data.args)
            });

          } else if ("tell" === ev.data.type) {

            listening = listeners[ev.data.id];
            for (i = 0; i < listening.length; i += 1) {
              listening[i].apply(context, ev.data.args);
            }
          }
        };
      }).toString() + "())");

    if (window.createBlobURL) { // W3C
      loaderSrc = createBlobURL(bb.getBlob());
    } else if (window.URL) { // Firefox
      loaderSrc = URL.createObjectURL(bb.getBlob());
    } else if (window.webkitURL) { // Chrome
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
          fail: [],
          listen: []
        }, i;

      if (0 === threadPool.length) {
        worker = new Worker(loaderSrc);
      } else {
        worker = threadPool.shift();
      }
      
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
        } else if ("tell" === ev.data.type) {
          for (i = 0; i < events.listen.length; i += 1) {
            events.listen[i].apply(null, ev.data.args);
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

      this.done = function done (fn) {
        if (result) {
          fn(result);
        } else {
          events.done.push(fn);
        }

        return this;
      };

      this.listen = function listen (fn) {
        events.listen.push(fn);
        return this;
      };

      this.tell = function tell () {
        worker.postMessage({
          type: "tell",
          id: "only", // todo
          args: [].slice.apply(arguments)
        });

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
        id: "only", // todo
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
          fail: [],
          listen: []
        },
        i,
        context = {
          tell: function () {
            var args = [].slice.apply(arguments);
            for (i = 0; i < events.listen.length; i += 1) {
              events.listen[i].apply(null, args);
            }
          },

          listen: function (fn) {
            listening.push(fn);
          }
        },
        listening = [];

      try {
        result = fn.apply(context, args);

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

      this.listen = function listen (fn) {
        events.listen.push(fn);
        return this;
      };

      this.tell = function tell () {
        var args = [].slice.apply(arguments);
        for (i = 0; i < listening.length; i += 1) {
          listening[i].apply(context, args);
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
