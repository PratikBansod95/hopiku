import type { PandaSkinId } from "@config/progression.constants";

export const SKIN_ORDER: PandaSkinId[] = ["default", "ninja", "cloud", "summit", "golden"];

export const SKIN_BADGES: Record<PandaSkinId, string> = {
  default: "🐼",
  ninja: "🥷",
  cloud: "☁️",
  summit: "🏔️",
  golden: "✨",
};
