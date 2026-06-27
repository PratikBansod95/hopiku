import type { LifetimeStats, SaveData } from "@core/types";
import {
  DEFAULT_LIFETIME_STATS,
  DEFAULT_SKIN_ID,
  SAVE_VERSION,
} from "@config/progression.constants";
import { playables } from "@platform/youtube/PlayablesBridge";

const STORAGE_KEY = "hopiku-save";
const LEGACY_STORAGE_KEY = "grove-rise-save";

export const DEFAULT_SAVE: SaveData = {
  version: SAVE_VERSION,
  highScore: 0,
  stats: { ...DEFAULT_LIFETIME_STATS },
  unlocks: [],
  equippedSkin: DEFAULT_SKIN_ID,
};

let cachedSave: SaveData = { ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } };
let cloudReady = false;

function clampNonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function parseLifetimeStats(raw: Partial<LifetimeStats> | undefined): LifetimeStats {
  return {
    totalLogs: clampNonNegativeInt(raw?.totalLogs),
    totalPerfects: clampNonNegativeInt(raw?.totalPerfects),
    totalGoods: clampNonNegativeInt(raw?.totalGoods),
    bestCombo: clampNonNegativeInt(raw?.bestCombo),
    runsPlayed: clampNonNegativeInt(raw?.runsPlayed),
    bestLogsInRun: clampNonNegativeInt(raw?.bestLogsInRun),
    summitReached: raw?.summitReached === true,
  };
}

export function normalizeSave(raw: unknown): SaveData {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } };
  }

  const parsed = raw as Partial<SaveData>;
  const highScore = clampNonNegativeInt(parsed.highScore);
  const version = typeof parsed.version === "number" ? parsed.version : 1;

  if (version >= 2) {
    const unlocks = Array.isArray(parsed.unlocks)
      ? parsed.unlocks.filter((id): id is string => typeof id === "string")
      : [];

    return {
      version: SAVE_VERSION,
      highScore,
      stats: parseLifetimeStats(parsed.stats),
      unlocks,
      equippedSkin:
        typeof parsed.equippedSkin === "string" && parsed.equippedSkin.length > 0
          ? parsed.equippedSkin
          : DEFAULT_SKIN_ID,
    };
  }

  return {
    version: SAVE_VERSION,
    highScore,
    stats: { ...DEFAULT_LIFETIME_STATS },
    unlocks: [],
    equippedSkin: DEFAULT_SKIN_ID,
  };
}

function parseSave(raw: string | null | undefined): SaveData {
  if (!raw) {
    return { ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } };
  }

  try {
    return normalizeSave(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } };
  }
}

function readLocalSave(): SaveData {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    return parseSave(raw);
  } catch {
    return { ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } };
  }
}

function writeLocalSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be blocked in some playable iframes.
  }
}

export async function initSave(): Promise<SaveData> {
  if (playables.isActive()) {
    const cloud = await playables.loadData();
    cachedSave = parseSave(cloud);
    cloudReady = true;
    return cachedSave;
  }

  cachedSave = readLocalSave();
  cloudReady = true;
  return cachedSave;
}

export function getSave(): SaveData {
  return cachedSave;
}

export function writeSave(data: SaveData): void {
  cachedSave = normalizeSave(data);

  if (playables.isActive()) {
    if (!cloudReady) return;
    void playables.saveData(JSON.stringify(cachedSave));
    return;
  }

  writeLocalSave(cachedSave);
}

export function flushSave(): void {
  writeSave(cachedSave);
}

export function updateHighScore(score: number): number {
  const best = Math.max(cachedSave.highScore, score);
  if (best > cachedSave.highScore) {
    writeSave({ ...cachedSave, highScore: best });
    playables.sendScore(best);
  }
  return best;
}
