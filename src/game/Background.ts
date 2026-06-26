import { BIOMES, type Biome } from "./Biomes";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load background: ${src}`));
    img.src = src;
  });
}

export class BackgroundRenderer {
  private images: HTMLImageElement[] = [];
  private currentIndex = 0;
  private previousIndex = 0;
  private blend = 1;
  private transitioning = false;
  private readonly blendDuration = 1.8;

  async load(): Promise<void> {
    this.images = await Promise.all(BIOMES.map((b) => loadImage(b.background)));
  }

  reset(): void {
    this.currentIndex = 0;
    this.previousIndex = 0;
    this.blend = 1;
    this.transitioning = false;
    document.body.style.backgroundColor = BIOMES[0].skyColor;
  }

  setBiome(index: number): boolean {
    if (index === this.currentIndex) return false;
    this.previousIndex = this.currentIndex;
    this.currentIndex = index;
    this.blend = 0;
    this.transitioning = true;
    document.body.style.backgroundColor = BIOMES[index].skyColor;
    return true;
  }

  update(dt: number): void {
    if (!this.transitioning) return;
    this.blend = Math.min(1, this.blend + dt / this.blendDuration);
    if (this.blend >= 1) this.transitioning = false;
  }

  getCurrentBiome(): Biome {
    return BIOMES[this.currentIndex];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraY: number,
  ): void {
    const parallax = cameraY * 0.12;

    const drawBg = (img: HTMLImageElement, alpha: number) => {
      if (!img.complete || alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;

      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const offsetY = -parallax % (drawH * 0.25);

      ctx.drawImage(img, (width - drawW) / 2, offsetY, drawW, drawH);
      ctx.restore();
    };

    if (this.transitioning && this.blend < 1) {
      drawBg(this.images[this.previousIndex], 1 - this.blend);
      drawBg(this.images[this.currentIndex], this.blend);
    } else {
      drawBg(this.images[this.currentIndex], 1);
    }

    ctx.globalAlpha = 1;
  }
}
