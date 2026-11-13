"use strict";

// One job: draw one loaded image or atlas frame at a position, anchor, and
// z-order. A missing image draws nothing. This file never paints with code.
(function () {
  var SF = window.SF || {};
  window.SF = SF;

  function num(value, fallback) {
    return typeof value === "number" && value === value ? value : fallback;
  }

  function imageSize(image) {
    if (!image || typeof image !== "object") return null;
    if (image.complete === false) return null;
    if (typeof image.naturalWidth === "number" && !(image.naturalWidth > 0)) return null;
    var w = typeof image.naturalWidth === "number" ? image.naturalWidth : image.width;
    var h = typeof image.naturalHeight === "number" ? image.naturalHeight : image.height;
    if (!(w > 0) || !(h > 0)) return null;
    return { w: w, h: h };
  }

  function rectOf(spec) {
    if (!spec || typeof spec !== "object") return null;
    var src = spec;
    if (spec.frame && spec.w == null && spec.width == null) src = spec.frame;
    var w = src.w != null ? src.w : src.width;
    var h = src.h != null ? src.h : src.height;
    if (!(w > 0) || !(h > 0)) return null;
    return {
      x: num(src.x, num(src.sx, 0)),
      y: num(src.y, num(src.sy, 0)),
      w: w,
      h: h
    };
  }

  // image is a bitmap, or { image, frame } / { image, x, y, w, h }.
  // frame is an optional source rect. A bad or unloaded bitmap returns null.
  function resolveAsset(image, frame) {
    var bitmap = image;
    var rectSpec = frame || null;
    if (image && typeof image === "object" && image.image && imageSize(image.image)) {
      bitmap = image.image;
      if (!rectSpec) rectSpec = image.frame || image;
    }
    if (!imageSize(bitmap)) return null;
    if (rectSpec) {
      var rect = rectOf(rectSpec);
      if (!rect) return null;
      return { image: bitmap, sx: rect.x, sy: rect.y, sw: rect.w, sh: rect.h };
    }
    var size = imageSize(bitmap);
    return { image: bitmap, sx: 0, sy: 0, sw: size.w, sh: size.h };
  }

  function anchorOffset(anchor, sw, sh) {
    if (anchor && typeof anchor === "object") {
      return {
        x: num(anchor.x, sw / 2),
        y: num(anchor.y, sh / 2)
      };
    }
    var name = typeof anchor === "string" ? anchor : "center";
    if (name === "topleft" || name === "top-left") return { x: 0, y: 0 };
    if (name === "top") return { x: sw / 2, y: 0 };
    if (name === "bottom" || name === "feet") return { x: sw / 2, y: sh };
    if (name === "left") return { x: 0, y: sh / 2 };
    if (name === "right") return { x: sw, y: sh / 2 };
    return { x: sw / 2, y: sh / 2 };
  }

  function VisualObject(spec) {
    spec = spec || {};
    this.image = spec.image != null ? spec.image : null;
    this.frame = spec.frame || null;
    this.x = num(spec.x, 0);
    this.y = num(spec.y, 0);
    this.anchor = spec.anchor != null ? spec.anchor : "center";
    this.z = num(spec.z, 0);
    this.name = typeof spec.name === "string" ? spec.name : "";
    this.parent = null;
    this._attached = false;
  }

  // Shared stand-in image. Leave this null until a real image is loaded.
  // A missing asset always reports on the console. It draws the stand-in
  // when one is set, and otherwise draws nothing.
  VisualObject.missingAsset = null;

  VisualObject.prototype.attach = function (parent) {
    if (!parent) return this;
    if (this._attached && this.parent === parent) return this;
    if (this._attached) this.detach();
    this.parent = parent;
    this._attached = true;
    if (typeof parent.register === "function") parent.register(this);
    return this;
  };

  VisualObject.prototype.update = function () {
    return this;
  };

  VisualObject.prototype.draw = function (ctx) {
    if (!ctx || !this._attached || typeof ctx.drawImage !== "function") return false;
    var resolved = resolveAsset(this.image, this.frame);
    if (!resolved) {
      var label = this.name ? "VisualObject missing asset: " + this.name : "VisualObject missing asset";
      if (typeof console !== "undefined" && console && typeof console.error === "function") {
        console.error(label);
      }
      resolved = VisualObject.missingAsset ? resolveAsset(VisualObject.missingAsset, null) : null;
      if (!resolved) return false;
    }
    var off = anchorOffset(this.anchor, resolved.sw, resolved.sh);
    ctx.drawImage(
      resolved.image,
      resolved.sx, resolved.sy, resolved.sw, resolved.sh,
      this.x - off.x, this.y - off.y, resolved.sw, resolved.sh
    );
    return true;
  };

  VisualObject.prototype.detach = function () {
    var parent = this.parent;
    this.parent = null;
    this._attached = false;
    if (parent && typeof parent.unregister === "function") parent.unregister(this);
    return this;
  };

  if (typeof SF.defineVisualObject === "function") SF.defineVisualObject(VisualObject);
})();
