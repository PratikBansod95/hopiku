import type { ComboTier, TauntTier } from "@core/types";

export const GAME_TITLE = "Hopiku";
export const TAGLINE = "Hop Higher. Dream Bigger.";

export const PHYSICS = {
  gravity: 2500,
  jumpMultiplier: 2,
  perfectTolerance: 0.06,
  inputBufferTime: 0.15,
  particleGravityScale: 0.5,
} as const;

export const SIZING = {
  blockWidthRatio: 0.31,
  blockHeightRatio: 0.38,
  playerWidthRatio: 0.94,
  playerSpriteAspect: 1.2,
  stumpWidthRatio: 0.474,
  stumpLandingSurfaceRatio: 0.14,
  bambooVisualHeightScale: 1.12,
  bambooLandingSurfaceRatio: 0.22,
  bambooLandingInsetRatio: 0.08,
  playerGroundRatio: 0.68,
  playerHayStandOffsetRatio: 0.06,
  playerHitboxWidthRatio: 0.35,
  playerHitboxHeightRatio: 0.8,
} as const;

export const TIMING = {
  maxDeltaTime: 0.033,
  fallbackDeltaTime: 0.016,
  squashDuration: 0.4,
  blockWobbleDuration: 0.15,
  blockFlashDuration: 0.3,
  deathFallDuration: 1,
  deathSmokeDuration: 1.5,
  deathTauntDuration: 2,
  scorePopDurationMs: 100,
  inputDebounceMs: 80,
} as const;

export const SPAWN = {
  blockSpawnPadding: 20,
} as const;

export const SCORING = {
  goodPoints: 1,
  perfectTextSize: 25,
  goodTextSize: 18,
  perfectColor: "#ffeb3b",
  goodColor: "#ffffff",
  perfectTextOffsetY: 10,
  perfectScoreOffsetY: 20,
  perfectTextXRatio: 0.7,
  comboTiers: [
    { minCombo: 1, maxCombo: 2, points: 2, labelSize: 25 },
    { minCombo: 3, maxCombo: 5, points: 3, labelSize: 25 },
    { minCombo: 6, maxCombo: 9, points: 4, labelSize: 25 },
    { minCombo: 10, maxCombo: Infinity, points: 5, labelSize: 30 },
  ] satisfies ComboTier[],
} as const;

export const TAUNTS: TauntTier[] = [
  { maxScore: 30, title: "BAMBOO BLUNDER", sub: "Oops! Even pandas have off days!" },
  { maxScore: 60, title: "LOG SPLAT", sub: "The bamboo is not impressed." },
  { maxScore: 90, title: "MID-HOP ENERGY", sub: "Mid-climb energy. Keep hopping." },
  { maxScore: 120, title: "SO CLOSE, SO CLUMSY", sub: "So close to greatness. So far from the top." },
  { maxScore: Infinity, title: "PANDA PRO", sub: "A true Hopiku master. Respect." },
];

export const SHAKE = {
  perfectIntensity: 8,
  perfectDuration: 0.2,
  deathIntensity: 15,
  deathDuration: 0.2,
  impactIntensity: 45,
  impactDuration: 0.5,
} as const;

export const COLORS = {
  impactSmoke: "rgba(234, 179, 8, 0.8)",
  impactStar: "#facc15",
  floatingTextStroke: "#1b4332",
} as const;
