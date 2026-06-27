export const ASSET_PATHS = {
  background: "./assets/images/background.png",
  panda: "./assets/images/panda.png",
  pandaDead: "./assets/images/panda-dead.png",
  bambooPlatform: "./assets/images/bamboo-platform.png",
  bambooStump: "./assets/images/bamboo-stump.png",
} as const;

export const SKIN_ASSET_PATHS = {
  default: {
    panda: ASSET_PATHS.panda,
    pandaDead: ASSET_PATHS.pandaDead,
  },
  ninja: {
    panda: "./assets/images/skins/panda-ninja.png",
    pandaDead: "./assets/images/skins/panda-dead-ninja.png",
  },
  cloud: {
    panda: "./assets/images/skins/panda-cloud.png",
    pandaDead: "./assets/images/skins/panda-dead-cloud.png",
  },
  summit: {
    panda: "./assets/images/skins/panda-summit.png",
    pandaDead: "./assets/images/skins/panda-dead-summit.png",
  },
  golden: {
    panda: "./assets/images/skins/panda-golden.png",
    pandaDead: "./assets/images/skins/panda-dead-golden.png",
  },
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
