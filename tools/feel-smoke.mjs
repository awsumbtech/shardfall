import fs from "node:fs";
import vm from "node:vm";

const context = {};
context.window = context;
context.console = console;
const store = new Map();
context.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
context.navigator = {};
vm.createContext(context);
for (const file of [
  "js/data.js",
  "js/content/dialogue/emberhold.js",
  "js/content/dialogue/cinderveil.js",
  "js/dialogue.js",
  "js/audio.js",
  "js/music.js",
  "js/sfx.js",
  "js/haptics.js",
  "js/feel.js"
]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const { Music, Sfx, Haptics, SF } = context;
if (!Music || !Sfx || !Haptics) {
  console.error("Music, Sfx, or Haptics missing");
  process.exit(1);
}
const names = ["title", "emberhold", "cinderveil", "sail", "boss"];
names.forEach((name) => {
  if (Music.names.indexOf(name) === -1) {
    console.error("missing theme", name);
    process.exit(1);
  }
  Music.play(name);
  if (Music.current() !== name) {
    console.error("play did not stick", name, Music.current());
    process.exit(1);
  }
});
Music.play("not-a-theme");
if (Music.current() !== "boss") {
  console.error("unknown theme changed the current cue");
  process.exit(1);
}
["footstep", "whoosh", "impact", "dash", "grapple", "latch", "pull", "pickup", "lamp", "blip", "ui", "hurt", "death", "enemyHurt", "enemyDeath", "roar", "level"].forEach((name) => {
  if (Sfx.names.indexOf(name) === -1) {
    console.error("missing sfx", name);
    process.exit(1);
  }
  Sfx.play(name, { speaker: "Tamsin Reed" });
});
Sfx.play("nope");
SF.emit("swing");
SF.emit("talk");
Haptics.setEnabled(false);
if (store.get(SF.HAPTICS_KEY) !== "0") {
  console.error("haptics toggle was not saved");
  process.exit(1);
}
Haptics.pulse(12);
SF.audio.setMusicVolume(40);
SF.audio.setSfxVolume(0);
if (SF.audio.musicVol !== 0.4 || SF.audio.sfxVol !== 0) {
  console.error("volumes did not clamp", SF.audio.musicVol, SF.audio.sfxVol);
  process.exit(1);
}
if (!SF.feel) {
  console.error("feel loop missing");
  process.exit(1);
}

const heard = [];
const origPlay = Sfx.play;
Sfx.play = (name, opts) => {
  heard.push(name + ":" + ((opts && opts.speaker) || ""));
  return origPlay.call(Sfx, name, opts);
};
SF.audio.unlocked = false;
SF.state = { flags: {}, shardsHeld: 0, mode: "play", dialogue: null };
SF.startDialogue("emberhold.maren.intro");
if (heard[0] !== "blip:Old Maren") {
  console.error("opening line did not blip as Maren", heard);
  process.exit(1);
}
SF._dialogueUi = true;
SF.reduceFlash = false;
SF.state.dialogue.lock = 0;
SF.state.dialogue.done = true;
SF.advanceDialogue();
if (heard[heard.length - 1] !== "blip:Old Maren") {
  console.error("next line did not blip as Maren", heard);
  process.exit(1);
}
SF.state.dialogue.done = false;
SF.state.dialogue.shown = 0;
SF.state.dialogue.blipAt = 0;
SF.tickDialogue(0.2);
const ticks = heard.filter((h) => h === "blip:Old Maren").length;
if (ticks < 2) {
  console.error("typewriter did not keep Maren's voice", heard);
  process.exit(1);
}
SF.reduceFlash = true;
const beforeCalm = heard.length;
SF.state.dialogue.done = false;
SF.state.dialogue.shown = 0;
SF.tickDialogue(0.2);
if (heard.length !== beforeCalm) {
  console.error("Reduce flashing still ticked letters", heard.slice(beforeCalm));
  process.exit(1);
}
SF.startDialogue("cinderveil.tamsin.cogs_start");
if (heard[heard.length - 1] !== "blip:Tamsin Reed") {
  console.error("Tamsin did not get her own blip", heard[heard.length - 1]);
  process.exit(1);
}
console.log("feel smoke ok");
