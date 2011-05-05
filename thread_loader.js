onmessage = function (ev) {
  if ("source" === ev.data.type) {
    var
      fn = eval("(" + ev.data.src + ")");
      console = {
        log: function () {
          postMessage({
            type: "log",
            message: [].slice.apply(arguments)
          });
        }
      },
      message = function (msg) {
        postMessage({
          type: "log",
          message: msg
        });
      };

    try {
      postMessage({
        type: "done",
        result: fn.apply(null, ev.data.args)
      });
    } catch (e) {
      postMessage({
        type: "error",
        error: error
      });
    }
  } else if ("message" === ev.data.type) {
    // todo
  }
};