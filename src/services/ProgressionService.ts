import type { LifetimeStats, RunResult, RunSessionStats, SaveData } from "@core/types";
import {
  DEFAULT_SKIN_ID,
  PANDA_SKINS,
  SAVE_VERSION,
  SUMMIT_UNLOCK_LOGS,
  UNLOCK_DEFINITIONS,
  type PandaSkinId,
  type UnlockDefinition,
  UNLOCK_ALL_SKINS_FOR_TESTING,
  sanitizeEquippedSkin,
} from "@config/progression.constants";
import { getSave, writeSave } from "@services/SaveService";
import { playables } from "@platform/youtube/PlayablesBridge";

export function createDefaultRunSession(): RunSessionStats {
  return { perfects: 0, goods: 0, peakCombo: 0 };
}

export function recordPerfectLanding(session: RunSessionStats, combo: number): void {
  session.perfects += 1;
  session.peakCombo = Math.max(session.peakCombo, combo);
}

export function recordGoodLanding(session: RunSessionStats): void {
  session.goods += 1;
}

export function evaluateUnlocks(
  stats: LifetimeStats,
  highScore: number,
  currentUnlocks: string[],
): string[] {
  const newlyUnlocked: string[] = [];

  for (const def of UNLOCK_DEFINITIONS) {
    if (currentUnlocks.includes(def.id)) continue;
    if (def.check(stats, highScore)) {
      newlyUnlocked.push(def.id);
    }
  }

  return newlyUnlocked;
}

export function commitRunResult(result: RunResult): UnlockDefinition[] {
  const save = getSave();
  const stats: LifetimeStats = {
    totalLogs: save.stats.totalLogs + result.logsClimbed,
    totalPerfects: save.stats.totalPerfects + result.perfects,
    totalGoods: save.stats.totalGoods + result.goods,
    bestCombo: Math.max(save.stats.bestCombo, result.peakCombo),
    runsPlayed: save.stats.runsPlayed + 1,
    bestLogsInRun: Math.max(save.stats.bestLogsInRun, result.logsClimbed),
    summitReached: save.stats.summitReached || result.reachedSummit,
  };

  const highScore = Math.max(save.highScore, result.score);
  const unlocks = [...save.unlocks];
  const newUnlockIds = evaluateUnlocks(stats, highScore, unlocks);

  for (const id of newUnlockIds) {
    unlocks.push(id);
  }

  const nextSave: SaveData = {
    version: SAVE_VERSION,
    highScore,
    stats,
    unlocks,
    equippedSkin: save.equippedSkin || DEFAULT_SKIN_ID,
  };

  writeSave(nextSave);

  if (highScore > save.highScore) {
    playables.sendScore(highScore);
  }

  return newUnlockIds
    .map((id) => UNLOCK_DEFINITIONS.find((def) => def.id === id))
    .filter((def): def is UnlockDefinition => def !== undefined);
}

export function formatLifetimeStatsLine(stats: LifetimeStats, unlockCount: number): string {
  const parts = [`${stats.totalPerfects} perfects`, `${stats.runsPlayed} runs`];
  if (unlockCount > 0) {
    parts.push(`${unlockCount} unlock${unlockCount === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

export function hasReachedSummit(logsClimbed: number): boolean {
  return logsClimbed >= SUMMIT_UNLOCK_LOGS;
}

export function commitRunFromState(state: {
  runCommitted: boolean;
  gamePhase: string;
  score: number;
  logsClimbed: number;
  runSession: RunSessionStats;
}): UnlockDefinition[] {
  if (state.runCommitted) return [];
  if (state.gamePhase !== "PLAYING" && state.gamePhase !== "PAUSED") return [];
  if (state.logsClimbed === 0 && state.score === 0) return [];

  state.runCommitted = true;

  return commitRunResult({
    score: state.score,
    logsClimbed: state.logsClimbed,
    perfects: state.runSession.perfects,
    goods: state.runSession.goods,
    peakCombo: state.runSession.peakCombo,
    reachedSummit: hasReachedSummit(state.logsClimbed),
  });
}

export function isSkinUnlocked(skinId: PandaSkinId): boolean {
  if (UNLOCK_ALL_SKINS_FOR_TESTING) return true;
  const skin = PANDA_SKINS[skinId];
  if (!skin.unlockId) return true;
  return getSave().unlocks.includes(skin.unlockId);
}

export function equipSkin(skinId: PandaSkinId): boolean {
  if (!isSkinUnlocked(skinId)) return false;

  const save = getSave();
  writeSave({ ...save, equippedSkin: skinId });
  return true;
}

export function getEquippedSkinId(): PandaSkinId {
  const save = getSave();
  return sanitizeEquippedSkin(save.equippedSkin, save.unlocks);
}
