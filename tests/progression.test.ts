import { describe, expect, it, beforeEach } from "vitest";
import {
  DEFAULT_LIFETIME_STATS,
  UNLOCK_IDS,
  UNLOCK_ALL_SKINS_FOR_TESTING,
} from "@config/progression.constants";
import { normalizeSave, writeSave, getSave, DEFAULT_SAVE } from "@services/SaveService";
import {
  commitRunResult,
  evaluateUnlocks,
  equipSkin,
  formatLifetimeStatsLine,
  getEquippedSkinId,
  hasReachedSummit,
} from "@services/ProgressionService";

describe("SaveService", () => {
  beforeEach(() => {
    writeSave({ ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } });
  });

  it("migrates v1 saves to v2 with stats and unlocks", () => {
    const migrated = normalizeSave({ version: 1, highScore: 42 });
    expect(migrated.version).toBe(2);
    expect(migrated.highScore).toBe(42);
    expect(migrated.stats).toEqual(DEFAULT_LIFETIME_STATS);
    expect(migrated.unlocks).toEqual([]);
    expect(migrated.equippedSkin).toBe("default");
  });

  it("preserves v2 save fields", () => {
    const raw = {
      version: 2,
      highScore: 80,
      stats: { ...DEFAULT_LIFETIME_STATS, totalPerfects: 12, runsPlayed: 3 },
      unlocks: [UNLOCK_IDS.NINJA_PANDA],
      equippedSkin: "ninja",
    };
    const migrated = normalizeSave(raw);
    expect(migrated.stats.totalPerfects).toBe(12);
    expect(migrated.unlocks).toContain(UNLOCK_IDS.NINJA_PANDA);
    expect(migrated.equippedSkin).toBe("ninja");
  });
});

describe("ProgressionService", () => {
  beforeEach(() => {
    writeSave({ ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } });
  });

  it("accumulates lifetime stats on run commit", () => {
    commitRunResult({
      score: 25,
      logsClimbed: 10,
      perfects: 8,
      goods: 2,
      peakCombo: 5,
      reachedSummit: false,
    });

    const save = getSave();
    expect(save.stats.runsPlayed).toBe(1);
    expect(save.stats.totalLogs).toBe(10);
    expect(save.stats.totalPerfects).toBe(8);
    expect(save.stats.totalGoods).toBe(2);
    expect(save.stats.bestCombo).toBe(5);
    expect(save.highScore).toBe(25);
  });

  it("unlocks ninja panda at score 50+", () => {
    const unlocked = commitRunResult({
      score: 50,
      logsClimbed: 20,
      perfects: 15,
      goods: 5,
      peakCombo: 6,
      reachedSummit: false,
    });

    expect(getSave().unlocks).toContain(UNLOCK_IDS.NINJA_PANDA);
    expect(unlocked.some((def) => def.id === UNLOCK_IDS.NINJA_PANDA)).toBe(true);
  });

  it("evaluates golden panda from lifetime perfects", () => {
    const stats = { ...DEFAULT_LIFETIME_STATS, totalPerfects: 100 };
    const ids = evaluateUnlocks(stats, 0, []);
    expect(ids).toContain(UNLOCK_IDS.GOLDEN_PANDA);
  });

  it("formats lifetime stats line", () => {
    const line = formatLifetimeStatsLine(
      { ...DEFAULT_LIFETIME_STATS, totalPerfects: 24, runsPlayed: 5 },
      2,
    );
    expect(line).toBe("24 perfects · 5 runs · 2 unlocks");
  });

  it("detects summit threshold", () => {
    expect(hasReachedSummit(53)).toBe(false);
    expect(hasReachedSummit(54)).toBe(true);
  });
});

describe("Skin progression", () => {
  beforeEach(() => {
    writeSave({ ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } });
  });

  it("equips unlocked skins only", () => {
    expect(equipSkin("default")).toBe(true);
    expect(getEquippedSkinId()).toBe("default");

    if (UNLOCK_ALL_SKINS_FOR_TESTING) {
      expect(equipSkin("ninja")).toBe(true);
      expect(getEquippedSkinId()).toBe("ninja");
      return;
    }

    expect(equipSkin("ninja")).toBe(false);

    writeSave({
      ...getSave(),
      unlocks: [UNLOCK_IDS.NINJA_PANDA],
    });
    expect(equipSkin("ninja")).toBe(true);
    expect(getEquippedSkinId()).toBe("ninja");
  });

  it("sanitizes invalid equipped skin on save load", () => {
    const migrated = normalizeSave({
      version: 2,
      highScore: 0,
      stats: DEFAULT_LIFETIME_STATS,
      unlocks: [],
      equippedSkin: "ninja",
    });
    expect(migrated.equippedSkin).toBe(UNLOCK_ALL_SKINS_FOR_TESTING ? "ninja" : "default");
  });
});
