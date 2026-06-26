type ToneShape = OscillatorType;

export class SfxManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private unlocked = false;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.ctx?.state === "running") {
      void this.ctx.suspend();
    } else if (enabled && this.ctx?.state === "suspended") {
      void this.ctx.resume();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  unlock(): void {
    if (typeof window === "undefined" || !this.enabled) return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    this.unlocked = true;
  }

  playJump(): void {
    this.playSweep(220, 520, 0.09, "sine", 0.22);
  }

  playLand(): void {
    this.playTone(140, 0.11, "triangle", 0.28, 0.004);
  }

  playPerfect(): void {
    this.playTone(660, 0.07, "sine", 0.2, 0);
    window.setTimeout(() => this.playTone(880, 0.09, "sine", 0.24, 0), 55);
  }

  playDeath(): void {
    this.playSweep(280, 90, 0.22, "sawtooth", 0.3);
  }

  playImpact(): void {
    this.playTone(72, 0.18, "sine", 0.42, 0.002);
    this.playNoiseBurst(0.12, 0.16);
  }

  playTap(): void {
    this.playTone(420, 0.04, "sine", 0.12, 0);
  }

  private playTone(
    frequency: number,
    duration: number,
    shape: ToneShape,
    volume: number,
    attack = 0.01,
  ): void {
    if (!this.enabled || !this.unlocked || !this.ctx || !this.master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = shape;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playSweep(
    from: number,
    to: number,
    duration: number,
    shape: ToneShape,
    volume: number,
  ): void {
    if (!this.enabled || !this.unlocked || !this.ctx || !this.master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = shape;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoiseBurst(duration: number, volume: number): void {
    if (!this.enabled || !this.unlocked || !this.ctx || !this.master) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;

    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + duration + 0.02);
  }
}
