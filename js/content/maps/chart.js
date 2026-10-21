"use strict";

var SF = window.SF || {};
window.SF = SF;

// Sail chart. unlock: "sail" needs the skiff. "soon" stays locked (Act 2 is on hold).
// x/y are percentages on the chart, top-left origin.
// Two rows of three, inset so a ~100px tile stays inside the chart on a 340px-wide
// portrait sheet and on the short landscape chart (no overlap, no edge clip).
SF.DESTINATIONS = [
  { id: "emberhold", name: "Emberhold", x: 18, y: 28, unlock: "sail", swatch: "#2f6a48" },
  { id: "cinderveil", name: "Cinderveil", x: 50, y: 76, unlock: "sail", swatch: "#6e4038" },
  { id: "gullrock", name: "Gullrock", x: 82, y: 28, unlock: "soon", swatch: "#8a8680" },
  { id: "drift", name: "Drift Market", x: 18, y: 76, unlock: "soon", swatch: "#5a4878" },
  { id: "saltmere", name: "Saltmere", x: 82, y: 76, unlock: "soon", swatch: "#2a7a78" },
  { id: "highspire", name: "Highspire", x: 50, y: 28, unlock: "soon", swatch: "#a07848" }
];

SF.SAIL_ROUTES = [
  ["emberhold", "cinderveil"],
  ["cinderveil", "saltmere"],
  ["cinderveil", "gullrock"],
  ["emberhold", "drift"],
  ["saltmere", "highspire"],
  ["gullrock", "drift"]
];
