import { TIMING } from "@config/game.constants";

export function bindCanvasInput(
  canvas: HTMLCanvasElement,
  onTap: () => void,
): () => void {
  let lastTap = 0;

  const handler = (event: Event) => {
    const now = Date.now();
    if (now - lastTap < TIMING.inputDebounceMs) return;
    lastTap = now;
    if (event.cancelable) event.preventDefault();
    onTap();
  };

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", handler, { passive: false });
  canvas.addEventListener("touchstart", handler, { passive: false });

  return () => {
    canvas.removeEventListener("pointerdown", handler);
    canvas.removeEventListener("touchstart", handler);
  };
}
