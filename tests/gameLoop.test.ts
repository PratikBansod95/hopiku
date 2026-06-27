import { describe, expect, it } from "vitest";
import { clampDelta } from "@core/GameLoop";
import { TIMING } from "@config/game.constants";
import { isPerfectLanding } from "@systems/RoundSystem";
import { Platform } from "@entities/Platform";

describe("GameLoop", () => {
  it("clamps large delta times", () => {
    expect(clampDelta(TIMING.maxDeltaTime + 1)).toBe(TIMING.fallbackDeltaTime);
    expect(clampDelta(0.01)).toBe(0.01);
  });
});

describe("RoundSystem", () => {
  it("detects perfect landings within tolerance", () => {
    const layout = {
      canvasWidth: 400,
      canvasHeight: 800,
      centerX: 200,
      centerY: 400,
      devicePixelRatio: 1,
      blockWidth: 120,
      blockHeight: 46,
      playerWidth: 80,
      playerHeight: 96,
    };

    const platform = new Platform(1, 500, null, 200);
    expect(isPerfectLanding(platform, layout)).toBe(true);

    platform.x = 250;
    expect(isPerfectLanding(platform, layout)).toBe(false);
  });
});
