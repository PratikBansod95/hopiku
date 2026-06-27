import { GAME_TITLE, TAGLINE } from "@config/game.constants";

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
