import type { PandaSkinId } from "@config/progression.constants";
import { SKIN_ORDER } from "@config/skin.config";

export interface SkinSprites {
  panda: HTMLImageElement;
  pandaDead: HTMLImageElement;
}

export type SkinAtlas = Record<PandaSkinId, SkinSprites>;

export function resolveSkinSprites(atlas: SkinAtlas, skinId: string): SkinSprites {
  if (skinId in atlas) {
    return atlas[skinId as PandaSkinId];
  }
  return atlas.default;
}

export function getSkinPreviewUrl(sprites: SkinSprites): string {
  return sprites.panda.src;
}

export { SKIN_ORDER };
