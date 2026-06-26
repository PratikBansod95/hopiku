import {
  GAME_TITLE,
  PHYSICS,
  SCORING,
  SHAKE,
  SIZING,
  SPAWN,
  TAGLINE,
  TIMING,
} from "./constants";
import { Platform } from "./Platform";
import { Player } from "./Player";
import { Particles } from "./Particles";
import type { CameraShake, GameImages, GamePhase, Layout } from "./types";
import {
  getComboReward,
  hideGameOver,
  hideHud,
  hidePaused,
  resetScoreDisplay,
  showGameOver,
  showPaused,
  showPlaying,
  showStart,
  updateScore,
  updateZoneHud,
  type DomRefs,
} from "../ui/dom";
import { updateHighScore } from "../save/SaveManager";
import { drawSpriteCentered } from "../utils/assets";
import { Ambience } from "./Ambience";
import { MenuAmbience } from "./MenuAmbience";
import { BackgroundRenderer } from "./Background";
import { Feedback } from "./Feedback";
import { getBiomeForLogs, getBiomeIndexForLogs } from "./Biomes";
import { createDefaultSpawnMemory, planSpawn } from "./SpawnPlanner";
import type { SpawnMemory } from "./platformTypes";

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
  feedback: Feedback;
  ytPaused: boolean;
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  panda: HTMLImageElement,
): Layout {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return Player.computeLayout(w, h, panda);
}

function isVisible(y: number, blockHeight: number, cameraY: number, layout: Layout): boolean {
  // After ctx.translate(0, cameraY), screen Y = worldY + cameraY.
  const pad = blockHeight * 2;
  return (
    y + blockHeight > -cameraY - pad &&
    y < layout.canvasHeight - cameraY + pad
  );
}

function shake(cameraShake: CameraShake, intensity: number, duration: number): void {
  cameraShake.intensity = intensity;
  cameraShake.time = duration;
}

function updateShake(cameraShake: CameraShake, dt: number): void {
  if (cameraShake.time <= 0) {
    cameraShake.x = 0;
    cameraShake.y = 0;
    return;
  }
  cameraShake.time -= dt;
  cameraShake.x = (Math.random() - 0.5) * cameraShake.intensity;
  cameraShake.y = (Math.random() - 0.5) * cameraShake.intensity;
}

function isPerfectLanding(platform: Platform, layout: Layout): boolean {
  const tolerance = layout.blockWidth * platform.widthScale * PHYSICS.perfectTolerance;
  return Math.abs(platform.x - layout.centerX) <= tolerance;
}

function spawnNextPlatform(state: RuntimeState): void {
  const last = state.platforms[state.platforms.length - 1];
  const spawn = planSpawn(state.spawnMemory, state.score, state.layout, SPAWN.blockSpawnPadding);
  state.platforms.push(
    new Platform(
      state.platforms.length,
      last.y - state.layout.blockHeight,
      spawn,
      state.layout.centerX,
    ),
  );
}

export function createRuntime(
  dom: DomRefs,
  images: GameImages,
  highScore: number,
  background: BackgroundRenderer,
): RuntimeState {
  const ctx = dom.canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D context");

  const layout = resizeCanvas(dom.canvas, ctx, images.panda);
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
    feedback: new Feedback(),
    ytPaused: false,
  };
}

export function resetRound(state: RuntimeState): void {
  state.score = 0;
  state.combo = 0;
  state.jumpBuffer = 0;
  state.cameraY = 0;
  state.targetCameraY = 0;
  state.platforms = [];
  state.particles.clear();
  state.gamePhase = "START";
  state.deathStateTimer = 0;
  state.cameraShake = { x: 0, y: 0, time: 0, intensity: 0 };
  state.lastScore = 0;
  state.logsClimbed = 0;
  state.spawnMemory = createDefaultSpawnMemory();
  state.background.reset();
  state.ambience.clear();
  state.menuAmbience.seed(state.layout.canvasWidth, state.layout.canvasHeight);

  resetScoreDisplay(state.dom, 0);
  hideGameOver(state.dom);
  showStart(state.dom, state.highScore);
  updateZoneHud(state.dom, "Bamboo Grove", 0);

  state.player.reset(state.layout.centerX, state.layout.canvasHeight);
  state.platforms.push(
    new Platform(0, state.player.groundY, null, state.layout.centerX),
  );
}

