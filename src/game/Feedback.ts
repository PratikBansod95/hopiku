import { SfxManager } from "../audio/SfxManager";
import {
  hapticDeath,
  hapticImpact,
  hapticJump,
  hapticLand,
  hapticPerfect,
} from "../utils/haptics";

export class Feedback {
  private readonly sfx = new SfxManager();

  constructor() {
    this.sfx.preload();
  }

  unlock(): void {
    this.sfx.unlock();
  }

  tap(): void {
    this.unlock();
    this.sfx.playTap();
  }

  jump(): void {
    this.unlock();
    this.sfx.playJump();
    hapticJump();
  }

  landGood(): void {
    this.sfx.playLand();
    hapticLand();
  }

  perfect(): void {
    this.sfx.playPerfect();
    hapticPerfect();
  }

  death(): void {
    this.sfx.playDeath();
    hapticDeath();
  }

  impact(): void {
    this.sfx.playImpact();
    hapticImpact();
  }

  setAudioEnabled(enabled: boolean): void {
    this.sfx.setEnabled(enabled);
  }
}
