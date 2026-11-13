"use strict";

// ChoiceBox shows the choices, takes one tap or key, returns that id,
// and removes itself. js/dialogue.js is the only caller.

var SF = window.SF || {};
window.SF = SF;

var SPEC = {
  margin: 8,
  inset: 16,
  slice: 16,
  statusH: 24,
  gap: 4,
  targetH: 44,
  maxW: 420,
  // Below #rotate (80) so the portrait gate stays readable; above #dialogue (7).
  zIndex: 20,
  panel: "assets/ui/choicebox-panel.png",
  cursor: "assets/ui/choice-cursor.png"
};

SF.ChoiceBox = {
  SPEC: SPEC,
  _live: null,
  _css: "",

  hits: function (a, b) {
    if (!a || !b) return false;
    if (!(a.w > 0) || !(a.h > 0) || !(b.w > 0) || !(b.h > 0)) return false;
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  layout: function (vw, vh, count, text, showStatus) {
    var n = count | 0;
    if (n < 1) n = 1;
    vw = vw > 0 ? vw : 0;
    vh = vh > 0 ? vh : 0;
    var statusOn = !!showStatus;
    var statusH = statusOn ? SPEC.statusH : 0;
    var gaps = statusOn ? n : Math.max(0, n - 1);
    var boxW = Math.min(SPEC.maxW, vw - SPEC.margin * 2);
    if (!(boxW > 0)) boxW = vw > 0 ? vw : 1;
    var boxH = SPEC.inset * 2 + statusH + n * SPEC.targetH + gaps * SPEC.gap;
    var maxH = vh - SPEC.margin * 2;
    if (maxH > 0 && boxH > maxH) boxH = maxH;
    if (!(boxH > 0)) boxH = 1;
    var boxX = Math.floor((vw - boxW) / 2);
    if (boxX < 0) boxX = 0;
    var boxY = vh - SPEC.margin - boxH;
    if (text && text.w > 0 && text.h > 0) {
      var aboveY = Math.floor(text.y - SPEC.margin - boxH);
      var above = { x: boxX, y: aboveY, w: boxW, h: boxH };
      var rightX = Math.ceil(text.x + text.w + SPEC.margin);
      var rightW = Math.min(SPEC.maxW, vw - SPEC.margin - rightX);
      var rightY = Math.max(SPEC.margin, Math.min(Math.floor(text.y), vh - SPEC.margin - boxH));
      var right = { x: rightX, y: rightY, w: rightW, h: boxH };
      if (aboveY >= SPEC.margin && !SF.ChoiceBox.hits(above, text)) {
        boxY = aboveY;
      } else if (rightW >= SPEC.targetH && !SF.ChoiceBox.hits(right, text)) {
        boxX = right.x;
        boxY = right.y;
        boxW = right.w;
      } else if (aboveY >= 0) {
        boxY = aboveY;
      }
    }
    if (boxX < 0) boxX = 0;
    if (boxY < 0) boxY = 0;
    if (boxX + boxW > vw) boxW = Math.max(1, vw - boxX);
    if (boxY + boxH > vh) boxH = Math.max(1, vh - boxY);
    var innerX = boxX + SPEC.inset;
    var innerW = boxW - SPEC.inset * 2;
    if (innerW < 1) innerW = 1;
    var y0 = boxY + SPEC.inset + statusH + (statusOn ? SPEC.gap : 0);
    var targets = [];
    var i;
    for (i = 0; i < n; i++) {
      targets.push({
        x: innerX,
        y: y0 + i * (SPEC.targetH + SPEC.gap),
        w: innerW,
        h: SPEC.targetH
      });
    }
    return {
      box: { x: boxX, y: boxY, w: boxW, h: boxH },
      status: {
        x: innerX,
        y: boxY + SPEC.inset,
        w: innerW,
        h: statusH
      },
      targets: targets
    };
  },

  open: function (opts) {
    opts = opts || {};
    if (SF.ChoiceBox._live) SF.ChoiceBox._live.cancel();
    if (typeof document === "undefined" || !document.body || !document.createElement) {
      return Promise.resolve(null);
    }
    return openBox(opts.choices || [], opts.onPick);
  }
};

function cssText() {
  var inset = SPEC.inset;
  var gap = SPEC.gap;
  var statusH = SPEC.statusH;
  var targetH = SPEC.targetH;
  return ""
    + "#sf-choicebox{position:fixed;z-index:" + SPEC.zIndex + ";margin:0;display:flex;flex-direction:column;"
    + "gap:" + gap + "px;padding:" + inset + "px;box-sizing:border-box;overflow:hidden;"
    + "background:transparent;color:#f6f2ea;pointer-events:auto;"
    + "font-family:\"Avenir Next\",\"Segoe UI\",system-ui,sans-serif;"
    + "touch-action:manipulation;image-rendering:pixelated;image-rendering:crisp-edges;}"
    + "#sf-choicebox *{box-sizing:border-box;}"
    + "#sf-choicebox button{display:flex;align-items:center;gap:8px;width:100%;margin:0;padding:0;"
    + "flex:0 0 " + targetH + "px;height:" + targetH + "px;min-height:" + targetH + "px;"
    + "border:0;border-radius:0;background:transparent;box-shadow:none;appearance:none;"
    + "color:#f6f2ea;font:16px/1.2 \"Avenir Next\",\"Segoe UI\",system-ui,sans-serif;"
    + "text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;}"
    + "#sf-choicebox button.is-on .sf-choice-label{font-weight:700;}"
    + "#sf-choicebox .sf-choice-mark{width:24px;height:24px;flex:0 0 24px;overflow:hidden;}"
    + "#sf-choicebox .sf-choice-cursor{width:24px;height:24px;display:block;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges;}"
    + "#sf-choicebox .sf-choice-label{flex:1 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}"
    + "#sf-choicebox .sf-choicebox-status{display:none;align-items:center;gap:6px;margin:0;overflow:hidden;"
    + "height:0;flex:0 0 0;white-space:nowrap;"
    + "font-size:13px;line-height:16px;}"
    + "#sf-choicebox.has-status .sf-choicebox-status{display:flex;height:" + statusH + "px;flex:0 0 " + statusH + "px;}"
    + "#sf-choicebox .sf-choicebox-panel{width:24px;height:24px;flex:0 0 24px;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges;}"
    + "@media (prefers-reduced-motion:reduce){#sf-choicebox,#sf-choicebox *{animation:none !important;transition:none !important;}}";
}

function ensureCss() {
  if (document.getElementById("sf-choicebox-css")) return;
  var style = document.createElement("style");
  style.id = "sf-choicebox-css";
  SF.ChoiceBox._css = cssText();
  style.textContent = SF.ChoiceBox._css;
  (document.head || document.body).appendChild(style);
}

function rowId(choice, index) {
  if (choice && choice.id != null && String(choice.id) !== "") return String(choice.id);
  return "choice-" + index;
}

function watchImage(img, done) {
  function finish(ok) {
    if (img._sfSettled) return;
    img._sfSettled = true;
    done(ok && img.naturalWidth > 0);
  }
  img.onload = function () { finish(true); };
  img.onerror = function () { finish(false); };
}

function applyFrame(root, on) {
  if (on) {
    root.style.padding = "0px";
    root.style.borderStyle = "solid";
    root.style.borderWidth = SPEC.inset + "px";
    root.style.borderColor = "transparent";
    root.style.borderImageSource = "url(\"" + SPEC.panel + "\")";
    root.style.borderImageSlice = SPEC.slice + " fill";
    root.style.borderImageRepeat = "stretch";
    return;
  }
  root.style.padding = SPEC.inset + "px";
  root.style.borderStyle = "none";
  root.style.borderWidth = "0px";
  root.style.borderColor = "transparent";
  root.style.borderImageSource = "none";
}

function speakerTextRect() {
  if (typeof document === "undefined" || !document.getElementById) return null;
  var ids = ["who", "line"];
  var box = null;
  var i;
  for (i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (!el || el.hidden || !el.getBoundingClientRect) continue;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0) || !(r.height > 0)) continue;
    var part = { x: r.left, y: r.top, w: r.width, h: r.height };
    if (!box) {
      box = part;
      continue;
    }
    var x1 = Math.min(box.x, part.x);
    var y1 = Math.min(box.y, part.y);
    var x2 = Math.max(box.x + box.w, part.x + part.w);
    var y2 = Math.max(box.y + box.h, part.y + part.h);
    box = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  return box;
}

