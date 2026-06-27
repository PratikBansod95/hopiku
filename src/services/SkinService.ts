import type { PandaSkinId } from "@config/progression.constants";
import { SKIN_ORDER, SKIN_VISUALS, type SkinVisualConfig } from "@config/skin.config";

export interface SkinSprites {
  panda: HTMLImageElement;
  pandaDead: HTMLImageElement;
}

export type SkinAtlas = Record<PandaSkinId, SkinSprites>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function isHighlightPixel(r: number, g: number, b: number, a: number): boolean {
  return a > 20 && r > 205 && g > 205 && b > 205;
}

function tintPixel(
  r: number,
  g: number,
  b: number,
  a: number,
  config: SkinVisualConfig,
): [number, number, number, number] {
  if (a < 8 || config.id === "default") {
    return [r, g, b, a];
  }

  if (isHighlightPixel(r, g, b, a)) {
    const blend = 0.22;
    const [tr, tg, tb] = config.tint;
    return [
      Math.round(r * (1 - blend) + 255 * tr * blend),
      Math.round(g * (1 - blend) + 255 * tg * blend),
      Math.round(b * (1 - blend) + 255 * tb * blend),
      a,
    ];
  }

  const rn = (r / 255) * config.tint[0];
  const gn = (g / 255) * config.tint[1];
  const bn = (b / 255) * config.tint[2];

  const [h, s0, l0] = rgbToHsl(
    Math.round(clamp(rn, 0, 1) * 255),
    Math.round(clamp(gn, 0, 1) * 255),
    Math.round(clamp(bn, 0, 1) * 255),
  );

  const s = clamp(s0 * config.saturation, 0, 1);
  const l = clamp(l0 + config.lightness, 0, 1);
  [r, g, b] = hslToRgb(h, s, l);

  if (config.glow) {
    const glow = parseGlowColor(config.glow.color);
    const glowMix = config.glow.alpha * (1 - l);
    r = Math.round(r * (1 - glowMix) + glow[0] * glowMix);
    g = Math.round(g * (1 - glowMix) + glow[1] * glowMix);
    b = Math.round(b * (1 - glowMix) + glow[2] * glowMix);
  }

  return [r, g, b, a];
}

function parseGlowColor(color: string): [number, number, number] {
  if (color.startsWith("#") && color.length >= 7) {
    return [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    ];
  }
  return [255, 255, 255];
}

function tintImage(source: HTMLImageElement, config: SkinVisualConfig): Promise<HTMLImageElement> {
  if (config.id === "default") {
    return Promise.resolve(source);
  }

  const { naturalWidth: w, naturalHeight: h } = source;
  if (w <= 0 || h <= 0) return Promise.resolve(source);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return Promise.resolve(source);

  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = tintPixel(data[i], data[i + 1], data[i + 2], data[i + 3], config);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    const out = new Image();
    out.onload = () => resolve(out);
    out.onerror = () => reject(new Error(`Failed to build ${config.id} skin sprite`));
    out.src = canvas.toDataURL("image/png");
  });
}

export async function buildSkinAtlas(
  basePanda: HTMLImageElement,
  baseDead: HTMLImageElement,
): Promise<SkinAtlas> {
  const entries = await Promise.all(
    SKIN_ORDER.map(async (skinId) => {
      const config = SKIN_VISUALS[skinId];
      const [panda, pandaDead] = await Promise.all([
        tintImage(basePanda, config),
        tintImage(baseDead, config),
      ]);
      return [skinId, { panda, pandaDead }] as const;
    }),
  );

  return Object.fromEntries(entries) as SkinAtlas;
}

export function resolveSkinSprites(atlas: SkinAtlas, skinId: string): SkinSprites {
  if (skinId in atlas) {
    return atlas[skinId as PandaSkinId];
  }
  return atlas.default;
}

export function getSkinPreviewUrl(sprites: SkinSprites): string {
  return sprites.panda.src;
}
