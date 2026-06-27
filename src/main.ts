import "./style.css";
import { TIMING } from "./game/constants";
import {
  bindResize,
  clampDelta,
  createRuntime,
  goHome,
  handleTap,
  handleYoutubePause,
  handleYoutubeResume,
  instantRestart,
  pauseGame,
  performJump,
  renderGame,
  resetRound,
  resumeGame,
  shareScore,
  updateGame,
} from "./game/Game";
import { getDomRefs, hideLoading, showLoading, syncSoundButton } from "./ui/dom";
import { loadGameAssets, applyUiSprites } from "./utils/assets";
import { flushSave, initSave } from "./save/SaveManager";
import { BackgroundRenderer } from "./game/Background";
import { playables } from "./youtube/PlayablesBridge";

function bindInput(
  canvas: HTMLCanvasElement,
  onTap: () => void,
): () => void {
  let lastTap = 0;

  const handler = (event: Event) => {
    const now = Date.now();
    if (now - lastTap < TIMING.inputDebounceMs) return;
    lastTap = now;
    if (event.cancelable) event.preventDefault();
    onTap();
  };

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", handler, { passive: false });
  canvas.addEventListener("touchstart", handler, { passive: false });

  return () => {
    canvas.removeEventListener("pointerdown", handler);
    canvas.removeEventListener("touchstart", handler);
  };
}

async function boot(): Promise<void> {
  const dom = getDomRefs();
  showLoading(dom);
  playables.firstFrameReady();

  const save = await initSave();
  if (save.highScore > 0) {
    playables.sendScore(save.highScore);
  }

  const background = new BackgroundRenderer();
  const [images] = await Promise.all([loadGameAssets(), background.load()]);
  applyUiSprites(images);
  const state = createRuntime(dom, images, save.highScore, background);

  playables.init({
    onPause: () => {
      handleYoutubePause(state);
      flushSave();
    },
    onResume: () => {
      handleYoutubeResume(state);
    },
    onAudioChange: (enabled) => {
      state.feedback.setAudioEnabled(enabled);
      syncSoundButton(dom, enabled);
    },
  });

  syncSoundButton(dom, state.feedback.isAudioEnabled());

  hideLoading(dom);
  resetRound(state);
  bindResize(state);
  playables.gameReady();

  const onJump = () => performJump(state);
  const onTap = () => handleTap(state, onJump);

  const unbindCanvas = bindInput(dom.canvas, onTap);

  dom.btnPause.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    pauseGame(state);
  });

  dom.btnResume.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    resumeGame(state);
  });

  dom.btnHomePause.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    goHome(state);
  });

  dom.btnHome.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    goHome(state);
  });

  dom.btnPlayAgain.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    instantRestart(state);
  });

  dom.btnSound.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    const enabled = !state.feedback.isAudioEnabled();
    state.feedback.setAudioEnabled(enabled);
    syncSoundButton(dom, enabled);
  });

  dom.btnShare.addEventListener("click", async (event) => {
    event.stopPropagation();
    state.feedback.tap();
    await shareScore(state.lastScore || state.score);
  });

  dom.btnSettings.addEventListener("click", (event) => {
    event.stopPropagation();
    state.feedback.tap();
    alert("Settings coming in a future update.");
  });

  let lastFrame = 0;

  const loop = (time: number) => {
    if (!state.ytPaused) {
      if (lastFrame > 0) {
        const dt = clampDelta((time - lastFrame) / 1000);
        updateGame(state, dt, onJump);
        renderGame(state);
      }
      lastFrame = time;
    }
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);

  window.addEventListener("beforeunload", unbindCanvas);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void boot();
  });
} else {
  void boot();
}