export function startPlaying(state: RuntimeState): void {
  state.gamePhase = "PLAYING";
  state.menuAmbience.clear();
  showPlaying(state.dom, state.highScore);
  updateZoneHud(state.dom, state.background.getCurrentBiome().name, state.logsClimbed);
  spawnNextPlatform(state);
}

export function performJump(state: RuntimeState): void {
  state.feedback.jump();
  state.player.jump(state.layout.blockHeight, () => {
    state.jumpBuffer = 0;
  });
}

function handleDeath(state: RuntimeState, direction: number): void {
  if (state.gamePhase !== "PLAYING") return;
  state.gamePhase = "DYING_FALL";
  state.player.die(
    direction,
    state.layout.canvasWidth,
    state.layout.playerWidth,
    state.cameraY,
    state.layout.canvasHeight,
    state.layout.playerHeight,
  );
  shake(state.cameraShake, SHAKE.deathIntensity, SHAKE.deathDuration);
  state.deathStateTimer = TIMING.deathFallDuration;
  state.feedback.death();
}

function handleLanding(
  state: RuntimeState,
  platform: Platform,
  groundY: number,
  onJump: () => void,
): void {
  platform.isStopped = true;
  const biome = state.background.getCurrentBiome();
  const perfect = isPerfectLanding(platform, state.layout);

  if (perfect) {
    platform.x = state.layout.centerX;
    platform.wobbleTimer = TIMING.blockWobbleDuration;
    state.combo += 1;
    const reward = getComboReward(state.combo);
    state.score += reward.pointsAdded;

    const flashCount = Math.min(state.combo, state.platforms.length);
    for (let i = 0; i < flashCount; i += 1) {
      state.platforms[state.platforms.length - 1 - i].flashTimer =
        TIMING.blockFlashDuration;
    }

    const textDir = state.combo % 2 === 0 ? 1 : -1;
    const textX =
      state.layout.centerX +
      textDir * platform.getWidth(state.layout) * SCORING.perfectTextXRatio;

    state.particles.spawnFloatingText(
      "PERFECT",
      textX,
      groundY - state.layout.blockHeight - SCORING.perfectTextOffsetY,
      SCORING.perfectTextSize,
      biome.perfectColor,
    );
    state.particles.spawnFloatingText(
      reward.text,
      textX,
      groundY - state.layout.blockHeight + SCORING.perfectScoreOffsetY,
      reward.textSize,
      biome.perfectColor,
    );
    shake(state.cameraShake, SHAKE.perfectIntensity, SHAKE.perfectDuration);
    state.feedback.perfect();
  } else {
    state.combo = 0;
    state.score += SCORING.goodPoints;
    state.feedback.landGood();
    state.particles.spawnFloatingText(
      "GOOD",
      platform.x,
      groundY - state.layout.blockHeight,
      SCORING.goodTextSize,
      biome.goodColor,
    );
  }

  state.player.land(groundY, state.jumpBuffer > 0, state.layout.blockHeight, onJump);
  state.particles.spawnLandingBurst(
    state.player.x,
    groundY,
    perfect ? biome.perfectColor : biome.goodColor,
    perfect,
    state.layout.blockWidth,
    state.layout.canvasWidth,
    state.layout.canvasHeight,
  );

  updateScore(state.dom, state.score);
  state.targetCameraY += state.layout.blockHeight;
  state.logsClimbed += 1;
  updateZoneHud(state.dom, biome.name, state.logsClimbed);

  const nextBiomeIndex = getBiomeIndexForLogs(state.logsClimbed);
  if (state.background.setBiome(nextBiomeIndex)) {
    const nextBiome = getBiomeForLogs(state.logsClimbed);
    const bannerY = state.player.y - state.layout.blockHeight * 1.6;
    state.particles.spawnFloatingText(
      nextBiome.name.toUpperCase(),
      state.layout.centerX,
      bannerY,
      30,
      nextBiome.perfectColor,
    );
    state.particles.spawnFloatingText(
      nextBiome.subtitle,
      state.layout.centerX,
      bannerY + 36,
      17,
      nextBiome.goodColor,
    );
    updateZoneHud(state.dom, nextBiome.name, state.logsClimbed, true);
    shake(state.cameraShake, SHAKE.perfectIntensity * 1.5, SHAKE.perfectDuration * 2);
  }

  spawnNextPlatform(state);
}

