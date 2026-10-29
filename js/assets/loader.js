"use strict";

// One job: load one image or one JSON file. Failures and timeouts resolve
// to null. They never reject, and they never stop the game.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  var AssetLoader = {
    timeoutMs: 8000
  };

  function settle(work, timeoutMs) {
    var ms = typeof timeoutMs === "number" && timeoutMs >= 0 ? timeoutMs : AssetLoader.timeoutMs;
    return new Promise(function (resolve) {
      var finished = false;
      var timer = null;
      var ctrl = null;
      function finish(value) {
        if (finished) return;
        finished = true;
        if (timer != null) clearTimeout(timer);
        resolve(value == null ? null : value);
      }
      try {
        if (ms > 0 && typeof AbortController === "function") ctrl = new AbortController();
      } catch (err) {
        ctrl = null;
      }
      if (ms > 0) {
        timer = setTimeout(function () {
          try { if (ctrl) ctrl.abort(); } catch (err2) {}
          finish(null);
        }, ms);
      }
      try {
        Promise.resolve(work(ctrl ? ctrl.signal : null)).then(finish, function () { finish(null); });
      } catch (err3) {
        finish(null);
      }
    });
  }

  AssetLoader.json = function (url, timeoutMs) {
    if (!url) return Promise.resolve(null);
    return settle(function (signal) {
      if (typeof fetch !== "function") return null;
      return fetch(url, { signal: signal, credentials: "same-origin" }).then(function (response) {
        if (!response || !response.ok) return null;
        return response.json().then(function (data) {
          return data && typeof data === "object" ? data : null;
        }, function () { return null; });
      }, function () { return null; });
    }, timeoutMs);
  };

  AssetLoader.image = function (url, timeoutMs) {
    if (!url || typeof Image !== "function") return Promise.resolve(null);
    return settle(function (signal) {
      return new Promise(function (resolve) {
        var img = new Image();
        var done = false;
        function finish(value) {
          if (done) return;
          done = true;
          img.onload = null;
          img.onerror = null;
          resolve(value || null);
        }
        if (signal) {
          if (signal.aborted) {
            finish(null);
            return;
          }
          try {
            signal.addEventListener("abort", function () {
              try { img.src = ""; } catch (err) {}
              finish(null);
            });
          } catch (err2) {}
        }
        img.onload = function () {
          finish(img.naturalWidth > 0 ? img : null);
        };
        img.onerror = function () { finish(null); };
        try {
          img.src = url;
        } catch (err3) {
          finish(null);
        }
      });
    }, timeoutMs);
  };

  AssetLoader.images = function (urls, timeoutMs) {
    var list = [];
    var i;
    if (urls && urls.length) {
      for (i = 0; i < urls.length; i++) if (urls[i]) list.push(urls[i]);
    }
    if (!list.length) return Promise.resolve({});
    return Promise.all(list.map(function (url) {
      return AssetLoader.image(url, timeoutMs).then(function (image) {
        return { url: url, image: image };
      });
    })).then(function (rows) {
      var out = {};
      var n;
      for (n = 0; n < rows.length; n++) {
        if (rows[n] && rows[n].image) out[rows[n].url] = rows[n].image;
      }
      return out;
    }).catch(function () { return {}; });
  };

  SF.AssetLoader = AssetLoader;
})();
