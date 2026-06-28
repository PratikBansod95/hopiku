import { describe, expect, it, beforeEach } from "vitest";
import { Platform } from "@entities/Platform";
import type { RuntimeState } from "@core/GameContext";
import { createDefaultRunSession, commitRunFromState } from "@services/ProgressionService";
import { DEFAULT_SAVE, writeSave } from "@services/SaveService";
import { DEFAULT_LIFETIME_STATS } from "@config/progression.constants";
import {
  handleYoutubePause,
  handleYoutubeResume,
  pauseGame,
  resumeGame,
} from "@systems/InputSystem";
import { prunePlatformsBelowCamera } from "@systems/PlatformCleanup";
import { goHome } from "@systems/RoundSystem";
import { createDefaultSpawnMemory } from "@world/spawn/SpawnPlanner";
import { getSave } from "@services/SaveService";

function createMockState(overrides: Partial<RuntimeState> = {}): RuntimeState {
  const dom = {
    pauseScreen: { classList: { add: () => {}, remove: () => {} } },
    startScreen: { classList: { add: () => {}, remove: () => {} } },
    hud: { classList: { add: () => {}, remove: () => {} } },
    gameOverScreen: { classList: { add: () => {}, remove: () => {} } },
    zoneBadge: { classList: { add: () => {}, remove: () => {} } },
    zoneName: { textContent: "" },
    logsCount: { textContent: "" },
    scoreDisplay: { textContent: "", style: {} },
    bestHud: { textContent: "" },
    unlockBanner: { textContent: "", classList: { add: () => {}, remove: () => {} } },
    summitBadge: { textContent: "", classList: { add: () => {}, remove: () => {} } },
    wardrobeScreen: { classList: { add: () => {}, remove: () => {} } },
    skinGrid: { replaceChildren: () => {}, addEventListener: () => {} },
  };

  return {
    gamePhase: "PLAYING",
    ytPaused: false,
    pauseSource: "none",
    score: 12,
    logsClimbed: 5,
    runCommitted: false,
    runSession: createDefaultRunSession(),
    highScore: 0,
    dom: dom as unknown as RuntimeState["dom"],
    layout: {
      canvasWidth: 400,
      canvasHeight: 800,
      centerX: 200,
      centerY: 400,
      devicePixelRatio: 1,
      blockWidth: 120,
      blockHeight: 46,
      playerWidth: 80,
      playerHeight: 96,
    },
    platforms: [],
    cameraY: 0,
    ...overrides,
  } as RuntimeState;
}

describe("InputSystem pause handling", () => {
  it("tracks user pause separately from YouTube pause", () => {
    const state = createMockState();

    pauseGame(state);
    expect(state.pauseSource).toBe("user");
    expect(state.gamePhase).toBe("PAUSED");

    state.ytPaused = true;
    handleYoutubeResume(state);
    expect(state.gamePhase).toBe("PAUSED");

    state.ytPaused = false;
    resumeGame(state);
    expect(state.gamePhase).toBe("PLAYING");
    expect(state.pauseSource).toBe("none");
  });

  it("resumes only YouTube-initiated pauses on platform resume", () => {
    const state = createMockState();

    handleYoutubePause(state);
    expect(state.pauseSource).toBe("youtube");
    expect(state.ytPaused).toBe(true);

    handleYoutubeResume(state);
    expect(state.gamePhase).toBe("PLAYING");
    expect(state.pauseSource).toBe("none");
  });

  it("blocks manual resume while YouTube pause is active", () => {
    const state = createMockState({ gamePhase: "PAUSED", pauseSource: "youtube", ytPaused: true });

    resumeGame(state);
    expect(state.gamePhase).toBe("PAUSED");
  });
});

describe("PlatformCleanup", () => {
  it("prunes platforms far below the camera", () => {
    const platforms = [
      new Platform(0, 900, null, 200),
      new Platform(1, 700, null, 200),
      new Platform(2, 500, null, 200),
      new Platform(3, 300, null, 200),
    ];

    const state = createMockState({
      platforms,
      cameraY: 400,
    });

    prunePlatformsBelowCamera(state);
    expect(state.platforms.length).toBe(3);
    expect(state.platforms[0].index).toBe(1);
  });
});

describe("RoundSystem goHome", () => {
  beforeEach(() => {
    writeSave({ ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } });
  });

  it("commits in-progress runs before returning home", () => {
    const player = {
      reset: () => {},
    };
    const background = {
      reset: () => {},
    };
    const menuAmbience = {
      seed: () => {},
      clear: () => {},
    };
    const particles = {
      clear: () => {},
    };
    const ambience = {
      clear: () => {},
    };

    const state = createMockState({
      score: 18,
      logsClimbed: 7,
      runSession: { perfects: 4, goods: 3, peakCombo: 2 },
      player: player as unknown as RuntimeState["player"],
      background: background as unknown as RuntimeState["background"],
      menuAmbience: menuAmbience as unknown as RuntimeState["menuAmbience"],
      particles: particles as unknown as RuntimeState["particles"],
      ambience: ambience as unknown as RuntimeState["ambience"],
      spawnMemory: createDefaultSpawnMemory(),
      images: {} as RuntimeState["images"],
      feedback: { tap: () => {} } as unknown as RuntimeState["feedback"],
      equippedSkinId: "default",
      wardrobeOpen: false,
    });

    goHome(state);
    expect(getSave().stats.runsPlayed).toBe(1);
    expect(getSave().stats.totalLogs).toBe(7);
    expect(state.gamePhase).toBe("START");
  });

  it("does not commit empty runs from home", () => {
    const state = createMockState({ score: 0, logsClimbed: 0 });
    commitRunFromState(state);
    expect(getSave().stats.runsPlayed).toBe(0);
  });
});

describe("Death run commit", () => {
  beforeEach(() => {
    writeSave({ ...DEFAULT_SAVE, stats: { ...DEFAULT_LIFETIME_STATS } });
  });

  it("commits score and unlocks when finalizing after death animation", () => {
    const state = createMockState({
      gamePhase: "DYING_SMOKE",
      score: 45,
      logsClimbed: 20,
      runSession: { perfects: 15, goods: 5, peakCombo: 6 },
    });

    const unlocked = commitRunFromState(state);
    expect(state.runCommitted).toBe(true);
    expect(getSave().highScore).toBe(45);
    expect(getSave().unlocks.length).toBeGreaterThan(0);
    expect(unlocked.length).toBeGreaterThan(0);
  });
});
