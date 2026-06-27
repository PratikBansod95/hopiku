import { PHYSICS, SPAWN } from "@config/game.constants";
import { Platform } from "@entities/Platform";
import type { RuntimeState } from "@core/GameContext";
import {
  hideGameOver,
  resetScoreDisplay,
  showPlaying,
  showStart,
  updateZoneHud,
} from "@ui/dom";
import { createDefaultSpawnMemory, planSpawn } from "@world/spawn/SpawnPlanner";
import { createDefaultRunSession, commitRunFromState } from "@services/ProgressionService";
import { getSave } from "@services/SaveService";
import { closeWardrobe, refreshWardrobeIfOpen } from "@ui/wardrobe";

export function isPerfectLanding(platform: Platform, layout: RuntimeState["layout"]): boolean {
  const tolerance = layout.blockWidth * platform.widthScale * PHYSICS.perfectTolerance;
  return Math.abs(platform.x - layout.centerX) <= tolerance;
}

export function spawnNextPlatform(state: RuntimeState): void {
  const last = state.platforms[state.platforms.length - 1];
  const spawn = planSpawn(state.spawnMemory, state.score, state.layout, SPAWN.blockSpawnPadding);
  state.platforms.push(
    new Platform(
      state.platforms.length,
      last.y - state.layout.blockHeight,
      spawn,
      state.layout.centerX,
    ),
  );
}

export function resetRound(state: RuntimeState): void {
  state.score = 0;
  state.combo = 0;
  state.jumpBuffer = 0;
  state.cameraY = 0;
  state.targetCameraY = 0;
  state.platforms = [];
  state.particles.clear();
  state.gamePhase = "START";
  state.deathStateTimer = 0;
  state.cameraShake = { x: 0, y: 0, time: 0, intensity: 0 };
  state.lastScore = 0;
  state.logsClimbed = 0;
  state.runSession = createDefaultRunSession();
  state.runCommitted = false;
  state.pauseSource = "none";
  closeWardrobe(state);
  state.spawnMemory = createDefaultSpawnMemory();
  state.background.reset();
  state.ambience.clear();
  state.menuAmbience.seed(state.layout.canvasWidth, state.layout.canvasHeight);

  resetScoreDisplay(state.dom, 0);
  hideGameOver(state.dom);
  showStart(state.dom, state.highScore);
  updateZoneHud(state.dom, "Bamboo Grove", 0);

  state.player.reset(state.layout.centerX, state.layout.canvasHeight);
  state.platforms.push(
    new Platform(0, state.player.groundY, null, state.layout.centerX),
  );
}

export function startPlaying(state: RuntimeState): void {
  state.gamePhase = "PLAYING";
  state.menuAmbience.clear();
  showPlaying(state.dom, state.highScore);
  updateZoneHud(state.dom, state.background.getCurrentBiome().name, state.logsClimbed);
  spawnNextPlatform(state);
}

export function instantRestart(state: RuntimeState): void {
  resetRound(state);
  startPlaying(state);
}

export function performJump(state: RuntimeState): void {
  state.feedback.jump();
  state.player.jump(state.layout.blockHeight, () => {
    state.jumpBuffer = 0;
  });
}

export function goHome(state: RuntimeState): void {
  commitRunFromState(state);
  state.highScore = getSave().highScore;
  refreshWardrobeIfOpen(state);
  resetRound(state);
}
