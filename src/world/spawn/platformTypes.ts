export type PlatformVariant = "normal" | "wide" | "narrow";
export type SpeedCurve = "steady" | "accel" | "decel" | "burst" | "stutter";

export interface PlatformSpawn {
  speed: number;
  spawnDistance: number;
  variant: PlatformVariant;
  widthScale: number;
  scoreMultiplier: number;
  startDelay: number;
  speedCurve: SpeedCurve;
}

export interface SpawnMemory {
  lastSide: 1 | -1;
  lastCrossTimes: number[];
  lastVariant: PlatformVariant | null;
}
