import { SCORING, TAUNTS, TIMING } from "../game/constants";

export interface DomRefs {
  canvas: HTMLCanvasElement;
  loadingScreen: HTMLElement;
  startScreen: HTMLElement;
  hud: HTMLElement;
  pauseScreen: HTMLElement;
  gameOverScreen: HTMLElement;
  scoreContainer: HTMLElement;
  scoreDisplay: HTMLElement;
  bestHud: HTMLElement;
  finalScore: HTMLElement;
  animBox: HTMLElement;
  tauntTitle: HTMLElement;
  tauntSub: HTMLElement;
  tauntRestart: HTMLElement;
  bestScore: HTMLElement;
  btnPause: HTMLButtonElement;
  btnResume: HTMLButtonElement;
  btnHomePause: HTMLButtonElement;
  btnHome: HTMLButtonElement;
  btnRestart: HTMLButtonElement;
  btnShare: HTMLButtonElement;
  btnSettings: HTMLButtonElement;
  zoneBadge: HTMLElement;
  zoneName: HTMLElement;
  logsCount: HTMLElement;
}

export function getDomRefs(): DomRefs {
  const canvas = document.getElementById("gameCanvas");
  const loadingScreen = document.getElementById("loading-screen");
  const startScreen = document.getElementById("startScreen");
  const hud = document.getElementById("hud");
  const pauseScreen = document.getElementById("pause-screen");
  const gameOverScreen = document.getElementById("game-over-screen");
  const scoreContainer = document.getElementById("scoreContainer");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const bestHud = document.getElementById("bestHud");
  const finalScore = document.getElementById("final-score");
  const animBox = document.getElementById("anim-box");
  const tauntTitle = document.getElementById("taunt-title");
  const tauntSub = document.getElementById("taunt-sub");
  const tauntRestart = document.getElementById("taunt-restart");
  const bestScore = document.getElementById("best-score");
  const btnPause = document.getElementById("btn-pause");
  const btnResume = document.getElementById("btn-resume");
  const btnHomePause = document.getElementById("btn-home-pause");
  const btnHome = document.getElementById("btn-home");
  const btnRestart = document.getElementById("btn-restart");
  const btnShare = document.getElementById("btn-share");
  const btnSettings = document.getElementById("btn-settings");
  const zoneBadge = document.getElementById("zoneBadge");
  const zoneName = document.getElementById("zoneName");
  const logsCount = document.getElementById("logsCount");

  if (
    !canvas ||
    !loadingScreen ||
    !startScreen ||
    !hud ||
    !pauseScreen ||
    !gameOverScreen ||
    !scoreContainer ||
    !scoreDisplay ||
    !bestHud ||
    !finalScore ||
    !animBox ||
    !tauntTitle ||
    !tauntSub ||
    !tauntRestart ||
    !bestScore ||
    !btnPause ||
    !btnResume ||
    !btnHomePause ||
    !btnHome ||
    !btnRestart ||
    !btnShare ||
    !btnSettings ||
    !zoneBadge ||
    !zoneName ||
    !logsCount
  ) {
    throw new Error("Missing required DOM elements");
  }

  return {
    canvas: canvas as HTMLCanvasElement,
    loadingScreen,
    startScreen,
    hud,
    pauseScreen,
    gameOverScreen,
    scoreContainer,
    scoreDisplay,
    bestHud,
    finalScore,
    animBox,
    tauntTitle,
    tauntSub,
    tauntRestart,
    bestScore,
    btnPause: btnPause as HTMLButtonElement,
    btnResume: btnResume as HTMLButtonElement,
    btnHomePause: btnHomePause as HTMLButtonElement,
    btnHome: btnHome as HTMLButtonElement,
    btnRestart: btnRestart as HTMLButtonElement,
    btnShare: btnShare as HTMLButtonElement,
    btnSettings: btnSettings as HTMLButtonElement,
    zoneBadge,
    zoneName,
    logsCount,
  };
}

