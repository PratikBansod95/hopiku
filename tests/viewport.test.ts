import { describe, expect, it } from "vitest";
import { MAX_GAME_WIDTH, getGameFrame } from "@utils/viewport";

describe("getGameFrame", () => {
  it("uses full width on a typical phone", () => {
    const frame = getGameFrame({ width: 390, height: 844, offsetLeft: 0, offsetTop: 0 });
    expect(frame.width).toBe(390);
    expect(frame.height).toBe(844);
    expect(frame.left).toBe(0);
    expect(frame.top).toBe(0);
  });

  it("centers and caps width on desktop landscape", () => {
    const frame = getGameFrame({ width: 1920, height: 1080, offsetLeft: 0, offsetTop: 0 });
    expect(frame.width).toBe(MAX_GAME_WIDTH);
    expect(frame.left).toBe(Math.round((1920 - MAX_GAME_WIDTH) / 2));
    expect(frame.top).toBeGreaterThan(0);
  });

  it("respects visual viewport offset", () => {
    const frame = getGameFrame({ width: 400, height: 800, offsetLeft: 12, offsetTop: 8 });
    expect(frame.left).toBeGreaterThanOrEqual(12);
    expect(frame.top).toBeGreaterThanOrEqual(8);
  });
});
