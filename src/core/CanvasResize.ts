import { applyGameFrame, bindViewportResize, getGameFrame } from "@utils/viewport";
import { Player } from "@entities/Player";
import type { Layout } from "@core/types";

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  panda: HTMLImageElement,
  uiLayer: HTMLElement,
): Layout {
  applyGameFrame(canvas, uiLayer);
  const frame = getGameFrame();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(frame.width * dpr);
  canvas.height = Math.round(frame.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return Player.computeLayout(frame.width, frame.height, panda);
}

export function bindResize(
  canvas: HTMLCanvasElement,
  getPanda: () => HTMLImageElement,
  uiLayer: HTMLElement,
  onLayout: (layout: Layout) => void,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const onResize = () => {
    onLayout(resizeCanvas(canvas, ctx, getPanda(), uiLayer));
  };

  bindViewportResize(onResize);
  onResize();
}
