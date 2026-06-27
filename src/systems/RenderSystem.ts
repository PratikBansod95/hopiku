import type { Layout } from "@core/types";
import { resolveSkinSprites } from "@services/SkinService";
import type { RuntimeState } from "@core/GameContext";
import { drawSpriteCentered } from "@services/AssetService";

function isVisible(y: number, blockHeight: number, cameraY: number, layout: Layout): boolean {
  const pad = blockHeight * 2;
  return (
    y + blockHeight > -cameraY - pad &&
    y < layout.canvasHeight - cameraY + pad
  );
}

function drawJumpTrail(state: RuntimeState, ctx: CanvasRenderingContext2D): void {
  if (!state.player.isJumping || state.player.isDead) return;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(state.player.x, state.player.y + 80);
  ctx.stroke();
  ctx.restore();
}

export function renderGame(state: RuntimeState): void {
  const canvas = state.dom.canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { layout, cameraY, cameraShake } = state;
  ctx.clearRect(0, 0, layout.canvasWidth, layout.canvasHeight);

  state.background.draw(ctx, layout.canvasWidth, layout.canvasHeight, cameraY);

  ctx.save();
  ctx.translate(cameraShake.x, cameraY + cameraShake.y);

  state.ambience.draw(ctx, cameraY);

  for (const platform of state.platforms) {
    if (isVisible(platform.y, layout.blockHeight, cameraY, layout)) {
      platform.draw(ctx, layout, state.images);
    }
  }

  drawJumpTrail(state, ctx);

  const activeSkin = resolveSkinSprites(state.images.skins, state.equippedSkinId);

  state.player.draw(
    ctx,
    layout,
    activeSkin.panda,
    state.gamePhase,
    state.platforms.map((p) => p.y),
  );

  if (state.gamePhase === "DYING_SMOKE" || state.gamePhase === "DYING_TAUNT" || state.gamePhase === "GAMEOVER") {
    const deadY = state.layout.canvasHeight - cameraY - layout.playerHeight * 0.3;
    drawSpriteCentered(
      ctx,
      activeSkin.pandaDead,
      state.player.x,
      deadY,
      layout.playerWidth * 0.9,
    );
  }

  state.particles.draw(ctx);
  ctx.restore();

  if (state.gamePhase === "START") {
    state.menuAmbience.draw(ctx, layout.canvasWidth, layout.canvasHeight);
  }
}
