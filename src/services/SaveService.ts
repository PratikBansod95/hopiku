import type { SaveData } from "@core/types";
import { playables } from "@platform/youtube/PlayablesBridge";

const STORAGE_KEY = "hopiku-save";
const LEGACY_STORAGE_KEY = "grove-rise-save";
const DEFAULT_SAVE: SaveData = { version: 1, highScore: 0 };

let cachedSave: SaveData = { ...DEFAULT_SAVE };
let cloudReady = false;

function parseSave(raw: string | null | undefined): SaveData {
  if (!raw) return { ...DEFAULT_SAVE };
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      version: 1,
      highScore:
        typeof parsed.highScore === "number" && parsed.highScore >= 0
          ? parsed.highScore
          : 0,
    };
  } catch {
    return { ...DEFAULT_SAVE };
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
    return { ...DEFAULT_SAVE };
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
  cachedSave = data;

  if (playables.isActive()) {
    if (!cloudReady) return;
    void playables.saveData(JSON.stringify(data));
    return;
  }

  writeLocalSave(data);
}

export function flushSave(): void {
  writeSave(cachedSave);
}

export function updateHighScore(score: number): number {
  const best = Math.max(cachedSave.highScore, score);
  if (best > cachedSave.highScore) {
    writeSave({ version: 1, highScore: best });
    playables.sendScore(best);
  }
  return best;
}
