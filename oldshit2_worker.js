onmessage = function (ev) {
  postMessage((function (max) {
    //console.log("Doing something that might take awhile");
    var result = Math.random() * 1000;
    for (var i = 0; i < max; i += 1) {
      result = Math.pow(result % (1024 * 1024) + 1, 2);
    }
    return result;
  }(ev.data)));
};
