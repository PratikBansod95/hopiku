import { SfxManager } from "@services/SfxManager";
import {
  hapticDeath,
  hapticImpact,
  hapticJump,
  hapticLand,
  hapticPerfect,
} from "@utils/haptics";

export class FeedbackService {
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
    this.unlock();
    this.sfx.playLand();
    hapticLand();
  }

  perfect(): void {
    this.unlock();
    this.sfx.playPerfect();
    hapticPerfect();
  }

  death(): void {
    this.unlock();
    this.sfx.playDeath();
    hapticDeath();
  }

  impact(): void {
    this.unlock();
    this.sfx.playImpact();
    hapticImpact();
  }

  setAudioEnabled(enabled: boolean): void {
    this.sfx.setEnabled(enabled);
  }

  isAudioEnabled(): boolean {
    return this.sfx.isEnabled();
  }
}
