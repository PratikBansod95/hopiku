import { TIMING } from "@config/game.constants";

export function clampDelta(dt: number): number {
  return dt > TIMING.maxDeltaTime ? TIMING.fallbackDeltaTime : dt;
}
