import { GAME_TITLE, TAGLINE } from "@config/game.constants";

let toastElement: HTMLElement | null = null;
let toastTimer = 0;

export function bindShareToast(element: HTMLElement): void {
  toastElement = element;
}

function showToast(message: string): void {
  if (!toastElement) return;

  toastElement.textContent = message;
  toastElement.classList.remove("hidden");

  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastElement?.classList.add("hidden");
    toastTimer = 0;
  }, 2800);
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
    showToast("Score copied to clipboard!");
  } catch {
    showToast(text);
  }
}
