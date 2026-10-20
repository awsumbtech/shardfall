"use strict";

var SF = window.SF || {};
window.SF = SF;

// Sail chart. unlock: "sail" needs the skiff. "act1" needs flags.act1 as well.
// x/y are percentages on the chart, top-left origin.
SF.DESTINATIONS = [
  { id: "emberhold", name: "Emberhold", x: 22, y: 42, unlock: "sail", swatch: "#2f6a48" },
  { id: "cinderveil", name: "Cinderveil", x: 48, y: 58, unlock: "sail", swatch: "#6e4038" },
  { id: "gullrock", name: "Gullrock", x: 78, y: 28, unlock: "act1", swatch: "#8a8680" },
  { id: "drift", name: "Drift Market", x: 18, y: 74, unlock: "act1", swatch: "#5a4878" },
  { id: "saltmere", name: "Saltmere", x: 72, y: 70, unlock: "act1", swatch: "#2a7a78" },
  { id: "highspire", name: "Highspire", x: 40, y: 16, unlock: "act1", swatch: "#a07848" }
];

SF.SAIL_ROUTES = [
  ["emberhold", "cinderveil"],
  ["cinderveil", "saltmere"],
  ["cinderveil", "gullrock"],
  ["emberhold", "drift"],
  ["saltmere", "highspire"],
  ["gullrock", "drift"]
];
