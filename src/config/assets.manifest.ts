export const ASSET_PATHS = {
  background: "./assets/images/background.png",
  panda: "./assets/images/panda.png",
  pandaDead: "./assets/images/panda-dead.png",
  bambooPlatform: "./assets/images/bamboo-platform.png",
  bambooStump: "./assets/images/bamboo-stump.png",
} as const;

const audioBase = `${import.meta.env.BASE_URL}assets/audio`;

export const SFX_PATHS = {
  tap: `${audioBase}/tap.wav`,
  jump: `${audioBase}/jump.wav`,
  land: `${audioBase}/land.wav`,
  perfect: `${audioBase}/perfect.wav`,
  death: `${audioBase}/death.wav`,
  impact: `${audioBase}/impact.wav`,
} as const;
