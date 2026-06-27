import { createRuntime, type RuntimeState } from "@core/GameContext";
import { clampDelta } from "@core/GameLoop";
import { bindResize } from "@core/CanvasResize";
import { BackgroundRenderer } from "@world/Background";
import { loadGameAssets, applyUiSprites } from "@services/AssetService";
import { flushSave, initSave } from "@services/SaveService";
import { playables } from "@platform/youtube/PlayablesBridge";
import {
  getDomRefs,
  hideLoading,
  showLoading,
  syncSoundButton,
  type DomRefs,
} from "@ui/dom";
import { bindCanvasInput } from "@app/InputController";
import {
  goHome,
  instantRestart,
  performJump,
  resetRound,
} from "@systems/RoundSystem";
import {
  handleTap,
  handleYoutubePause,
  handleYoutubeResume,
  pauseGame,
  resumeGame,
} from "@systems/InputSystem";
import { updateGame } from "@systems/UpdateSystem";
import { renderGame } from "@systems/RenderSystem";
import { shareScore } from "@systems/ShareSystem";

function toggleSound(state: RuntimeState, dom: DomRefs): void {
  state.feedback.tap();
  const enabled = !state.feedback.isAudioEnabled();
  state.feedback.setAudioEnabled(enabled);
  syncSoundButton(dom, enabled);
}

export async function bootApplication(): Promise<void> {
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
  bindResize(dom.canvas, state.images.panda, dom.uiLayer, (layout) => {
    state.layout = layout;
  });
  playables.gameReady();

  const onJump = () => performJump(state);
  const onTap = () => handleTap(state, onJump);

  const unbindCanvas = bindCanvasInput(dom.canvas, onTap);

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
    toggleSound(state, dom);
  });

  dom.btnSoundHome.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSound(state, dom);
  });

  dom.btnShare.addEventListener("click", async (event) => {
    event.stopPropagation();
    state.feedback.tap();
    await shareScore(state.lastScore || state.score);
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
