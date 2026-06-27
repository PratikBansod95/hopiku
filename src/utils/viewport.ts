export interface ViewportSize {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
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

/** Pin full-screen layers to the visible viewport (mobile browser chrome, rotation). */
export function applyViewportFrame(...elements: HTMLElement[]): void {
  const { width, height, offsetLeft, offsetTop } = getViewportSize();
  for (const el of elements) {
    el.style.position = "fixed";
    el.style.left = `${offsetLeft}px`;
    el.style.top = `${offsetTop}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
  }
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
