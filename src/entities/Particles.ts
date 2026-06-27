import { COLORS, PHYSICS } from "@config/game.constants";

interface RingParticle {
  type: "ring";
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: string;
}

interface SquareParticle {
  type: "square";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
  rot: number;
}

interface SmokeParticle {
  type: "smoke";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

interface StarParticle {
  type: "star";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
  rot: number;
  rotSpeed: number;
}

type Particle = RingParticle | SquareParticle | SmokeParticle | StarParticle;

interface FloatingText {
  text: string;
  x: number;
  y: number;
  size: number;
  life: number;
  color: string;
  vy: number;
}

export class Particles {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  clear(): void {
    this.particles = [];
    this.floatingTexts = [];
  }

  spawnLandingBurst(
    x: number,
    y: number,
    color: string,
    perfect: boolean,
    blockWidth: number,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    this.particles.push({
      type: "ring",
      x,
      y,
      radius: blockWidth * 0.1,
      maxRadius: blockWidth * (perfect ? 1.8 : 1),
      life: 1,
      color,
    });

    const count = perfect ? 12 : 6;
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        type: "square",
        x: x + (Math.random() - 0.5) * blockWidth * 0.8,
        y,
        vx: (Math.random() - 0.5) * canvasWidth * 0.8,
        vy: -Math.random() * canvasHeight * 0.5 - canvasHeight * 0.1,
        size: Math.random() * 10 + 5,
        life: 1,
        color,
        rot: Math.random() * Math.PI,
      });
    }
  }

  spawnImpactBurst(x: number, y: number): void {
    for (let i = 0; i < 30; i += 1) {
      this.particles.push({
        type: "smoke",
        x: x + (Math.random() - 0.5) * 160,
        y: y + Math.random() * 40,
        vx: (Math.random() - 0.5) * 300,
        vy: -Math.random() * 400 - 150,
        size: Math.random() * 35 + 20,
        life: 1,
        color: COLORS.impactSmoke,
      });
    }

    for (let i = 0; i < 45; i += 1) {
      this.particles.push({
        type: "star",
        x: x + (Math.random() - 0.5) * 150,
        y: y + Math.random() * 20 - 20,
        vx: (Math.random() - 0.5) * 1000,
        vy: -Math.random() * 800 - 300,
        size: Math.random() * 20 + 10,
        life: 1,
        color: COLORS.impactStar,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 25,
      });
    }
  }

  spawnFloatingText(
    text: string,
    x: number,
    y: number,
    size: number,
    color: string,
  ): void {
    this.floatingTexts.push({ text, x, y, size, life: 1, color, vy: -150 });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= 1.5 * dt;

      if (p.type === "ring") {
        p.radius += (p.maxRadius - p.radius) * 10 * dt;
      } else if (p.type === "square" || p.type === "star") {
        p.vy += PHYSICS.gravity * PHYSICS.particleGravityScale * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.type === "square") p.rot += 5 * dt;
        else p.rot += p.rotSpeed * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i -= 1) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === "ring") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 6 * p.life;
        ctx.stroke();
      } else if (p.type === "square") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === "star") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i += 1) {
          const outer = (18 + i * 72) * (Math.PI / 180);
          const inner = (54 + i * 72) * (Math.PI / 180);
          ctx.lineTo(Math.cos(outer) * p.size, -Math.sin(outer) * p.size);
          ctx.lineTo(Math.cos(inner) * p.size * 0.5, -Math.sin(inner) * p.size * 0.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2 - p.life), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const t of this.floatingTexts) {
      ctx.font = `900 ${t.size}px Fredoka, sans-serif`;
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.lineJoin = "round";
      ctx.lineWidth = t.size * 0.3;
      ctx.strokeStyle = COLORS.floatingTextStroke;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.globalAlpha = 1;
  }
}
