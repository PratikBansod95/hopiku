import { SIZING, TIMING } from "./constants";
import type { Layout } from "./types";
import { drawSpriteTopLeft, spriteAspect } from "../utils/assets";
import type { GameImages } from "./types";
import type { PlatformSpawn, PlatformVariant, SpeedCurve } from "./platformTypes";

export class Platform {
  index: number;
  y: number;
  x: number;
  isStopped = false;
  flashTimer = 0;
  wobbleTimer = 0;
  side: 1 | -1;
  speed: number;
  variant: PlatformVariant;
  widthScale: number;
  scoreMultiplier: number;
  startDelay: number;
  delayRemaining: number;
  speedCurve: SpeedCurve;
  moveTime = 0;
  stutterPhase = 0;

  constructor(
    index: number,
    y: number,
    spawn: PlatformSpawn | null,
    centerX: number,
  ) {
    this.index = index;
    this.y = y;
    this.variant = spawn?.variant ?? "normal";
    this.widthScale = spawn?.widthScale ?? 1;
    this.scoreMultiplier = spawn?.scoreMultiplier ?? 1;
    this.startDelay = spawn?.startDelay ?? 0;
    this.delayRemaining = spawn?.startDelay ?? 0;
    this.speedCurve = spawn?.speedCurve ?? "steady";
    this.speed = spawn?.speed ?? 0;
    this.side = spawn ? (spawn.spawnDistance > 0 ? 1 : -1) : 1;

    if (index === 0) {
      this.x = centerX;
      this.isStopped = true;
      this.variant = "normal";
      this.widthScale = 1;
    } else if (spawn) {
      this.x = centerX + spawn.spawnDistance;
    } else {
      this.x = centerX;
    }
  }

  getWidth(layout: Layout): number {
    return layout.blockWidth * this.widthScale;
  }

  getSpeedMultiplier(): number {
    switch (this.speedCurve) {
      case "accel":
        return 0.55 + Math.min(this.moveTime, 1.4) * 0.85;
      case "decel":
        return Math.max(0.42, 1.45 - Math.min(this.moveTime, 1.2) * 0.75);
      case "burst":
        return this.moveTime < 0.45 ? 1.55 : 0.58;
      case "stutter":
        this.stutterPhase += 0.08;
        return 0.35 + (Math.sin(this.stutterPhase * 4) * 0.5 + 0.5) * 1.1;
      default:
        return 1;
    }
  }

  update(dt: number, centerX: number): void {
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.wobbleTimer > 0) this.wobbleTimer -= dt;

    if (this.isStopped) return;

    if (this.delayRemaining > 0) {
      this.delayRemaining -= dt;
      return;
    }

    this.moveTime += dt;
    const step = dt * this.getSpeedMultiplier();
    this.x -= this.side * this.speed * step;

    if (
      (this.side === 1 && this.x <= centerX) ||
      (this.side === -1 && this.x >= centerX)
    ) {
      this.x = centerX;
      this.isStopped = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, layout: Layout, images: GameImages): void {
    const blockWidth = this.getWidth(layout);
    const { blockHeight } = layout;
    const left = this.x - blockWidth / 2;

    if (this.index === 0) {
      const stumpW = layout.blockWidth / SIZING.stumpWidthRatio;
      const aspect = spriteAspect(images.bambooStump, 1.2);
      const stumpH = stumpW * aspect;
      const stumpX = left - (stumpW - blockWidth) / 2;
      const stumpY = this.y - stumpH * SIZING.stumpLandingSurfaceRatio;
      drawSpriteTopLeft(ctx, images.bambooStump, stumpX, stumpY, stumpW);
      return;
    }

    const visualH = blockHeight * SIZING.bambooVisualHeightScale;
    const topY = this.y - visualH * SIZING.bambooLandingSurfaceRatio;

    if (this.delayRemaining > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(Date.now() * 0.01) * 0.15;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("...", this.x, topY + visualH * 0.5);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, topY + visualH);

    let sx = 1;
    let sy = 1;
    if (this.wobbleTimer > 0) {
      const t = this.wobbleTimer / TIMING.blockWobbleDuration;
      const wobble = Math.sin(t * Math.PI) * 0.08;
      sx = 1 + wobble;
      sy = 1 - wobble;
    }

    ctx.scale(sx, sy);
    ctx.drawImage(images.bambooPlatform, -blockWidth / 2, -visualH, blockWidth, visualH);

    if (this.flashTimer > 0) {
      ctx.globalAlpha = Math.max(0, this.flashTimer / TIMING.blockFlashDuration) * 0.8;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(images.bambooPlatform, -blockWidth / 2, -visualH, blockWidth, visualH);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (!this.isStopped && this.delayRemaining <= 0) {
      const arrowX = this.side === 1 ? left - 18 : left + blockWidth + 18;
      const arrowY = topY + visualH * 0.45;
      const speedHint = this.getSpeedMultiplier();
      ctx.save();
      ctx.fillStyle =
        speedHint > 1.2 ? "#ff8a65" : speedHint < 0.75 ? "#81d4fa" : "rgba(255,255,255,0.85)";
      ctx.beginPath();
      if (this.side === 1) {
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + 14, arrowY - 8);
        ctx.lineTo(arrowX + 14, arrowY + 8);
      } else {
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 14, arrowY - 8);
        ctx.lineTo(arrowX - 14, arrowY + 8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
