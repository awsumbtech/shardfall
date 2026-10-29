"use strict";

// One job: choose the clip and the frame. It never draws.
// Idle when the hero is still, walk while moving. Facing comes from the
// stick and the keys. Directions are down, side, and up. Left is the side
// row, flipped.
//
// Walk timing is a clock, not a distance. Full stick is 12 frames a second,
// scaled by stick magnitude, and never slower than 7. Each advance moves
// one cell, so a long frame cannot skip ahead. A walk starts on a contact
// cell (0, then 3, then 0).
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

  // Cells per second at a full stick, and the slowest a moving hero steps.
  Animator.WALK_FPS = 12;
  Animator.WALK_FPS_MIN = 7;

  // magnitude is 0..1. A dash passes 1 so the cycle stays at the walk rate.
  Animator.rateFor = function (magnitude) {
    var mag = magnitude > 0 ? magnitude : 0;
    if (mag > 1) mag = 1;
    var scaled = Animator.WALK_FPS * mag;
    return scaled < Animator.WALK_FPS_MIN ? Animator.WALK_FPS_MIN : scaled;
  };

  // Same priority as the field: horizontal wins a tie, including a zero vector.
  Animator.vectorFacing = function (fx, fy) {
    fx = fx || 0;
    fy = fy || 0;
    if (Math.abs(fx) >= Math.abs(fy)) return fx < 0 ? "left" : "right";
    return fy < 0 ? "up" : "down";
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

  function clipDirs() {
    return ["down", "side", "up"];
  }

  // Every name this clip will ask for. A sheet missing one of them is not ready.
  Animator.prototype.clipFrames = function (clipName) {
    var clip = this.clips[clipName] || this.clips.idle;
    if (!clip) return [];
    var dirs = clipDirs();
    var out = [];
    var d, i, name;
    for (d = 0; d < dirs.length; d++) {
      for (i = 0; i < clip.count; i++) {
        name = clip.name + "." + dirs[d] + "." + i;
        if (clip.names && clip.names[dirs[d]] && clip.names[dirs[d]][i]) name = clip.names[dirs[d]][i];
        out.push(name);
      }
    }
    return out;
  };

  Animator.prototype._walkNamed = function (facing) {
    var clip = this.clips.walk || Animator.normalize("walk", { frames: 6, fps: 8 });
    var index = this.walkFrame || 0;
    if (index < 0) index = 0;
    if (clip.count > 0) index = index % clip.count;
    var fps = clip.fps > 0 ? clip.fps : 8;
    return this.frame("walk", index / fps, facing);
  };

  // state: { moving, facing, fx, fy, time, hold, dt, magnitude, advance }.
  // advance is true only for the live hero's tick. A ghost samples the pose
  // and leaves the clock alone. The first cell of a walk is shown before dt
  // is counted, so a 12 Hz frame still begins on the contact cell.
  Animator.prototype.pose = function (state) {
    state = state || {};
    var facing = state.facing;
    if (facing == null) facing = Animator.vectorFacing(state.fx, state.fy);
    var idleTime = state.hold ? 0 : (state.time || 0);
    if (!state.advance) {
      if (!state.moving) return this.frame("idle", idleTime, facing);
      if (!this.walking) return this.frame("walk", 0, facing);
      return this._walkNamed(facing);
    }
    if (!state.moving) {
      this.walking = false;
      return this.frame("idle", idleTime, facing);
    }
    var clip = this.clips.walk || Animator.normalize("walk", { frames: 6, fps: 8 });
    if (!this.walking) {
      this.walking = true;
      var contact = this.nextContact === 3 && clip.count > 3 ? 3 : 0;
      this.walkFrame = contact;
      this.nextContact = contact === 0 ? 3 : 0;
      this.acc = 0;
      return this._walkNamed(facing);
    }
    var fps = Animator.rateFor(state.magnitude);
    var step = 1 / fps;
    var dt = state.dt > 0 ? state.dt : 0;
    this.acc = (this.acc || 0) + dt;
    if (this.acc + 1e-9 >= step) {
      this.acc -= step;
      if (this.acc < 0) this.acc = 0;
      if (this.acc >= step) this.acc = this.acc % step;
      this.walkFrame = ((this.walkFrame || 0) + 1) % clip.count;
    }
    return this._walkNamed(facing);
  };

  SF.Animator = Animator;
})();