function checkCollisions(state: RuntimeState, onJump: () => void): void {
  if (state.platforms.length < 2) return;

  const current = state.platforms[state.platforms.length - 1];
  const previous = state.platforms[state.platforms.length - 2];
  const { player, layout } = state;

  const hitLeft = player.x - layout.playerWidth * SIZING.playerHitboxWidthRatio;
  const hitRight = player.x + layout.playerWidth * SIZING.playerHitboxWidthRatio;
  const platWidth = current.getWidth(layout);
  const inset =
    current.index === 0 ? 0 : platWidth * SIZING.bambooLandingInsetRatio;
  const platLeft = current.x - platWidth / 2 + inset;
  const platRight = current.x + platWidth / 2 - inset;

  if (player.vy > 0) {
    const landingY = current.y;
    if (
      player.lastY <= landingY + 10 &&
      player.y >= landingY - 15 &&
      hitRight > platLeft &&
      hitLeft < platRight
    ) {
      handleLanding(state, current, landingY, onJump);
      return;
    }

    if (player.y >= previous.y && player.isJumping) {
      player.land(previous.y, state.jumpBuffer > 0, layout.blockHeight, onJump);
    }
  }

  if (
    !current.isStopped &&
    player.y > current.y + 10 &&
    player.y - layout.playerHeight * SIZING.playerHitboxHeightRatio <
      current.y + layout.blockHeight &&
    hitRight > platLeft + 5 &&
    hitLeft < platRight - 5
  ) {
    handleDeath(state, -current.side);
  }

  if (
    player.y >
    layout.canvasHeight - state.cameraY + layout.playerHeight * 2
  ) {
    handleDeath(state, Math.random() > 0.5 ? 1 : -1);
  }
}

export function updateGame(state: RuntimeState, dt: number, onJump: () => void): void {
  if (state.gamePhase === "PAUSED" || state.ytPaused) return;

  if (state.jumpBuffer > 0) state.jumpBuffer -= dt;

  const ctx = {
    gamePhase: state.gamePhase,
    gravity: PHYSICS.gravity,
  };

  if (state.gamePhase === "PLAYING") {
    state.player.update(dt, ctx);

    for (const platform of state.platforms) {
      platform.update(dt, state.layout.centerX);
    }

    checkCollisions(state, onJump);

    const cameraEase = 1 - Math.exp(-8 * dt);
    state.cameraY += (state.targetCameraY - state.cameraY) * cameraEase;
  } else if (state.gamePhase === "DYING_FALL") {
    for (let i = 0; i < state.platforms.length; i += 1) {
      const platform = state.platforms[i];
      const slow =
        i === state.platforms.length - 1 && !platform.isStopped ? 0.5 : 1;
      platform.update(dt * slow, state.layout.centerX);
    }

    state.player.update(dt, ctx);
    state.deathStateTimer -= dt;

    if (state.deathStateTimer <= 0) {
      state.gamePhase = "DYING_SMOKE";
      state.deathStateTimer = TIMING.deathSmokeDuration;
      shake(state.cameraShake, SHAKE.impactIntensity, SHAKE.impactDuration);
      const burstY = state.layout.canvasHeight - state.cameraY;
      state.particles.spawnImpactBurst(state.player.x, burstY);
      state.feedback.impact();
    }
  } else if (state.gamePhase === "DYING_SMOKE") {
    state.player.update(dt, ctx);
    state.deathStateTimer -= dt;

    if (state.deathStateTimer <= 0) {
      state.gamePhase = "DYING_TAUNT";
      state.deathStateTimer = TIMING.deathTauntDuration;
      hideHud(state.dom);
      const best = updateHighScore(state.score);
      state.highScore = Math.max(state.highScore, best, state.score);
      showGameOver(state.dom, state.score, state.highScore);
    }
  } else if (state.gamePhase === "DYING_TAUNT") {
    state.deathStateTimer -= dt;
    if (state.deathStateTimer <= 0) {
      state.gamePhase = "GAMEOVER";
      state.lastScore = state.score;
    }
  } else if (state.gamePhase === "START") {
    state.player.update(dt, ctx);
  }

  updateShake(state.cameraShake, dt);
  state.particles.update(dt);
  state.background.update(dt);

  if (state.gamePhase === "PLAYING") {
    state.ambience.update(
      dt,
      state.background.getCurrentBiome(),
      state.layout.canvasWidth,
      state.layout.canvasHeight,
      state.cameraY,
    );
  } else if (state.gamePhase === "START") {
    state.menuAmbience.update(dt, state.layout.canvasWidth, state.layout.canvasHeight);
  }
}

