import type { RuntimeState } from "@core/GameContext";

/** Keep at least this many platforms for collision / player shadow logic. */
const MIN_PLATFORMS = 3;

/** Remove platforms far below the visible area to cap per-frame work. */
export function prunePlatformsBelowCamera(state: RuntimeState): void {
  const { layout, cameraY, platforms } = state;
  const margin = layout.blockHeight * 6;
  const cutoff = layout.canvasHeight - cameraY + margin;

  while (platforms.length > MIN_PLATFORMS && platforms[0].y > cutoff) {
    platforms.shift();
  }
}
