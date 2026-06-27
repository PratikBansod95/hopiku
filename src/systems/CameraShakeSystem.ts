import type { CameraShake } from "@core/types";

export function shake(cameraShake: CameraShake, intensity: number, duration: number): void {
  cameraShake.intensity = intensity;
  cameraShake.time = duration;
}

export function updateShake(cameraShake: CameraShake, dt: number): void {
  if (cameraShake.time <= 0) {
    cameraShake.x = 0;
    cameraShake.y = 0;
    return;
  }
  cameraShake.time -= dt;
  cameraShake.x = (Math.random() - 0.5) * cameraShake.intensity;
  cameraShake.y = (Math.random() - 0.5) * cameraShake.intensity;
}
