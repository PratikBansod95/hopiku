type PauseHandler = () => void;
type AudioHandler = (enabled: boolean) => void;

function hasSdk(): boolean {
  return typeof ytgame !== "undefined";
}

export class PlayablesBridge {
  private firstFrameSent = false;
  private gameReadySent = false;
  private dataLoaded = false;

  isActive(): boolean {
    return hasSdk() && ytgame.IN_PLAYABLES_ENV;
  }

  init(handlers: {
    onPause: PauseHandler;
    onResume: PauseHandler;
    onAudioChange: AudioHandler;
  }): void {
    if (!hasSdk() || !this.isActive()) return;

    ytgame.system.onPause(handlers.onPause);
    ytgame.system.onResume(handlers.onResume);
    handlers.onAudioChange(ytgame.system.isAudioEnabled());
    ytgame.system.onAudioEnabledChange(handlers.onAudioChange);
  }

  firstFrameReady(): void {
    if (!hasSdk() || this.firstFrameSent) return;
    ytgame.game.firstFrameReady();
    this.firstFrameSent = true;
  }

  gameReady(): void {
    if (!hasSdk() || this.gameReadySent) return;
    if (!this.firstFrameSent) return;
    ytgame.game.gameReady();
    this.gameReadySent = true;
  }

  async loadData(): Promise<string | null> {
    if (!this.isActive()) return null;
    try {
      const data = await ytgame.game.loadData();
      this.dataLoaded = true;
      return data ?? null;
    } catch {
      this.dataLoaded = true;
      return null;
    }
  }

  async saveData(data: string): Promise<void> {
    if (!this.isActive() || !this.dataLoaded) return;
    try {
      await ytgame.game.saveData(data);
    } catch {
      // Best-effort cloud save.
    }
  }

  sendScore(value: number): void {
    if (!this.isActive() || value <= 0) return;
    void ytgame.engagement.sendScore({ value: Math.floor(value) }).catch(() => {
      // Best-effort score sync.
    });
  }
}

export const playables = new PlayablesBridge();