function hostNode() {
  return (typeof document !== "undefined" && document.getElementById)
    ? (document.getElementById("chrome") || document.body)
    : null;
}

// Layout is in viewport pixels. When the box lives inside #chrome, map
// those numbers into chrome's (possibly zoomed) coordinate space.
function applyBox(root, laid) {
  var left = laid.box.x;
  var top = laid.box.y;
  var width = laid.box.w;
  var height = laid.box.h;
  var host = root && root.parentNode;
  if (host && host.id === "chrome" && host.getBoundingClientRect) {
    var r = host.getBoundingClientRect();
    var hx = host.offsetWidth || r.width || 1;
    var hy = host.offsetHeight || r.height || 1;
    var sx = r.width / hx;
    var sy = r.height / hy;
    if (!(sx > 0)) sx = 1;
    if (!(sy > 0)) sy = 1;
    left = (laid.box.x - r.left) / sx;
    top = (laid.box.y - r.top) / sy;
    width = laid.box.w / sx;
    height = laid.box.h / sy;
    root.style.position = "absolute";
  } else {
    root.style.position = "fixed";
  }
  root.style.left = left + "px";
  root.style.top = top + "px";
  root.style.width = width + "px";
  root.style.height = height + "px";
}

function place(session) {
  var vw = window.innerWidth || 0;
  var vh = window.innerHeight || 0;
  var laid = SF.ChoiceBox.layout(vw, vh, session.choices.length, speakerTextRect(), statusShowing(session));
  applyBox(session.root, laid);
}

