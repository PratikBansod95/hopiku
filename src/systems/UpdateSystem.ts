import { PHYSICS, SHAKE, TIMING } from "@config/game.constants";
import type { RuntimeState } from "@core/GameContext";
import { updateHighScore } from "@services/SaveService";
import { hideHud, showGameOver } from "@ui/dom";
import { checkCollisions } from "@systems/CollisionSystem";
import { shake, updateShake } from "@systems/CameraShakeSystem";

export function updateGame(state: RuntimeState, dt: number, onJump: () => void): void {
  if (state.gamePhase === "PAUSED" || state.ytPaused) return;

  if (state.jumpBuffer > 0) state.jumpBuffer -= dt;

  const ctx = {
    gamePhase: state.gamePhase,
    gravity: PHYSICS.gravity,
  };

  if (state.gamePhase === "PLAYING") {
    state.player.update(dt, ctx);

    for (const platform of state.platforms) {
      platform.update(dt, state.layout.centerX);
    }

    checkCollisions(state, onJump);

    const cameraEase = 1 - Math.exp(-8 * dt);
    state.cameraY += (state.targetCameraY - state.cameraY) * cameraEase;
  } else if (state.gamePhase === "DYING_FALL") {
    for (let i = 0; i < state.platforms.length; i += 1) {
      const platform = state.platforms[i];
      const slow =
        i === state.platforms.length - 1 && !platform.isStopped ? 0.5 : 1;
      platform.update(dt * slow, state.layout.centerX);
    }

    state.player.update(dt, ctx);
    state.deathStateTimer -= dt;

    if (state.deathStateTimer <= 0) {
      state.gamePhase = "DYING_SMOKE";
      state.deathStateTimer = TIMING.deathSmokeDuration;
      shake(state.cameraShake, SHAKE.impactIntensity, SHAKE.impactDuration);
      const burstY = state.layout.canvasHeight - state.cameraY;
      state.particles.spawnImpactBurst(state.player.x, burstY);
      state.feedback.impact();
    }
  } else if (state.gamePhase === "DYING_SMOKE") {
    state.player.update(dt, ctx);
    state.deathStateTimer -= dt;

    if (state.deathStateTimer <= 0) {
      state.gamePhase = "DYING_TAUNT";
      state.deathStateTimer = TIMING.deathTauntDuration;
      hideHud(state.dom);
      const best = updateHighScore(state.score);
      state.highScore = Math.max(state.highScore, best, state.score);
      showGameOver(state.dom, state.score, state.highScore);
    }
  } else if (state.gamePhase === "DYING_TAUNT") {
    state.deathStateTimer -= dt;
    if (state.deathStateTimer <= 0) {
      state.gamePhase = "GAMEOVER";
      state.lastScore = state.score;
    }
  } else if (state.gamePhase === "START") {
    state.player.update(dt, ctx);
  }

  updateShake(state.cameraShake, dt);
  state.particles.update(dt);
  state.background.update(dt);

  if (state.gamePhase === "PLAYING") {
    state.ambience.update(
      dt,
      state.background.getCurrentBiome(),
      state.layout.canvasWidth,
      state.layout.canvasHeight,
      state.cameraY,
    );
  } else if (state.gamePhase === "START") {
    state.menuAmbience.update(dt, state.layout.canvasWidth, state.layout.canvasHeight);
  }
}
