// In this standalone build, player.emit("gui.open") never arrived on the
// client socket, so showText and showChoices resolved nothing on screen.
// Forward those events to the client GUI service that is already running.
export function bridgeGui(player: { emit: (event: string, data?: unknown) => unknown }) {
  const emit = player.emit.bind(player);
  player.emit = (event: string, data?: any) => {
    const result = emit(event, data);
    const engine = (window as unknown as { __engine?: any }).__engine;
    const gui = engine?.guiService;
    if (!gui) return result;
    if (event === "gui.open" && data?.guiId) gui.display(data.guiId, data.data, [], data.guiOpenId);
    if (event === "gui.exit") {
      const guiId = typeof data === "string" ? data : data?.guiId;
      if (guiId) gui.hide(guiId);
    }
    return result;
  };
}
