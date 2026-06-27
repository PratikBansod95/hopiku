import type { Biome } from "./Biomes";

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  kind: Biome["ambientKind"];
  rot: number;
}

export class Ambience {
  private particles: AmbientParticle[] = [];
  private spawnTimer = 0;

  clear(): void {
    this.particles = [];
    this.spawnTimer = 0;
  }

  update(dt: number, biome: Biome, width: number, height: number, cameraY: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = biome.ambientKind === "stars" ? 0.35 : 0.55;
      this.spawnOne(biome, width, height, cameraY);
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += dt * 0.6;

      if (p.kind === "mist") {
        p.alpha = Math.min(0.45, p.life / p.maxLife);
        p.size += dt * 8;
      } else if (p.kind === "clouds") {
        p.alpha = 0.25 + 0.2 * (p.life / p.maxLife);
      } else if (p.kind === "stars") {
        p.alpha = 0.35 + 0.45 * Math.sin(p.life * 5);
      } else {
        p.alpha = 0.55 * (p.life / p.maxLife);
        p.vy += 20 * dt;
      }

      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private spawnOne(biome: Biome, width: number, height: number, cameraY: number): void {
    const screenY = Math.random() * height;
    const worldY = screenY - cameraY;

    switch (biome.ambientKind) {
      case "leaves":
        this.particles.push({
          x: Math.random() * width,
          y: worldY,
          vx: (Math.random() - 0.5) * 30,
          vy: 15 + Math.random() * 25,
          size: 4 + Math.random() * 6,
          life: 2.5 + Math.random() * 2,
          maxLife: 4,
          alpha: 0.6,
          kind: "leaves",
          rot: Math.random() * Math.PI,
        });
        break;
      case "mist":
        this.particles.push({
          x: Math.random() * width,
          y: worldY,
          vx: (Math.random() - 0.5) * 15,
          vy: -8 - Math.random() * 12,
          size: 20 + Math.random() * 30,
          life: 3 + Math.random() * 2,
          maxLife: 5,
          alpha: 0.3,
          kind: "mist",
          rot: 0,
        });
        break;
      case "clouds":
        this.particles.push({
          x: -40,
          y: worldY,
          vx: 25 + Math.random() * 35,
          vy: (Math.random() - 0.5) * 8,
          size: 18 + Math.random() * 28,
          life: 4 + Math.random() * 3,
          maxLife: 7,
          alpha: 0.35,
          kind: "clouds",
          rot: 0,
        });
        break;
      case "stars":
        this.particles.push({
          x: Math.random() * width,
          y: worldY,
          vx: 0,
          vy: 0,
          size: 2 + Math.random() * 3,
          life: 2 + Math.random() * 3,
          maxLife: 5,
          alpha: 0.7,
          kind: "stars",
          rot: 0,
        });
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    ctx.save();
    ctx.translate(0, cameraY);

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.kind === "leaves") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = "#81c784";
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.kind === "mist" || p.kind === "clouds") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#fff9c4";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
