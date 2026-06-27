import { SCORING, TAUNTS, TIMING } from "@config/game.constants";
import type { UnlockDefinition } from "@config/progression.constants";

export interface DomRefs {
  canvas: HTMLCanvasElement;
  uiLayer: HTMLElement;
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
  bestScore: HTMLElement;
  btnPause: HTMLButtonElement;
  btnResume: HTMLButtonElement;
  btnHomePause: HTMLButtonElement;
  btnHome: HTMLButtonElement;
  btnPlayAgain: HTMLButtonElement;
  btnSound: HTMLButtonElement;
  btnSoundHome: HTMLButtonElement;
  btnShare: HTMLButtonElement;
  btnWardrobe: HTMLButtonElement;
  btnWardrobeClose: HTMLButtonElement;
  wardrobeScreen: HTMLElement;
  skinGrid: HTMLElement;
  zoneBadge: HTMLElement;
  zoneName: HTMLElement;
  logsCount: HTMLElement;
  unlockBanner: HTMLElement;
}

export function getDomRefs(): DomRefs {
  const canvas = document.getElementById("gameCanvas");
  const uiLayer = document.getElementById("ui-layer");
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
  const bestScore = document.getElementById("best-score");
  const btnPause = document.getElementById("btn-pause");
  const btnResume = document.getElementById("btn-resume");
  const btnHomePause = document.getElementById("btn-home-pause");
  const btnHome = document.getElementById("btn-home");
  const btnPlayAgain = document.getElementById("btn-play-again");
  const btnSound = document.getElementById("btn-sound");
  const btnSoundHome = document.getElementById("btn-sound-home");
  const btnShare = document.getElementById("btn-share");
  const btnWardrobe = document.getElementById("btn-wardrobe");
  const btnWardrobeClose = document.getElementById("btn-wardrobe-close");
  const wardrobeScreen = document.getElementById("wardrobe-screen");
  const skinGrid = document.getElementById("skinGrid");
  const zoneBadge = document.getElementById("zoneBadge");
  const zoneName = document.getElementById("zoneName");
  const logsCount = document.getElementById("logsCount");
  const unlockBanner = document.getElementById("unlockBanner");

  if (
    !canvas ||
    !uiLayer ||
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
    !bestScore ||
    !btnPause ||
    !btnResume ||
    !btnHomePause ||
    !btnHome ||
    !btnPlayAgain ||
    !btnSound ||
    !btnSoundHome ||
    !btnShare ||
    !btnWardrobe ||
    !btnWardrobeClose ||
    !wardrobeScreen ||
    !skinGrid ||
    !zoneBadge ||
    !zoneName ||
    !logsCount ||
    !unlockBanner
  ) {
    throw new Error("Missing required DOM elements");
  }

  return {
    canvas: canvas as HTMLCanvasElement,
    uiLayer,
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
    bestScore,
    btnPause: btnPause as HTMLButtonElement,
    btnResume: btnResume as HTMLButtonElement,
    btnHomePause: btnHomePause as HTMLButtonElement,
    btnHome: btnHome as HTMLButtonElement,
    btnPlayAgain: btnPlayAgain as HTMLButtonElement,
    btnSound: btnSound as HTMLButtonElement,
    btnSoundHome: btnSoundHome as HTMLButtonElement,
    btnShare: btnShare as HTMLButtonElement,
    btnWardrobe: btnWardrobe as HTMLButtonElement,
    btnWardrobeClose: btnWardrobeClose as HTMLButtonElement,
    wardrobeScreen,
    skinGrid,
    zoneBadge,
    zoneName,
    logsCount,
    unlockBanner,
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

function formatTauntTitle(title: string): string {
  const space = title.indexOf(" ");
  if (space === -1) {
    return `<span class="go-title-a">${title}</span>`;
  }
  return `<span class="go-title-a">${title.slice(0, space)}</span><span class="go-title-b">${title.slice(space + 1)}</span>`;
}

export function showGameOver(
  dom: DomRefs,
  score: number,
  best: number,
  newUnlocks: UnlockDefinition[] = [],
): void {
  dom.gameOverScreen.classList.remove("hidden");
  dom.finalScore.textContent = String(score);
  const taunt = getTaunt(score);
  dom.tauntTitle.innerHTML = formatTauntTitle(taunt.title);
  dom.tauntSub.textContent = taunt.sub;

  if (newUnlocks.length > 0) {
    const names = newUnlocks.map((unlock) => unlock.name).join(", ");
    dom.unlockBanner.textContent = `Unlocked: ${names}!`;
    dom.unlockBanner.classList.remove("hidden");
  } else {
    dom.unlockBanner.textContent = "";
    dom.unlockBanner.classList.add("hidden");
  }

  dom.animBox.style.animation = "none";
  void dom.animBox.offsetHeight;
  dom.animBox.style.animation = "";

  if (best > 0) {
    const bestText = dom.bestScore.querySelector(".go-best-text");
    const label =
      score >= best && score > 0 ? `NEW BEST — ${best}` : `BEST — ${best}`;
    if (bestText) {
      bestText.textContent = label;
    } else {
      dom.bestScore.textContent = label;
    }
    dom.bestScore.classList.remove("hidden");
    dom.bestScore.classList.toggle("go-best-new", score >= best && score > 0);
  } else {
    dom.bestScore.textContent = "";
    dom.bestScore.classList.add("hidden");
    dom.bestScore.classList.remove("go-best-new");
  }
}

export function hideGameOver(dom: DomRefs): void {
  dom.gameOverScreen.classList.add("hidden");
  dom.unlockBanner.classList.add("hidden");
  dom.unlockBanner.textContent = "";
}

function syncSoundToggle(btn: HTMLButtonElement, enabled: boolean): void {
  btn.setAttribute("aria-pressed", String(enabled));
  btn.setAttribute("aria-label", enabled ? "Mute sound" : "Unmute sound");
  btn.querySelector(".sound-on")?.classList.toggle("hidden", !enabled);
  btn.querySelector(".sound-off")?.classList.toggle("hidden", enabled);
}

export function syncSoundButton(dom: DomRefs, enabled: boolean): void {
  syncSoundToggle(dom.btnSound, enabled);
  syncSoundToggle(dom.btnSoundHome, enabled);
}

export { getComboReward };