export function drawJumpTrail(state: RuntimeState, ctx: CanvasRenderingContext2D): void {
  if (!state.player.isJumping || state.player.isDead) return;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(state.player.x, state.player.y + 80);
  ctx.stroke();
  ctx.restore();
}

export function renderGame(state: RuntimeState): void {
  const canvas = state.dom.canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { layout, cameraY, cameraShake } = state;
  ctx.clearRect(0, 0, layout.canvasWidth, layout.canvasHeight);

  state.background.draw(ctx, layout.canvasWidth, layout.canvasHeight, cameraY);

  ctx.save();
  ctx.translate(cameraShake.x, cameraY + cameraShake.y);

  state.ambience.draw(ctx, cameraY);

  for (const platform of state.platforms) {
    if (isVisible(platform.y, layout.blockHeight, cameraY, layout)) {
      platform.draw(ctx, layout, state.images);
    }
  }

  drawJumpTrail(state, ctx);

  state.player.draw(
    ctx,
    layout,
    state.images.panda,
    state.gamePhase,
    state.platforms.map((p) => p.y),
  );

  if (state.gamePhase === "DYING_SMOKE" || state.gamePhase === "DYING_TAUNT" || state.gamePhase === "GAMEOVER") {
    const deadY = state.layout.canvasHeight - cameraY - layout.playerHeight * 0.3;
    drawSpriteCentered(
      ctx,
      state.images.pandaDead,
      state.player.x,
      deadY,
      layout.playerWidth * 0.9,
    );
  }

  state.particles.draw(ctx);
  ctx.restore();

  if (state.gamePhase === "START") {
    state.menuAmbience.draw(ctx, layout.canvasWidth, layout.canvasHeight);
  }
}

export function handleYoutubePause(state: RuntimeState): void {
  state.ytPaused = true;
  if (state.gamePhase === "PLAYING") {
    pauseGame(state);
  }
}

export function handleYoutubeResume(state: RuntimeState): void {
  state.ytPaused = false;
  if (state.gamePhase === "PAUSED") {
    resumeGame(state);
  }
}

export function handleTap(state: RuntimeState, onJump: () => void): void {
  state.feedback.tap();

  if (state.gamePhase === "GAMEOVER") {
    resetRound(state);
    return;
  }

  if (state.gamePhase === "START") {
    startPlaying(state);
    return;
  }

  if (state.gamePhase === "PLAYING") {
    if (state.player.isJumping) {
      if (state.player.vy > 0) {
        state.jumpBuffer = PHYSICS.inputBufferTime;
      }
    } else {
      onJump();
    }
  }
}

export function pauseGame(state: RuntimeState): void {
  if (state.gamePhase === "PLAYING") {
    state.gamePhase = "PAUSED";
    showPaused(state.dom);
  }
}

export function resumeGame(state: RuntimeState): void {
  if (state.gamePhase === "PAUSED") {
    state.gamePhase = "PLAYING";
    hidePaused(state.dom);
  }
}

export function goHome(state: RuntimeState): void {
  resetRound(state);
}

export function clampDelta(dt: number): number {
  return dt > TIMING.maxDeltaTime ? TIMING.fallbackDeltaTime : dt;
}

export function bindResize(state: RuntimeState): void {
  const canvas = state.dom.canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  window.addEventListener("resize", () => {
    state.layout = resizeCanvas(canvas, ctx, state.images.panda);
  });
}

export async function shareScore(score: number): Promise<void> {
  const text = `I scored ${score} in ${GAME_TITLE}! ${TAGLINE}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: GAME_TITLE, text });
      return;
    } catch {
      // User cancelled or share failed.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("Score copied to clipboard!");
  } catch {
    alert(text);
  }
}
