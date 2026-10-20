"use strict";

// Install prompt, service worker, and the fullscreen layout used when
// Shardfall is launched from a home screen or desktop install.
var SF = window.SF || {};
window.SF = SF;

SF.deferredInstall = null;

SF.isInstalled = function () {
  try {
    if (window.navigator && window.navigator.standalone) return true;
    if (!window.matchMedia) return false;
    return window.matchMedia("(display-mode: fullscreen)").matches
      || window.matchMedia("(display-mode: standalone)").matches;
  } catch (err) {
    return false;
  }
};

SF.installHelp = function () {
  return "Android Chrome: menu > Install app / Add to home screen.\n"
    + "iOS Safari: Share > Add to Home Screen.\n"
    + "Desktop Chrome/Edge: install icon in the address bar.";
};

SF.promptInstall = function () {
  if (SF.isInstalled()) {
    SF.fieldNote = "Shardfall is already installed.";
    return;
  }
  var ev = SF.deferredInstall;
  if (!ev) {
    SF.fieldNote = SF.installHelp();
    return;
  }
  SF.deferredInstall = null;
  SF.fieldNote = "Confirm the install prompt.";
  var choice = ev.userChoice;
  try {
    ev.prompt();
  } catch (err) {
    SF.fieldNote = SF.installHelp();
    return;
  }
  if (choice && choice.then) {
    choice.then(function (result) {
      SF.fieldNote = result && result.outcome === "accepted" ? "Installing Shardfall." : SF.installHelp();
      SF._fieldSig = "";
      if (SF.syncUI) SF.syncUI();
    });
  }
};

SF.requestInstalledLayout = function () {
  if (!SF.isInstalled()) return;
  var root = document.documentElement;
  if (root) root.classList.add("sf-installed");
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  var req = root && (root.requestFullscreen || root.webkitRequestFullscreen);
  if (!req) return;
  try {
    var pending = req.call(root, { navigationUI: "hide" });
    if (pending && pending.catch) pending.catch(function () {});
  } catch (err) {
    /* a gesture may be required; the manifest display mode still applies */
  }
};

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  SF.deferredInstall = event;
  SF._fieldSig = "";
  if (SF.syncUI) SF.syncUI();
});

window.addEventListener("appinstalled", function () {
  SF.deferredInstall = null;
  SF.fieldNote = "Shardfall is installed.";
  SF._fieldSig = "";
  if (SF.syncUI) SF.syncUI();
});

if ("serviceWorker" in navigator) {
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (!hadController) {
      hadController = true;
      return;
    }
    window.location.reload();
  });
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () {});
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", SF.requestInstalledLayout);
} else {
  SF.requestInstalledLayout();
}

window.addEventListener("pointerdown", SF.requestInstalledLayout, { once: true });
window.addEventListener("keydown", SF.requestInstalledLayout, { once: true });
