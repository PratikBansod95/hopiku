interface BambooLeaf {
  x: number;
  y: number;
  size: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  rot: number;
  alpha: number;
}

/** Sparse, slow menu atmosphere — calm over busy. */
export class MenuAmbience {
  private leaves: BambooLeaf[] = [];
  private time = 0;
  private width = 0;
  private height = 0;

  clear(): void {
    this.leaves = [];
    this.time = 0;
  }

  seed(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.leaves = [];
    this.time = 0;

    const leafCount = Math.min(5, Math.max(3, Math.round(width / 120)));
    for (let i = 0; i < leafCount; i += 1) {
      this.leaves.push(this.createLeaf(Math.random() * height * 1.1));
    }
  }

  update(dt: number, width: number, height: number): void {
    if (width !== this.width || height !== this.height) {
      this.seed(width, height);
    }

    this.time += dt;
    const t = this.time;

    for (const leaf of this.leaves) {
      leaf.y += leaf.speed * dt;
      leaf.x += Math.sin(t * leaf.swayFreq + leaf.phase) * leaf.swayAmp * dt;
      leaf.rot = Math.sin(t * 0.25 + leaf.phase) * 0.18;

      if (leaf.y > height + leaf.size * 2) {
        Object.assign(leaf, this.createLeaf(-leaf.size * 3));
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();

    const haze = ctx.createLinearGradient(0, 0, 0, height);
    haze.addColorStop(0, "rgba(232, 245, 233, 0.14)");
    haze.addColorStop(0.45, "rgba(0, 0, 0, 0)");
    haze.addColorStop(1, "rgba(0, 0, 0, 0.08)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    for (const leaf of this.leaves) {
      this.drawBambooLeaf(ctx, leaf);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private createLeaf(y: number): BambooLeaf {
    const w = this.width || 360;
    return {
      x: Math.random() * w,
      y,
      size: 14 + Math.random() * 10,
      speed: 5 + Math.random() * 7,
      swayAmp: 6 + Math.random() * 10,
      swayFreq: 0.25 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      rot: 0,
      alpha: 0.1 + Math.random() * 0.1,
    };
  }

  private drawBambooLeaf(ctx: CanvasRenderingContext2D, leaf: BambooLeaf): void {
    const { x, y, size, rot, alpha } = leaf;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(165, 214, 167, 0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.4, -size * 0.2, size * 0.28, size * 0.5, 0, size);
    ctx.bezierCurveTo(-size * 0.28, size * 0.5, -size * 0.4, -size * 0.2, 0, -size);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