function getComboReward(combo: number): {
  pointsAdded: number;
  text: string;
  textSize: number;
} {
  for (const tier of SCORING.comboTiers) {
    if (combo >= tier.minCombo && combo <= tier.maxCombo) {
      const suffix = tier.maxCombo === Infinity ? " MAX" : "";
      return {
        pointsAdded: tier.points,
        text: `+${tier.points}${suffix}`,
        textSize: tier.labelSize,
      };
    }
  }
  return {
    pointsAdded: SCORING.goodPoints,
    text: `+${SCORING.goodPoints}`,
    textSize: SCORING.goodTextSize,
  };
}

function getTaunt(score: number): { title: string; sub: string } {
  for (const tier of TAUNTS) {
    if (score <= tier.maxScore) return { title: tier.title, sub: tier.sub };
  }
  const last = TAUNTS[TAUNTS.length - 1];
  return { title: last.title, sub: last.sub };
}

export function showLoading(dom: DomRefs): void {
  dom.loadingScreen.classList.remove("hidden");
  dom.startScreen.classList.add("hidden");
  dom.hud.classList.add("hidden");
  dom.pauseScreen.classList.add("hidden");
  dom.gameOverScreen.classList.add("hidden");
}

export function hideLoading(dom: DomRefs): void {
  dom.loadingScreen.classList.add("hidden");
}

export function showStart(dom: DomRefs, highScore: number): void {
  dom.startScreen.classList.remove("hidden");
  dom.hud.classList.add("hidden");
  dom.pauseScreen.classList.add("hidden");
  dom.gameOverScreen.classList.add("hidden");
  dom.zoneBadge.classList.add("hidden");
  dom.bestHud.textContent = highScore > 0 ? `BEST ${highScore}` : "";
}

export function showPlaying(dom: DomRefs, highScore: number): void {
  dom.startScreen.classList.add("hidden");
  dom.loadingScreen.classList.add("hidden");
  dom.hud.classList.remove("hidden");
  dom.zoneBadge.classList.remove("hidden");
  dom.pauseScreen.classList.add("hidden");
  dom.bestHud.textContent = `BEST ${highScore}`;
}

export function updateZoneHud(
  dom: DomRefs,
  zoneName: string,
  logs: number,
  animate = false,
): void {
  dom.zoneName.textContent = zoneName;
  dom.logsCount.textContent = `${logs} log${logs === 1 ? "" : "s"}`;

  if (animate) {
    dom.zoneBadge.classList.remove("zone-pop");
    void dom.zoneBadge.offsetWidth;
    dom.zoneBadge.classList.add("zone-pop");
  }
}

export function showPaused(dom: DomRefs): void {
  dom.pauseScreen.classList.remove("hidden");
}

export function hidePaused(dom: DomRefs): void {
  dom.pauseScreen.classList.add("hidden");
}

export function hideHud(dom: DomRefs): void {
  dom.hud.classList.add("hidden");
}

export function updateScore(dom: DomRefs, score: number, pop = true): void {
  dom.scoreDisplay.textContent = String(score);
  if (pop) {
    dom.scoreDisplay.style.transform = "scale(1.2)";
    window.setTimeout(() => {
      dom.scoreDisplay.style.transform = "scale(1)";
    }, TIMING.scorePopDurationMs);
  }
}

export function resetScoreDisplay(dom: DomRefs, score: number): void {
  dom.scoreDisplay.textContent = String(score);
  dom.scoreDisplay.style.transform = "scale(1)";
}

export function showGameOver(dom: DomRefs, score: number, best: number): void {
  dom.gameOverScreen.classList.remove("hidden");
  dom.finalScore.textContent = String(score);
  const taunt = getTaunt(score);
  dom.tauntTitle.textContent = taunt.title;
  dom.tauntSub.textContent = taunt.sub;

  dom.animBox.style.animation = "none";
  void dom.animBox.offsetHeight;
  dom.animBox.style.animation = "";

  if (best > 0) {
    dom.bestScore.textContent =
      score >= best && score > 0 ? `NEW BEST — ${best}` : `BEST — ${best}`;
    dom.bestScore.classList.remove("hidden");
  } else {
    dom.bestScore.textContent = "";
    dom.bestScore.classList.add("hidden");
  }
}

export function hideGameOver(dom: DomRefs): void {
  dom.gameOverScreen.classList.add("hidden");
}

export { getComboReward };
