"use strict";

// App-shell cache for https://awsumbtech.github.io/shardfall/ and a local server.
// Paths are relative to this file so the same worker works at /shardfall/.
// CACHE is the precache version. A new name drops every older shell.
var CACHE = "shardfall-v0.4.26";

var SHELL = [
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "js/data.js",
  "js/data/skills.js",
  "js/data/items.js",
  "js/data/party.js",
  "js/data/enemies.js",
  "js/data/encounters.js",
  "js/content/dialogue/emberhold.js",
  "js/content/dialogue/cinderveil.js",
  "js/content/dialogue/world.js",
  "js/dialogue.js",
  "js/audio.js",
  "js/music.js",
  "js/sfx.js",
  "js/haptics.js",
  "js/title.js",
  "js/feel.js",
  "js/save.js",
  "js/sim.js",
  "js/cinder.js",
  "js/content/maps/kinds.js",
  "js/content/maps/chart.js",
  "js/content/maps/emberhold.js",
  "js/content/maps/cinderveil.js",
  "js/content/maps/saltmere.js",
  "js/content/maps/highspire.js",
  "js/content/maps/gullrock.js",
  "js/content/maps/drift.js",
  "js/content/maps/v2layout.js",
  "js/vaultgate.js",
  "js/grapple.js",
  "js/art/core.js",
  "js/art/actors.js",
  "js/art/characters.js",
  "js/art/world.js",
  "js/art/props.js",
  "js/art/scenes.js",
  "js/art/gallery.js",
  "js/assets/manifest.js",
  "js/assets/loader.js",
  "js/assets/sheet.js",
  "js/assets/animator.js",
  "js/assets/registry.js",
  "js/assets/renderer.js",
  "js/assets/rig.js",
  "js/assets/crystal.js",
  "js/tiles/tmjmap.js",
  "js/tiles/renderer.js",
  "js/tiles/skyedge.js",
  "js/tiles/skymask.js",
  "js/tiles/bridge.js",
  "js/tiles/dashassist.js",
  "js/tiles/adopt.js",
  "js/content/maps/emberhold.tmj",
  "js/content/maps/props-preview.json",
  "js/draw.js",
  "js/battle/battle.js",
  "js/battle/draw.js",
  "js/input.js",
  "js/ui.js",
  "js/pwa.js",
  "js/menu/field.js",
  "js/world.js",
  "js/main.js"
];

// assets/atlas/* stays off this list. A missing manifest must not fail install.
// The cache-first fetch handler stores those files on first use, in this
// versioned CACHE. A 404 is not stored.

function freshRequest(url) {
  // A unique query misses the previous worker's cache. cache:"reload" and
  // Cache-Control: no-store both skip the HTTP cache, so install never
  // stores old bytes under the new name.
  var bust = url + (url.indexOf("?") === -1 ? "?" : "&") + "sf=" + encodeURIComponent(CACHE);
  return new Request(bust, {
    cache: "reload",
    credentials: "same-origin",
    headers: { "Cache-Control": "no-store" }
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(SHELL.map(function (url) {
        return fetch(freshRequest(url)).then(function (response) {
          if (!response.ok) throw new Error(url + " " + response.status);
          return cache.put(url, response);
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key === CACHE) return null;
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function sameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch (err) {
    return false;
  }
}

function isWorkerScript(request) {
  var path = new URL(request.url).pathname;
  return path.endsWith("/sw.js");
}

function isDocument(request) {
  if (request.mode === "navigate") return true;
  var path = new URL(request.url).pathname;
  return path.endsWith("/index.html") || path.endsWith("/");
}

function cacheFirst(request) {
  return caches.match(request).then(function (hit) {
    if (hit) return hit;
    return fetch(freshRequest(request.url)).then(function (response) {
      return store(request, response);
    });
  });
}

function fromCache(request) {
  return caches.match(request).then(function (hit) {
    if (hit) return hit;
    if (request.mode === "navigate") return caches.match("index.html");
    return null;
  });
}

function store(request, response) {
  if (!response || !response.ok || response.type === "opaque") return response;
  var copy = response.clone();
  caches.open(CACHE).then(function (cache) {
    return cache.put(request, copy);
  });
  return response;
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  if (!sameOrigin(request)) return;
  // The browser checks this file for updates. Serving it from cache would
  // pin the player to an old build.
  if (isWorkerScript(request)) return;

  if (isDocument(request)) {
    event.respondWith(
      fetch(request.url, { cache: "reload", credentials: "same-origin" }).then(function (response) {
        return store(request, response);
      }).catch(function () {
        return fromCache(request).then(function (hit) {
          return hit || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        });
      })
    );
    return;
  }

  event.respondWith(cacheFirst(request));
});