function noteFor(session) {
  if (!session.panelSettled || !session.cursorSettled) return "";
  var missing = [];
  if (!session.panelOk) missing.push("choicebox-panel.png");
  if (!session.cursorOk) missing.push("choice-cursor.png");
  if (!missing.length) return "";
  return "Empty: " + missing.join(", ");
}

function statusShowing(session) {
  return !!noteFor(session);
}

function refreshNote(session) {
  var show = statusShowing(session);
  session.note.textContent = noteFor(session);
  applyFrame(session.root, session.panelOk);
  session.status.hidden = !show;
  session.root.classList.toggle("has-status", show);
  if (!session.settled) place(session);
}

function paintSelection(session) {
  var i;
  for (i = 0; i < session.buttons.length; i++) {
    var on = i === session.index;
    session.buttons[i].classList.toggle("is-on", on);
    if (on) {
      session.buttons[i].setAttribute("aria-current", "true");
      if (session.cursorOk && session.cursor) session.marks[i].appendChild(session.cursor);
    } else {
      session.buttons[i].removeAttribute("aria-current");
    }
  }
}

function openBox(list, onPick) {
  ensureCss();
  var choices = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var row = list[i] || {};
    choices.push({
      id: rowId(row, i),
      text: row.text == null ? "" : String(row.text)
    });
  }

  var root = document.createElement("div");
  root.id = "sf-choicebox";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Choices");
  root.style.position = "fixed";
  root.style.zIndex = String(SPEC.zIndex);
  root.style.margin = "0";
  root.style.background = "transparent";
  root.style.boxSizing = "border-box";
  root.style.pointerEvents = "auto";
  applyFrame(root, false);

  var status = document.createElement("p");
  status.className = "sf-choicebox-status";
  var note = document.createElement("span");
  note.className = "sf-choicebox-note";
  status.appendChild(note);

  var panel = document.createElement("img");
  panel.alt = "";
  var cursor = document.createElement("img");
  cursor.alt = "";

  var buttons = [];
  var marks = [];
  root.appendChild(status);
  for (i = 0; i < choices.length; i++) {
    (function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      var mark = document.createElement("span");
      mark.className = "sf-choice-mark";
      var label = document.createElement("span");
      label.className = "sf-choice-label";
      label.textContent = choice.text;
      button.appendChild(mark);
      button.appendChild(label);
      button.addEventListener("pointerdown", function (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        settle(choice.id);
      });
      root.appendChild(button);
      buttons.push(button);
      marks.push(mark);
    })(choices[i]);
  }

  var session = {
    choices: choices,
    buttons: buttons,
    marks: marks,
    cursor: cursor,
    note: note,
    status: status,
    root: root,
    index: 0,
    panelOk: false,
    cursorOk: false,
    panelSettled: false,
    cursorSettled: false,
    settled: false,
    onPick: onPick,
    resolve: null,
    cancel: null
  };

  function settle(id) {
    if (session.settled) return;
    session.settled = true;
    var cb = session.onPick;
    var resolve = session.resolve;
    try {
      if (typeof cb === "function") cb(id);
    } finally {
      if (resolve) resolve(id);
      destroy(session);
    }
  }

  function cancel() {
    if (session.settled) return;
    session.settled = true;
    if (session.resolve) session.resolve(null);
    destroy(session);
  }

  function onKey(e) {
    if (session.settled) return;
    var code = e.code || "";
    var n = session.choices.length;
    var dir = 0;
    if (code === "ArrowDown" || code === "ArrowRight") dir = 1;
    else if (code === "ArrowUp" || code === "ArrowLeft") dir = -1;
    if (dir) {
      if (e.preventDefault) e.preventDefault();
      session.index = (session.index + dir + n) % n;
      paintSelection(session);
      return;
    }
    if (e.repeat) return;
    if (code === "Enter" || code === "NumpadEnter" || code === "Space") {
      if (!n) return;
      if (e.preventDefault) e.preventDefault();
      settle(session.choices[session.index].id);
      return;
    }
    var digit = -1;
    if (code === "Digit1" || code === "Numpad1") digit = 0;
    else if (code === "Digit2" || code === "Numpad2") digit = 1;
    else if (code === "Digit3" || code === "Numpad3") digit = 2;
    else if (code === "Digit4" || code === "Numpad4") digit = 3;
    if (digit < 0 || digit >= n) return;
    if (e.preventDefault) e.preventDefault();
    settle(session.choices[digit].id);
  }

  function onResize() {
    if (!session.settled) place(session);
  }

  session.cancel = cancel;
  session.onKey = onKey;
  session.onResize = onResize;
  SF.ChoiceBox._live = session;

  var host = hostNode();
  if (host) host.appendChild(root);
  else document.body.appendChild(root);
  place(session);
  paintSelection(session);
  refreshNote(session);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(function () {
      if (!session.settled) place(session);
    });
  }

  // The panel PNG is applied as a 9-slice border-image. Do not also
  // insert a 24x24 copy of that texture into the status row.
  watchImage(panel, function (ok) {
    if (session.settled) return;
    session.panelSettled = true;
    session.panelOk = !!ok;
    refreshNote(session);
  });
  watchImage(cursor, function (ok) {
    if (session.settled) return;
    session.cursorSettled = true;
    session.cursorOk = !!ok;
    if (ok) {
      cursor.className = "sf-choice-cursor";
      paintSelection(session);
    }
    refreshNote(session);
  });
  panel.src = SPEC.panel;
  cursor.src = SPEC.cursor;

  return new Promise(function (resolve) {
    session.resolve = resolve;
  });
}

function destroy(session) {
  if (SF.ChoiceBox._live === session) SF.ChoiceBox._live = null;
  document.removeEventListener("keydown", session.onKey);
  window.removeEventListener("resize", session.onResize);
  if (session.root && session.root.parentNode) session.root.parentNode.removeChild(session.root);
}
