import type { PandaSkinId } from "@config/progression.constants";

export interface SkinVisualConfig {
  id: PandaSkinId;
  badgeEmoji: string;
  /** RGB multipliers applied to fur pixels (0–1.5). */
  tint: [number, number, number];
  /** Saturation scale (0.5 = muted, 1.5 = vivid). */
  saturation: number;
  /** Lightness delta (-0.35 … 0.35). */
  lightness: number;
  /** Optional glow overlay on fur. */
  glow?: { color: string; alpha: number };
}

export const SKIN_ORDER: PandaSkinId[] = ["default", "ninja", "cloud", "summit", "golden"];

export const SKIN_VISUALS: Record<PandaSkinId, SkinVisualConfig> = {
  default: {
    id: "default",
    badgeEmoji: "🐼",
    tint: [1, 1, 1],
    saturation: 1,
    lightness: 0,
  },
  ninja: {
    id: "ninja",
    badgeEmoji: "🥷",
    tint: [0.55, 0.62, 0.95],
    saturation: 0.65,
    lightness: -0.12,
    glow: { color: "#1a237e", alpha: 0.18 },
  },
  cloud: {
    id: "cloud",
    badgeEmoji: "☁️",
    tint: [0.88, 0.94, 1.15],
    saturation: 0.75,
    lightness: 0.18,
    glow: { color: "#e3f2fd", alpha: 0.22 },
  },
  summit: {
    id: "summit",
    badgeEmoji: "🏔️",
    tint: [1.18, 0.82, 0.55],
    saturation: 1.15,
    lightness: 0.06,
    glow: { color: "#ff6f00", alpha: 0.15 },
  },
  golden: {
    id: "golden",
    badgeEmoji: "✨",
    tint: [1.35, 1.08, 0.45],
    saturation: 1.35,
    lightness: 0.1,
    glow: { color: "#ffd54f", alpha: 0.28 },
  },
};
