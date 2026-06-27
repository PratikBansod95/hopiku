import { SIZING } from "@config/game.constants";
import type { RuntimeState } from "@core/GameContext";
import { handleDeath } from "@systems/DeathSystem";
import { handleLanding } from "@systems/LandingSystem";

export function checkCollisions(state: RuntimeState, onJump: () => void): void {
  if (state.platforms.length < 2) return;

  const current = state.platforms[state.platforms.length - 1];
  const previous = state.platforms[state.platforms.length - 2];
  const { player, layout } = state;

  const hitLeft = player.x - layout.playerWidth * SIZING.playerHitboxWidthRatio;
  const hitRight = player.x + layout.playerWidth * SIZING.playerHitboxWidthRatio;
  const platWidth = current.getWidth(layout);
  const inset =
    current.index === 0 ? 0 : platWidth * SIZING.bambooLandingInsetRatio;
  const platLeft = current.x - platWidth / 2 + inset;
  const platRight = current.x + platWidth / 2 - inset;

  if (player.vy > 0) {
    const landingY = current.y;
    if (
      player.lastY <= landingY + 10 &&
      player.y >= landingY - 15 &&
      hitRight > platLeft &&
      hitLeft < platRight
    ) {
      handleLanding(state, current, landingY, onJump);
      return;
    }

    if (player.y >= previous.y && player.isJumping) {
      player.land(previous.y, state.jumpBuffer > 0, layout.blockHeight, onJump);
    }
  }

  if (
    !current.isStopped &&
    player.y > current.y + 10 &&
    player.y - layout.playerHeight * SIZING.playerHitboxHeightRatio <
      current.y + layout.blockHeight &&
    hitRight > platLeft + 5 &&
    hitLeft < platRight - 5
  ) {
    handleDeath(state, -current.side);
  }

  if (
    player.y >
    layout.canvasHeight - state.cameraY + layout.playerHeight * 2
  ) {
    handleDeath(state, Math.random() > 0.5 ? 1 : -1);
  }
}
