import { PHYSICS, SIZING, TIMING } from "./constants";
import type { GamePhase, Layout } from "./types";
import { drawSpriteCentered, spriteAspect } from "../utils/assets";

export interface PlayerUpdateContext {
  gamePhase: GamePhase;
  gravity: number;
}

export class Player {
  x = 0;
  groundY = 0;
  y = 0;
  lastY = 0;
  vy = 0;
  vx = 0;
  rotation = 0;
  angularVelocity = 0;
  isJumping = false;
  isDead = false;
  scaleX = 1;
  scaleY = 1;
  squashTimer = 0;
  idleTime = 0;

  reset(centerX: number, canvasHeight: number): void {
    this.x = centerX;
    this.groundY = canvasHeight * SIZING.playerGroundRatio;
    this.y = this.groundY;
    this.lastY = this.y;
    this.vy = 0;
    this.vx = 0;
    this.rotation = 0;
    this.angularVelocity = 0;
    this.isJumping = false;
    this.isDead = false;
    this.scaleX = 1;
    this.scaleY = 1;
    this.squashTimer = 0;
    this.idleTime = 0;
  }

  jump(blockHeight: number, onJump?: () => void): void {
    this.isJumping = true;
    const jumpHeight = blockHeight * PHYSICS.jumpMultiplier;
    this.vy = -Math.sqrt(2 * PHYSICS.gravity * jumpHeight);
    this.scaleX = 0.6;
    this.scaleY = 1.4;
    onJump?.();
  }

  die(
    direction: number,
    targetX: number,
    playerWidth: number,
    cameraY: number,
    canvasHeight: number,
    playerHeight: number,
  ): void {
    this.isDead = true;
    this.isJumping = true;
    const duration = 1;
    const destX = direction > 0 ? targetX + playerWidth : -playerWidth;
    this.vx = (destX - this.x) / duration;
    const targetY = canvasHeight - cameraY + playerHeight;
    this.vy =
      (targetY - this.y - 0.5 * PHYSICS.gravity * duration * duration) / duration;
    this.angularVelocity = direction * Math.PI * 2.5;
  }

  update(dt: number, ctx: PlayerUpdateContext): void {
    this.lastY = this.y;

    if (ctx.gamePhase === "START") {
      this.idleTime += dt;
    }

    if (ctx.gamePhase !== "DYING_FALL" && this.isDead) return;

    if (this.isJumping || this.isDead) {
      this.vy += ctx.gravity * dt;
      this.y += this.vy * dt;
      this.x += this.vx * dt;
      this.rotation += this.angularVelocity * dt;

      if (this.isDead) {
        this.scaleX = 1;
        this.scaleY = 1;
      } else {
        const stretch = Math.min(Math.abs(this.vy) / 1500, 0.4);
        const ease = 1 - Math.exp(-15 * dt);
        this.scaleX += (1 - stretch - this.scaleX) * ease;
        this.scaleY += (1 + stretch - this.scaleY) * ease;
      }
    } else {
      this.y = this.groundY;
      this.vy = 0;
      this.rotation = 0;

      if (this.squashTimer > 0) {
        this.squashTimer -= dt;
        let t = 1 - this.squashTimer / TIMING.squashDuration;
        t = Math.max(0, Math.min(1, t));
        const bounce = Math.sin(t * Math.PI * 6) * Math.exp(-t * 8) * 0.5;
        this.scaleX = 1 + bounce;
        this.scaleY = 1 - bounce;
      } else {
        this.scaleX = 1;
        this.scaleY = 1;
      }
    }
  }

  land(
    groundY: number,
    bufferedJump: boolean,
    blockHeight: number,
    onJump?: () => void,
  ): void {
    this.isJumping = false;
    this.vy = 0;
    this.groundY = groundY;
    this.y = groundY;
    this.squashTimer = TIMING.squashDuration;
    this.scaleX = 1.45;
    this.scaleY = 0.55;
    if (bufferedJump) {
      this.jump(blockHeight, onJump);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    panda: HTMLImageElement,
    gamePhase: GamePhase,
    platformYs: number[],
  ): void {
    const { blockHeight, playerWidth } = layout;

    let standOffset = 0;
    for (let i = platformYs.length - 1; i >= 0; i -= 1) {
      if (this.y <= platformYs[i] + 10) {
        if (i > 0) {
          standOffset = blockHeight * SIZING.playerHayStandOffsetRatio;
        }
        break;
      }
    }

    const drawY = this.y + standOffset;

    if (!this.isDead && !this.isJumping) {
      const shadowY = drawY;

      ctx.save();
      ctx.translate(this.x, shadowY + 2);
      const shadowW = playerWidth * 0.6 * 0.55;
      ctx.scale(1, 0.25);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(0, 0, shadowW / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let sx = this.scaleX;
    let sy = this.scaleY;
    if (gamePhase === "START") {
      sx *= 1 + Math.sin(this.idleTime * 3) * 0.02;
      sy *= 1 - Math.sin(this.idleTime * 3) * 0.02;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(sx, sy);

    drawSpriteCentered(ctx, panda, 0, 0, playerWidth, standOffset);
    ctx.restore();
  }

  static computeLayout(
    canvasWidth: number,
    canvasHeight: number,
    panda?: HTMLImageElement,
  ): Layout {
    const blockWidth = canvasWidth * SIZING.blockWidthRatio;
    const blockHeight = blockWidth * SIZING.blockHeightRatio;
    const playerWidth = blockWidth * SIZING.playerWidthRatio;
    const aspect = panda ? spriteAspect(panda, SIZING.playerSpriteAspect) : SIZING.playerSpriteAspect;
    const playerHeight = playerWidth * aspect;

    return {
      canvasWidth,
      canvasHeight,
      centerX: canvasWidth / 2,
      centerY: canvasHeight / 2,
      devicePixelRatio: window.devicePixelRatio || 1,
      blockWidth,
      blockHeight,
      playerWidth,
      playerHeight,
    };
  }
}
