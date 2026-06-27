export interface Biome {
  id: string;
  name: string;
  subtitle: string;
  unlockLogs: number;
  background: string;
  skyColor: string;
  perfectColor: string;
  goodColor: string;
  ambientKind: "leaves" | "mist" | "clouds" | "stars";
}

export const LOGS_PER_BIOME = 18;

export const BIOMES: Biome[] = [
  {
    id: "grove",
    name: "Bamboo Grove",
    subtitle: "The journey begins",
    unlockLogs: 0,
    background: "./assets/images/background.png",
    skyColor: "#6db88f",
    perfectColor: "#ffeb3b",
    goodColor: "#ffffff",
    ambientKind: "leaves",
  },
  {
    id: "mist",
    name: "Misty Peaks",
    subtitle: "Climbing through the fog",
    unlockLogs: 18,
    background: "./assets/images/background-mist.png",
    skyColor: "#7a9eb8",
    perfectColor: "#b3e5fc",
    goodColor: "#e3f2fd",
    ambientKind: "mist",
  },
  {
    id: "clouds",
    name: "Cloud Realm",
    subtitle: "Above the world",
    unlockLogs: 36,
    background: "./assets/images/background-clouds.png",
    skyColor: "#87b3d8",
    perfectColor: "#fff59d",
    goodColor: "#ffffff",
    ambientKind: "clouds",
  },
  {
    id: "summit",
    name: "Sacred Summit",
    subtitle: "Touch the sky",
    unlockLogs: 54,
    background: "./assets/images/background-summit.png",
    skyColor: "#c97b5a",
    perfectColor: "#ffab40",
    goodColor: "#ffe0b2",
    ambientKind: "stars",
  },
];

export function getBiomeIndexForLogs(logs: number): number {
  let index = 0;
  for (let i = BIOMES.length - 1; i >= 0; i -= 1) {
    if (logs >= BIOMES[i].unlockLogs) {
      index = i;
      break;
    }
  }
  return index;
}

export function getBiomeForLogs(logs: number): Biome {
  return BIOMES[getBiomeIndexForLogs(logs)];
}
