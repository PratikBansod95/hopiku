import { SHAKE, TIMING } from "@config/game.constants";
import type { RuntimeState } from "@core/GameContext";
import { shake } from "@systems/CameraShakeSystem";

export function handleDeath(state: RuntimeState, direction: number): void {
  if (state.gamePhase !== "PLAYING") return;
  state.gamePhase = "DYING_FALL";
  state.player.die(
    direction,
    state.layout.canvasWidth,
    state.layout.playerWidth,
    state.cameraY,
    state.layout.canvasHeight,
    state.layout.playerHeight,
  );
  shake(state.cameraShake, SHAKE.deathIntensity, SHAKE.deathDuration);
  state.deathStateTimer = TIMING.deathFallDuration;
  state.feedback.death();
}
