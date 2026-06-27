import type { LifetimeStats } from "@core/types";

/** Set false when real unlock rules are ready. */
export const UNLOCK_ALL_SKINS_FOR_TESTING = false;

export const SAVE_VERSION = 2;
export const DEFAULT_SKIN_ID = "default";

export const DEFAULT_LIFETIME_STATS: LifetimeStats = {
  totalLogs: 0,
  totalPerfects: 0,
  totalGoods: 0,
  bestCombo: 0,
  runsPlayed: 0,
  bestLogsInRun: 0,
  summitReached: false,
};

/** Logs required to reach Sacred Summit (last biome). */
export const SUMMIT_UNLOCK_LOGS = 54;

/** Best single-run score required to unlock each skin. */
export const SKIN_UNLOCK_SCORES = {
  ninja: 40,
  cloud: 100,
  summit: 180,
  golden: 300,
} as const;

export const UNLOCK_IDS = {
  GOLDEN_PANDA: "golden_panda",
  NINJA_PANDA: "ninja_panda",
  CLOUD_PANDA: "cloud_panda",
  SUMMIT_PIONEER: "summit_pioneer",
} as const;

export type UnlockId = (typeof UNLOCK_IDS)[keyof typeof UNLOCK_IDS];

export interface UnlockDefinition {
  id: UnlockId;
  name: string;
  description: string;
  skinId: string | null;
  check: (stats: LifetimeStats, highScore: number) => boolean;
}

export const UNLOCK_DEFINITIONS: UnlockDefinition[] = [
  {
    id: UNLOCK_IDS.NINJA_PANDA,
    name: "Ninja Panda",
    description: `Score ${SKIN_UNLOCK_SCORES.ninja}+ in one run`,
    skinId: "ninja",
    check: (_stats, highScore) => highScore >= SKIN_UNLOCK_SCORES.ninja,
  },
  {
    id: UNLOCK_IDS.CLOUD_PANDA,
    name: "Cloud Panda",
    description: `Score ${SKIN_UNLOCK_SCORES.cloud}+ in one run`,
    skinId: "cloud",
    check: (_stats, highScore) => highScore >= SKIN_UNLOCK_SCORES.cloud,
  },
  {
    id: UNLOCK_IDS.SUMMIT_PIONEER,
    name: "Summit Panda",
    description: `Score ${SKIN_UNLOCK_SCORES.summit}+ in one run`,
    skinId: "summit",
    check: (_stats, highScore) => highScore >= SKIN_UNLOCK_SCORES.summit,
  },
  {
    id: UNLOCK_IDS.GOLDEN_PANDA,
    name: "Golden Panda",
    description: `Score ${SKIN_UNLOCK_SCORES.golden}+ in one run`,
    skinId: "golden",
    check: (_stats, highScore) => highScore >= SKIN_UNLOCK_SCORES.golden,
  },
];

export const PANDA_SKINS = {
  default: { id: "default", name: "Classic Panda", unlockId: null },
  golden: { id: "golden", name: "Golden Panda", unlockId: UNLOCK_IDS.GOLDEN_PANDA },
  ninja: { id: "ninja", name: "Ninja Panda", unlockId: UNLOCK_IDS.NINJA_PANDA },
  cloud: { id: "cloud", name: "Cloud Panda", unlockId: UNLOCK_IDS.CLOUD_PANDA },
  summit: { id: "summit", name: "Summit Panda", unlockId: UNLOCK_IDS.SUMMIT_PIONEER },
} as const;

export type PandaSkinId = keyof typeof PANDA_SKINS;

export function getUnlockDefinition(id: string): UnlockDefinition | undefined {
  return UNLOCK_DEFINITIONS.find((def) => def.id === id);
}

export function getSkinUnlockDescription(skinId: PandaSkinId): string {
  const skin = PANDA_SKINS[skinId];
  if (!skin.unlockId) return "Always available";
  return getUnlockDefinition(skin.unlockId)?.description ?? "Complete a challenge";
}

export function sanitizeEquippedSkin(skinId: string, unlocks: string[]): PandaSkinId {
  if (!(skinId in PANDA_SKINS)) return DEFAULT_SKIN_ID;
  const id = skinId as PandaSkinId;
  const skin = PANDA_SKINS[id];
  if (!skin.unlockId || UNLOCK_ALL_SKINS_FOR_TESTING) return id;
  return unlocks.includes(skin.unlockId) ? id : DEFAULT_SKIN_ID;
}
