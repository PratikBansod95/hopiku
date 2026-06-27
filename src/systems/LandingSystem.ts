import { SCORING, SHAKE, TIMING } from "@config/game.constants";
import type { Platform } from "@entities/Platform";
import type { RuntimeState } from "@core/GameContext";
import { getComboReward, updateScore, updateZoneHud } from "@ui/dom";
import { getBiomeForLogs, getBiomeIndexForLogs } from "@world/Biomes";
import { shake } from "@systems/CameraShakeSystem";
import { isPerfectLanding, spawnNextPlatform } from "@systems/RoundSystem";

export function handleLanding(
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
