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
      };

    postMessage({
      type: "done",
      result: fn.apply(null, ev.data.args)
    });
  }
};