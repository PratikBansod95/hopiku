import { PHYSICS } from "@config/game.constants";
import type { RuntimeState } from "@core/GameContext";
import { hidePaused, showPaused } from "@ui/dom";
import { instantRestart, startPlaying } from "@systems/RoundSystem";

export function handleTap(state: RuntimeState, onJump: () => void): void {
  if (state.wardrobeOpen) return;

  state.feedback.tap();

  if (state.gamePhase === "GAMEOVER") {
    instantRestart(state);
    return;
  }

  if (state.gamePhase === "START") {
    startPlaying(state);
    return;
  }

  if (state.gamePhase === "PLAYING") {
    if (state.player.isJumping) {
      if (state.player.vy > 0) {
        state.jumpBuffer = PHYSICS.inputBufferTime;
      }
    } else {
      onJump();
    }
  }
}

export function pauseGame(state: RuntimeState): void {
  if (state.gamePhase === "PLAYING") {
    state.gamePhase = "PAUSED";
    showPaused(state.dom);
  }
}

export function resumeGame(state: RuntimeState): void {
  if (state.gamePhase === "PAUSED") {
    state.gamePhase = "PLAYING";
    hidePaused(state.dom);
  }
}

export function handleYoutubePause(state: RuntimeState): void {
  state.ytPaused = true;
  if (state.gamePhase === "PLAYING") {
    pauseGame(state);
  }
}

export function handleYoutubeResume(state: RuntimeState): void {
  state.ytPaused = false;
  if (state.gamePhase === "PAUSED") {
    resumeGame(state);
  }
}
