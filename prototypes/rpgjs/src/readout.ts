// HTML status line for the spike. It is text, not a drawn sprite.
// The number on screen is the client sprite, which is what the camera follows.
// The server room position is kept beside it because the two can diverge.
export function coords(player: any) {
  const engine = (window as unknown as { __engine?: any }).__engine;
  const sprites = engine?.sceneMap?.players?.();
  const sprite = sprites ? Object.values(sprites)[0] as any : null;
  if (sprite) {
    const x = typeof sprite.x === "function" ? sprite.x() : sprite.x;
    const y = typeof sprite.y === "function" ? sprite.y() : sprite.y;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return { x: Math.round(x), y: Math.round(y) };
    }
  }
  const x = typeof player.x === "function" ? player.x() : player.x;
  const y = typeof player.y === "function" ? player.y() : player.y;
  return {
    x: Math.round(Number(x) || 0),
    y: Math.round(Number(y) || 0),
  };
}

export function publish(player: any, note?: string) {
  const el = document.getElementById("readout");
  if (!el) return;
  const now = coords(player);
  const keptX = player.getVariable?.("keptX");
  const keptY = player.getVariable?.("keptY");
  el.dataset.x = String(now.x);
  el.dataset.y = String(now.y);
  el.dataset.keptX = keptX == null ? "" : String(keptX);
  el.dataset.keptY = keptY == null ? "" : String(keptY);
  if (note) el.dataset.note = note;
  const serverX = Math.round(Number(typeof player.x === "function" ? player.x() : player.x) || 0);
  const serverY = Math.round(Number(typeof player.y === "function" ? player.y() : player.y) || 0);
  el.dataset.serverX = String(serverX);
  el.dataset.serverY = String(serverY);
  const kept = keptX == null ? "kept none" : `kept ${keptX}, ${keptY}`;
  el.textContent = `SPIKE Emberhold · now ${now.x}, ${now.y} · server ${serverX}, ${serverY} · ${kept} · ${el.dataset.note || ""} · Kenmi sheets missing`;
}
