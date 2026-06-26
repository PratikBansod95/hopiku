import {
  OG_CROSS_TIME,
  PLATFORM_VARIANTS,
  SLOW_CROSS_TIMES,
  SLOW_FREQ_LOW,
  SLOW_FREQ_MED,
  SPEED_TIER_HIGH,
  SPEED_TIER_MID,
  STEADY_CURVE,
} from "./PlatformConfig";
import type { Layout } from "./types";
import type { PlatformSpawn, PlatformVariant, SpawnMemory } from "./platformTypes";

function pickSlowCrossTime(): number {
  return SLOW_CROSS_TIMES[Math.floor(Math.random() * SLOW_CROSS_TIMES.length)];
}

function pickCrossTime(score: number, memory: SpawnMemory): number {
  if (score < SPEED_TIER_MID) {
    return OG_CROSS_TIME;
  }

  let slowChance = score < SPEED_TIER_HIGH ? SLOW_FREQ_LOW : SLOW_FREQ_MED;

  const recent = memory.lastCrossTimes.slice(-2);
  if (recent.length === 2) {
    const bothSlow = recent.every((t) => t > OG_CROSS_TIME);
    const bothNormal = recent.every((t) => t <= OG_CROSS_TIME);
    if (bothSlow) slowChance *= 0.35;
    if (bothNormal && score >= SPEED_TIER_HIGH) slowChance *= 1.25;
  }

  return Math.random() < slowChance ? pickSlowCrossTime() : OG_CROSS_TIME;
}

function pickVariant(_memory: SpawnMemory, _score: number): PlatformVariant {
  const roll = Math.random();
  if (roll < 0.13) return "wide";
  if (roll < 0.26) return "narrow";
  return "normal";
}

function pickSide(memory: SpawnMemory): 1 | -1 {
  if (Math.random() < 0.38) {
    return memory.lastSide === 1 ? -1 : 1;
  }
  return Math.random() > 0.5 ? 1 : -1;
}

export function createDefaultSpawnMemory(): SpawnMemory {
  return { lastSide: 1, lastCrossTimes: [], lastVariant: null };
}

export function planSpawn(
  memory: SpawnMemory,
  score: number,
  layout: Layout,
  blockSpawnPadding: number,
): PlatformSpawn {
  const crossTime = pickCrossTime(score, memory);
  const variant = pickVariant(memory, score);
  const variantData = PLATFORM_VARIANTS[variant];
  const side = pickSide(memory);
  const spawnDistance =
    layout.canvasWidth / 2 + layout.blockWidth * variantData.widthScale + blockSpawnPadding;

  memory.lastCrossTimes.push(crossTime);
  if (memory.lastCrossTimes.length > 5) memory.lastCrossTimes.shift();
  memory.lastVariant = variant;
  memory.lastSide = side;

  return {
    speed: spawnDistance / crossTime,
    spawnDistance: side * spawnDistance,
    variant,
    widthScale: variantData.widthScale,
    scoreMultiplier: variantData.scoreMultiplier,
    startDelay: 0,
    speedCurve: STEADY_CURVE,
  };
}
