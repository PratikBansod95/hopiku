import { ASSET_PATHS } from "../game/constants";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/** True screen-green pixels — strict so bamboo/panda foliage greens are kept. */
function isScreenGreenCandidate(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) return true;

  // Must be bright green dominant (neon #00FF00 family, not natural bamboo).
  if (g < 165) return false;
  if (r > 115 || b > 115) return false;
  if (g < r + 55 || g < b + 55) return false;

  return true;
}

/**
 * Only remove green connected to the image border (flood fill).
 * Interior bright greens on bamboo/logs stay opaque.
 */
function keyScreenGreenFromEdges(data: Uint8ClampedArray, w: number, h: number): void {
  const total = w * h;
  const keyed = new Uint8Array(total);
  const queue: number[] = [];

  const trySeed = (x: number, y: number) => {
    const idx = y * w + x;
    if (keyed[idx]) return;
    const o = idx * 4;
    if (!isScreenGreenCandidate(data[o], data[o + 1], data[o + 2], data[o + 3])) return;
    keyed[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < w; x += 1) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y += 1) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop()!;
    const x = idx % w;
    const y = (idx - x) / w;

    if (x > 0) trySeed(x - 1, y);
    if (x < w - 1) trySeed(x + 1, y);
    if (y > 0) trySeed(x, y - 1);
    if (y < h - 1) trySeed(x, y + 1);
  }

  for (let idx = 0; idx < total; idx += 1) {
    if (!keyed[idx]) continue;
    data[idx * 4 + 3] = 0;
  }

  // Light despill on opaque pixels directly bordering keyed green (edge fringe only).
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = y * w + x;
      const o = idx * 4;
      if (data[o + 3] === 0) continue;

      const touchesKeyed =
        (x > 0 && keyed[idx - 1]) ||
        (x < w - 1 && keyed[idx + 1]) ||
        (y > 0 && keyed[idx - w]) ||
        (y < h - 1 && keyed[idx + w]);

      if (!touchesKeyed) continue;

      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      if (g <= r + 15 || g <= b + 15) continue;

      const spill = Math.min(0.35, (g - Math.max(r, b)) / 255);
      data[o + 1] = Math.round(g * (1 - spill * 0.5));
    }
  }
}

function chromaKeyAndCrop(image: HTMLImageElement): Promise<HTMLImageElement> {
  const { naturalWidth: w, naturalHeight: h } = image;
  if (w <= 0 || h <= 0) return Promise.resolve(image);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return Promise.resolve(image);

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  keyScreenGreenFromEdges(data, w, h);
  ctx.putImageData(imageData, 0, 0);

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) return Promise.resolve(image);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return Promise.resolve(image);

  outCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  return new Promise((resolve, reject) => {
    const trimmed = new Image();
    trimmed.onload = () => resolve(trimmed);
    trimmed.onerror = () => reject(new Error("Failed to process chroma-keyed image"));
    trimmed.src = out.toDataURL("image/png");
  });
}

async function loadTrimmed(src: string): Promise<HTMLImageElement> {
  const image = await loadImage(src);
  return chromaKeyAndCrop(image);
}

export async function loadGameAssets() {
  const [panda, pandaDead, bambooPlatform, bambooStump] = await Promise.all([
    loadTrimmed(ASSET_PATHS.panda),
    loadTrimmed(ASSET_PATHS.pandaDead),
    loadTrimmed(ASSET_PATHS.bambooPlatform),
    loadTrimmed(ASSET_PATHS.bambooStump),
  ]);

  return { panda, pandaDead, bambooPlatform, bambooStump };
}

export type GameAssets = Awaited<ReturnType<typeof loadGameAssets>>;

/** Apply chroma-keyed sprite data URLs to DOM UI images (game-over panda, etc.). */
export function applyUiSprites(assets: GameAssets): void {
  const src = assets.pandaDead.src;
  document.querySelectorAll<HTMLImageElement>(".go-panda-ui").forEach((el) => {
    const reveal = () => el.classList.add("is-ready");
    el.onload = reveal;
    el.src = src;
    if (el.complete) reveal();
  });
}

export function spriteAspect(image: HTMLImageElement, fallback = 1.2): number {
  return image.complete && image.naturalWidth > 0
    ? image.naturalHeight / image.naturalWidth
    : fallback;
}

export function drawSpriteCentered(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  offsetY = 0,
): number {
  if (!image.complete || image.naturalWidth <= 0) return width * 1.15;
  const aspect = image.naturalHeight / image.naturalWidth;
  const height = width * aspect;
  ctx.drawImage(image, x - width / 2, y - height + offsetY, width, height);
  return height;
}

export function drawSpriteTopLeft(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
): number {
  if (!image.complete || image.naturalWidth <= 0) return width * 1.15;
  const aspect = image.naturalHeight / image.naturalWidth;
  const height = width * aspect;
  ctx.drawImage(image, x, y, width, height);
  return height;
}
