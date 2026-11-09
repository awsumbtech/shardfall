"use strict";

// TuningDrawer is the phone-sized Tune panel. It builds no DOM and adds no
// listeners unless the address has ?dev=1. It writes SF.tune through
// TuningConfig and does not change rules on its own.
var SF = window.SF || {};
window.SF = SF;

SF.TuningDrawer = (function () {
  function el(tag) {
    return document.createElement(tag);
  }

  function format(n) {
    if (typeof n !== "number") return String(n);
    return String(Math.round(n * 100) / 100);
  }

  function note(text) {
    var node = document.getElementById("tune-note");
    if (!node) return;
    node.hidden = false;
    node.textContent = text;
  }

  function copyValues() {
    var changed = SF.TuningConfig.overrides();
    var text = JSON.stringify(changed, null, 2);
    var clip = typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText;
    if (!clip) {
      note(text === "{}" ? "Copied." : text);
      return;
    }
    clip.call(navigator.clipboard, text).then(function () {
      note("Copied.");
    }, function () {
      note(text);
    });
  }

  function addSlider(host, row) {
    var label = el("label");
    var name = el("span");
    var value = el("span");
    var input = el("input");
    label.className = "tune-row";
    name.className = "tune-name";
    name.textContent = row.label;
    value.className = "tune-value";
    value.textContent = format(SF.tune[row.id]);
    input.setAttribute("type", "range");
    input.setAttribute("id", "tune-in-" + row.id);
    input.setAttribute("min", row.min);
    input.setAttribute("max", row.max);
    input.setAttribute("step", row.step == null ? "any" : row.step);
    input.setAttribute("aria-label", row.label);
    input.value = String(SF.tune[row.id]);
    input.addEventListener("input", function () {
      var next = SF.TuningConfig.set(row.id, Number(input.value));
      input.value = String(next);
      value.textContent = format(next);
      note("");
    });
    label.appendChild(name);
    label.appendChild(value);
    label.appendChild(input);
    host.appendChild(label);
  }

  function addToggle(host, row) {
    var button = el("button");
    function paint() {
      var on = !!SF.tune[row.id];
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.textContent = row.label + ": " + (on ? "On" : "Off");
    }
    button.className = "tune-bool";
    button.setAttribute("type", "button");
    button.setAttribute("id", "tune-in-" + row.id);
    button.addEventListener("click", function () {
      SF.TuningConfig.set(row.id, !SF.tune[row.id]);
      paint();
      note("");
    });
    paint();
    host.appendChild(button);
  }

  return {
    owner: "TuningDrawer",
    _attached: false,

    attach: function () {
      if (SF.TuningDrawer._attached) return;
      SF.TuningDrawer._attached = true;
      if (!SF.TuningConfig || !SF.TuningConfig.devOn || !SF.TuningConfig.devOn()) return;
      if (typeof document === "undefined" || !document.body || !document.createElement) return;
      SF.TuningDrawer.mount();
    },

    mount: function () {
      var toggle, drawer, head, title, close, fields, status, actions, copy, reset, css;
      if (document.getElementById("tune-toggle")) return;
      if (document.head && !document.getElementById("tune-css")) {
        css = el("link");
        css.setAttribute("id", "tune-css");
        css.setAttribute("rel", "stylesheet");
        css.setAttribute("href", "css/tuning.css");
        document.head.appendChild(css);
      }
      toggle = el("button");
      toggle.setAttribute("id", "tune-toggle");
      toggle.setAttribute("type", "button");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "tune-drawer");
      toggle.textContent = "Tune";
      drawer = el("aside");
      drawer.setAttribute("id", "tune-drawer");
      drawer.hidden = true;
      head = el("div");
      head.className = "tune-head";
      title = el("h2");
      title.textContent = "Tuning";
      close = el("button");
      close.setAttribute("type", "button");
      close.setAttribute("id", "tune-close");
      close.textContent = "Close";
      var tabs = el("div");
      tabs.className = "tune-tabs";
      tabs.setAttribute("id", "tune-tabs");
      var feelTab = el("button");
      feelTab.className = "tune-tab";
      feelTab.setAttribute("type", "button");
      feelTab.setAttribute("id", "tune-tab-feel");
      feelTab.textContent = "Feel";
      tabs.appendChild(feelTab);
      fields = el("div");
      fields.setAttribute("id", "tune-fields");
      var panels = el("div");
      panels.setAttribute("id", "tune-panels");
      var feelPanel = el("div");
      feelPanel.setAttribute("id", "tune-panel-feel");
      feelPanel.appendChild(fields);
      status = el("p");
      status.setAttribute("id", "tune-note");
      status.setAttribute("role", "status");
      status.hidden = true;
      actions = el("div");
      actions.className = "tune-actions";
      copy = el("button");
      copy.setAttribute("type", "button");
      copy.setAttribute("id", "tune-copy");
      copy.textContent = "Copy values";
      reset = el("button");
      reset.setAttribute("type", "button");
      reset.setAttribute("id", "tune-reset");
      reset.textContent = "Reset";
      head.appendChild(title);
      head.appendChild(close);
      actions.appendChild(copy);
      actions.appendChild(reset);
      feelPanel.appendChild(status);
      feelPanel.appendChild(actions);
      panels.appendChild(feelPanel);
      drawer.appendChild(head);
      drawer.appendChild(tabs);
      drawer.appendChild(panels);
      SF.TuningDrawer._tabs = tabs;
      SF.TuningDrawer._panels = panels;
      SF.TuningDrawer._mounted = true;
      feelTab.addEventListener("click", function () { SF.TuningDrawer.showTab("feel"); });
      SF.TuningDrawer.showTab("feel");
      SF.TuningDrawer._flushTabs();
      document.body.appendChild(toggle);
      document.body.appendChild(drawer);
      toggle.addEventListener("click", function () {
        var open = drawer.hidden;
        drawer.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      close.addEventListener("click", function () {
        drawer.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      });
      copy.addEventListener("click", copyValues);
      reset.addEventListener("click", function () {
        SF.TuningConfig.reset();
        note("Reset.");
      });
      SF.TuningDrawer.refresh();
    },

    addTab: function (id, label, fill) {
      SF.TuningDrawer._queue = SF.TuningDrawer._queue || [];
      SF.TuningDrawer._queue.push({ id: id, label: label, fill: fill });
      if (SF.TuningDrawer._mounted) SF.TuningDrawer._flushTabs();
    },

    _flushTabs: function () {
      var queue = SF.TuningDrawer._queue || [];
      var i;
      SF.TuningDrawer._queue = [];
      for (i = 0; i < queue.length; i++) SF.TuningDrawer._renderTab(queue[i]);
    },

    _renderTab: function (rec) {
      if (!SF.TuningDrawer._tabs || !SF.TuningDrawer._panels || !document.getElementById) return;
      if (document.getElementById("tune-tab-" + rec.id)) return;
      var button = document.createElement("button");
      var panel = document.createElement("div");
      button.className = "tune-tab";
      button.setAttribute("type", "button");
      button.setAttribute("id", "tune-tab-" + rec.id);
      button.textContent = rec.label;
      panel.setAttribute("id", "tune-panel-" + rec.id);
      panel.hidden = true;
      button.addEventListener("click", function () { SF.TuningDrawer.showTab(rec.id); });
      SF.TuningDrawer._tabs.appendChild(button);
      SF.TuningDrawer._panels.appendChild(panel);
      if (rec.fill) rec.fill(panel);
    },

    showTab: function (id) {
      var panels = SF.TuningDrawer._panels;
      var tabs = SF.TuningDrawer._tabs;
      var i, node, on;
      if (!panels || !panels.children) return;
      for (i = 0; i < panels.children.length; i++) {
        node = panels.children[i];
        on = node.id === "tune-panel-" + id;
        node.hidden = !on;
      }
      if (!tabs || !tabs.children) return;
      for (i = 0; i < tabs.children.length; i++) {
        node = tabs.children[i];
        on = node.id === "tune-tab-" + id;
        node.setAttribute("aria-pressed", on ? "true" : "false");
      }
    },

    refresh: function () {
      var host = typeof document !== "undefined" && document.getElementById && document.getElementById("tune-fields");
      var rows, i, row, input;
      if (!host || !SF.TuningConfig) return;
      while (host.children && host.children.length) host.removeChild(host.children[0]);
      if (!host.children) host.children = [];
      rows = SF.TuningConfig.rows || [];
      for (i = 0; i < rows.length; i++) {
        row = rows[i];
        if (typeof row.value === "boolean") addToggle(host, row);
        else addSlider(host, row);
      }
      for (i = 0; i < rows.length; i++) {
        input = document.getElementById("tune-in-" + rows[i].id);
        if (!input) continue;
        if (typeof rows[i].value === "boolean") {
          input.setAttribute("aria-pressed", SF.tune[rows[i].id] ? "true" : "false");
          input.textContent = rows[i].label + ": " + (SF.tune[rows[i].id] ? "On" : "Off");
        } else if (input.value != null) {
          input.value = String(SF.tune[rows[i].id]);
        }
      }
    }
  };
})();
