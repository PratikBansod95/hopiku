/** YouTube Playables SDK — injected by https://www.youtube.com/game_api/v1 */
declare const ytgame: {
  readonly IN_PLAYABLES_ENV: boolean;
  readonly SDK_VERSION: string;
  game: {
    firstFrameReady(): void;
    gameReady(): void;
    loadData(): Promise<string | null | undefined>;
    saveData(data: string): Promise<void>;
  };
  system: {
    isAudioEnabled(): boolean;
    onAudioEnabledChange(callback: (isAudioEnabled: boolean) => void): () => void;
    onPause(callback: () => void): () => void;
    onResume(callback: () => void): () => void;
    getLanguage(): Promise<string>;
  };
  engagement: {
    sendScore(score: { value: number }): Promise<void>;
  };
  health: {
    logError(): void;
    logWarning(): void;
  };
};
