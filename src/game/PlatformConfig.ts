import type { SpeedCurve } from "./platformTypes";

export const PLATFORM_VARIANTS = {
  wide: { widthScale: 1.38, scoreMultiplier: 1 },
  narrow: { widthScale: 0.68, scoreMultiplier: 1 },
  normal: { widthScale: 1, scoreMultiplier: 1 },
} as const;

/** Original fixed cross-screen time (seconds). */
export const OG_CROSS_TIME = 1;

/** Score below this uses OG fixed speed only — no randomisation. */
export const SPEED_TIER_MID = 30;

/** Score at/above this uses medium slow-log frequency. */
export const SPEED_TIER_HIGH = 70;

/** Slow-only cross times (never faster than OG). */
export const SLOW_CROSS_TIMES = [1.45, 1.55, 1.65] as const;

/** Chance of a slow log between score 30–69. */
export const SLOW_FREQ_LOW = 0.18;

/** Chance of a slow log at score 70+. */
export const SLOW_FREQ_MED = 0.42;

export const STEADY_CURVE: SpeedCurve = "steady";
