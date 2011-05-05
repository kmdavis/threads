(function (loaderSrc) {
  var fakeWorker = function (fn, args) {
    // todo
    setInterval(function () {
      fn.apply(null, args);
    });
  };
  
  window.Thread = {
    start: function (fn, args) {
      var
        worker,
        events = {
          done: [],
          message: []
        };
      if (Worker) {
        worker = new Worker(loaderSrc);

        worker.addEventListener("message", function (ev) {
          var i, args;

          if ("done" === ev.data.type) {
            for (i = 0; i < events.done.length; i += 1) {
              events.done[i](ev.data.result);
            }
          } else if ("message" === ev.data.type) {
            for (i = 0; i < events.message.length; i += 1) {
              events.message[i](ev.data.msg);
            }
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
                case 6:
                  console.log(args[0], args[1], args[2], args[3], args[4], args[5]);
                  break;
                case 7:
                  console.log(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
                  break;
                case 8:
                  console.log(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
                  break;
                case 9:
                  console.log(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
                  break;
                default:
                  console.log(args);
                }
              }
            }
          } else if ("error" === ev.data.type) {
            throw ev.data.error;
          }
        }, false);

        //setTimeout(function () {
          worker.postMessage({ // this assumes complex data is allowed.  need a fallback / detection system
            type: "source",
            src: fn.toString(),
            args: args
          });
        //});
      } else {
        fakeWorker(fn, args);
      }

      return {
        done: function (fn) {
          events.done.push(fn);
          return this;
        },
        message: function (fn) {
          events.message.push(fn);
          return this;
        },
        tell: function (msg) {
          if (worker) {
            worker.postMessage({
              type: "message",
              data: msg
            });
          } else {
            // todo
          }
          return this;
        },
        kill: function () {
          if (worker) {
            worker.terminate();
          } else {
            // todo
          }
        }
      }
    }
  };
}("thread_loader.js"));