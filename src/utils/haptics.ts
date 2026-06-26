const HAPTIC = {
  jump: 10,
  land: 16,
  perfect: [14, 45, 18] as const,
  death: [28, 40, 55] as const,
  impact: [55, 90, 120] as const,
} as const;

function vibrate(pattern: number | readonly number[]): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern as number | number[]);
  } catch {
    // Blocked in some playable iframes or unsupported browsers.
  }
}

export function hapticJump(): void {
  vibrate(HAPTIC.jump);
}

export function hapticLand(): void {
  vibrate(HAPTIC.land);
}

export function hapticPerfect(): void {
  vibrate([...HAPTIC.perfect]);
}

export function hapticDeath(): void {
  vibrate([...HAPTIC.death]);
}

export function hapticImpact(): void {
  vibrate([...HAPTIC.impact]);
}
