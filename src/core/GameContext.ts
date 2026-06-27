import { Platform } from "@entities/Platform";
import { Player } from "@entities/Player";
import { Particles } from "@entities/Particles";
import type { CameraShake, GameImages, GamePhase, Layout } from "@core/types";
import { Ambience } from "@world/Ambience";
import { MenuAmbience } from "@world/MenuAmbience";
import { BackgroundRenderer } from "@world/Background";
import { FeedbackService } from "@services/FeedbackService";
import { createDefaultRunSession, getEquippedSkinId } from "@services/ProgressionService";
import type { RunSessionStats } from "@core/types";
import { createDefaultSpawnMemory } from "@world/spawn/SpawnPlanner";
import type { SpawnMemory } from "@world/spawn/platformTypes";
import type { DomRefs } from "@ui/dom";
import { resizeCanvas } from "@core/CanvasResize";

export interface RuntimeState {
  layout: Layout;
  images: GameImages;
  dom: DomRefs;
  player: Player;
  particles: Particles;
  platforms: Platform[];
  cameraShake: CameraShake;
  gamePhase: GamePhase;
  score: number;
  combo: number;
  jumpBuffer: number;
  cameraY: number;
  targetCameraY: number;
  deathStateTimer: number;
  highScore: number;
  lastScore: number;
  background: BackgroundRenderer;
  ambience: Ambience;
  menuAmbience: MenuAmbience;
  logsClimbed: number;
  spawnMemory: SpawnMemory;
  feedback: FeedbackService;
  ytPaused: boolean;
  runSession: RunSessionStats;
  runCommitted: boolean;
  equippedSkinId: string;
  wardrobeOpen: boolean;
}

export function createRuntime(
  dom: DomRefs,
  images: GameImages,
  highScore: number,
  background: BackgroundRenderer,
): RuntimeState {
  const ctx = dom.canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D context");

  const layout = resizeCanvas(dom.canvas, ctx, images.panda, dom.uiLayer);
  const player = new Player();
  const particles = new Particles();
  const ambience = new Ambience();
  const menuAmbience = new MenuAmbience();

  return {
    layout,
    images,
    dom,
    player,
    particles,
    platforms: [],
    cameraShake: { x: 0, y: 0, time: 0, intensity: 0 },
    gamePhase: "START",
    score: 0,
    combo: 0,
    jumpBuffer: 0,
    cameraY: 0,
    targetCameraY: 0,
    deathStateTimer: 0,
    highScore,
    lastScore: 0,
    background,
    ambience,
    menuAmbience,
    logsClimbed: 0,
    spawnMemory: createDefaultSpawnMemory(),
    feedback: new FeedbackService(),
    ytPaused: false,
    runSession: createDefaultRunSession(),
    runCommitted: false,
    equippedSkinId: getEquippedSkinId(),
    wardrobeOpen: false,
  };
}
