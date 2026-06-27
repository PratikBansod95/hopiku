import { applyViewportFrame, bindViewportResize, getViewportSize } from "@utils/viewport";
import { Player } from "@entities/Player";
import type { Layout } from "@core/types";

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  panda: HTMLImageElement,
  uiLayer: HTMLElement,
): Layout {
  applyViewportFrame(canvas, uiLayer);
  const { width: w, height: h } = getViewportSize();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return Player.computeLayout(w, h, panda);
}

export function bindResize(
  canvas: HTMLCanvasElement,
  panda: HTMLImageElement,
  uiLayer: HTMLElement,
  onLayout: (layout: Layout) => void,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const onResize = () => {
    onLayout(resizeCanvas(canvas, ctx, panda, uiLayer));
  };

  bindViewportResize(onResize);
  onResize();
}
