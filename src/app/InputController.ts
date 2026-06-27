import { TIMING } from "@config/game.constants";

export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  onTap: () => void,
): () => void {
  let lastTap = 0;

  const fireTap = (event?: Event) => {
    const now = Date.now();
    if (now - lastTap < TIMING.inputDebounceMs) return;
    lastTap = now;
    if (event?.cancelable) event.preventDefault();
    onTap();
  };

  const pointerHandler = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    fireTap(event);
  };

  const keyHandler = (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.code === "Space" || event.code === "Enter") {
      fireTap(event);
    }
  };

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", pointerHandler, { passive: false });
  window.addEventListener("keydown", keyHandler);

  return () => {
    canvas.removeEventListener("pointerdown", pointerHandler);
    window.removeEventListener("keydown", keyHandler);
  };
}
