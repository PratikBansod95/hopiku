/** Portrait play area — width / height (matches mobile Playables). */
export const GAME_ASPECT = 9 / 16;

/** Max logical width on large desktop monitors (keeps gameplay readable). */
export const MAX_GAME_WIDTH = 520;

export interface ViewportSize {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
}

export interface GameFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getViewportSize(): ViewportSize {
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
    offsetLeft: vv?.offsetLeft ?? 0,
    offsetTop: vv?.offsetTop ?? 0,
  };
}

/**
 * Fit a portrait game frame inside the visible viewport.
 * Phones: full bleed (uses entire screen). Desktop: centered portrait column.
 */
export function getGameFrame(viewport: ViewportSize = getViewportSize()): GameFrame {
  if (viewport.width <= MAX_GAME_WIDTH) {
    return {
      left: viewport.offsetLeft,
      top: viewport.offsetTop,
      width: Math.max(1, viewport.width),
      height: Math.max(1, viewport.height),
    };
  }

  let width = viewport.width;
  let height = width / GAME_ASPECT;

  if (height > viewport.height) {
    height = viewport.height;
    width = height * GAME_ASPECT;
  }

  if (width > MAX_GAME_WIDTH) {
    width = MAX_GAME_WIDTH;
    height = width / GAME_ASPECT;
  }

  if (height > viewport.height) {
    height = viewport.height;
    width = height * GAME_ASPECT;
  }

  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));

  return {
    left: viewport.offsetLeft + Math.round((viewport.width - width) / 2),
    top: viewport.offsetTop + Math.round((viewport.height - height) / 2),
    width,
    height,
  };
}

/** Pin canvas + UI to the adaptive portrait game frame. */
export function applyGameFrame(...elements: HTMLElement[]): void {
  const frame = getGameFrame();
  for (const el of elements) {
    el.style.position = "fixed";
    el.style.left = `${frame.left}px`;
    el.style.top = `${frame.top}px`;
    el.style.width = `${frame.width}px`;
    el.style.height = `${frame.height}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
  }
}

/** @deprecated Use applyGameFrame — kept for any external callers. */
export function applyViewportFrame(...elements: HTMLElement[]): void {
  applyGameFrame(...elements);
}

export function bindViewportResize(onResize: () => void): () => void {
  const handler = () => onResize();
  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
  window.visualViewport?.addEventListener("resize", handler);
  window.visualViewport?.addEventListener("scroll", handler);
  return () => {
    window.removeEventListener("resize", handler);
    window.removeEventListener("orientationchange", handler);
    window.visualViewport?.removeEventListener("resize", handler);
    window.visualViewport?.removeEventListener("scroll", handler);
  };
}
