export type GamePhase =
  | "LOADING"
  | "START"
  | "PLAYING"
  | "PAUSED"
  | "DYING_FALL"
  | "DYING_SMOKE"
  | "DYING_TAUNT"
  | "GAMEOVER";

export interface Layout {
  canvasWidth: number;
  canvasHeight: number;
  centerX: number;
  centerY: number;
  devicePixelRatio: number;
  blockWidth: number;
  blockHeight: number;
  playerWidth: number;
  playerHeight: number;
}

export interface CameraShake {
  x: number;
  y: number;
  time: number;
  intensity: number;
}

export interface GameImages {
  panda: HTMLImageElement;
  pandaDead: HTMLImageElement;
  bambooPlatform: HTMLImageElement;
  bambooStump: HTMLImageElement;
}

export interface SaveData {
  version: number;
  highScore: number;
}

export interface TauntTier {
  maxScore: number;
  title: string;
  sub: string;
}

export interface ComboTier {
  minCombo: number;
  maxCombo: number;
  points: number;
  labelSize: number;
}
