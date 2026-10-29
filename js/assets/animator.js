"use strict";

// One job: choose the frame of a named clip. It never draws.
// Directions are down, side, and up. Left is the side row, flipped.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function Animator(clips) {
    this.clips = {};
    var src = clips || Animator.standard();
    var name;
    for (name in src) {
      if (Object.prototype.hasOwnProperty.call(src, name)) this.clips[name] = Animator.normalize(name, src[name]);
    }
  }

  // Kenmi walk sheets: six frames, three rows (down, side, up).
  Animator.standard = function () {
    return {
      idle: { fps: 6, frames: 6, loop: true },
      walk: { fps: 8, frames: 6, loop: true },
      attack: { fps: 12, frames: 4, loop: false },
      hurt: { fps: 8, frames: 2, loop: false },
      death: { fps: 8, frames: 6, loop: false }
    };
  };

  Animator.facing = function (facing) {
    if (facing === 1 || facing === "w" || facing === "west" || facing === "left") {
      return { dir: "side", flip: true, facing: "left" };
    }
    if (facing === 3 || facing === "e" || facing === "east" || facing === "right" || facing === "side") {
      return { dir: "side", flip: false, facing: facing === "side" ? "side" : "right" };
    }
    if (facing === 2 || facing === "n" || facing === "north" || facing === "up") {
      return { dir: "up", flip: false, facing: "up" };
    }
    return { dir: "down", flip: false, facing: "down" };
  };

  function nameCount(names) {
    var best = 0;
    var dir, list;
    if (!names) return 0;
    for (dir in names) {
      if (!Object.prototype.hasOwnProperty.call(names, dir)) continue;
      list = names[dir];
      if (list && list.length > best) best = list.length;
    }
    return best;
  }

  Animator.normalize = function (name, raw) {
    raw = raw || {};
    var names = raw.names || null;
    var count = 1;
    if (typeof raw.frames === "number" && raw.frames > 0) count = raw.frames | 0;
    else if (raw.frames && raw.frames.length) count = raw.frames.length;
    else if (names) count = nameCount(names) || 1;
    else if (raw.count > 0) count = raw.count | 0;
    var rows = { down: 0, side: 1, up: 2 };
    var key;
    if (raw.rows) {
      for (key in raw.rows) {
        if (Object.prototype.hasOwnProperty.call(raw.rows, key)) rows[key] = raw.rows[key];
      }
    }
    return {
      name: name,
      fps: raw.fps > 0 ? raw.fps : 8,
      loop: raw.loop !== false,
      count: count,
      rows: rows,
      names: names
    };
  };

  // time is seconds. Returns { clip, facing, dir, flip, frame, row, col, name }.
  Animator.prototype.frame = function (clipName, time, facing) {
    var clip = this.clips[clipName] || this.clips.idle;
    if (!clip) clip = Animator.normalize(clipName || "idle", { frames: 1, fps: 8 });
    var face = Animator.facing(facing);
    var t = time > 0 ? time : 0;
    var index = 0;
    if (clip.count > 1) {
      index = Math.floor(t * clip.fps);
      if (index < 0) index = 0;
      if (clip.loop) index = index % clip.count;
      else if (index >= clip.count) index = clip.count - 1;
    }
    var row = clip.rows[face.dir];
    if (row == null) row = 0;
    var frameName = clip.name + "." + face.dir + "." + index;
    if (clip.names && clip.names[face.dir] && clip.names[face.dir][index]) {
      frameName = clip.names[face.dir][index];
    }
    return {
      clip: clip.name,
      facing: face.facing,
      dir: face.dir,
      flip: face.flip,
      frame: index,
      row: row,
      col: index,
      name: frameName
    };
  };

  SF.Animator = Animator;
})();
