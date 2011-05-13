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