/** Browser checks that decide whether the 3D scene may start. Pure of React; injectable for tests. */

interface CanvasLike {
  getContext(id: string): unknown;
}

interface DocumentLike {
  createElement(tag: "canvas"): CanvasLike;
}

interface LoseContext {
  loseContext(): void;
}

function isGl(value: unknown): value is { getExtension(name: string): unknown } {
  return typeof value === "object" && value !== null && "getExtension" in value;
}

/** True when a throwaway canvas gives a WebGL context. The context is released straight away. */
export function hasWebGL(doc: DocumentLike): boolean {
  try {
    const canvas = doc.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!isGl(gl)) return false;
    const lose = gl.getExtension("WEBGL_lose_context") as LoseContext | null;
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

interface IdleHost {
  requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (cb: () => void, ms: number) => number;
  clearTimeout: (handle: number) => void;
}

/** Runs `cb` when the browser is idle (or after `timeout` ms at the latest). Returns a cancel function. */
export function whenIdle(host: IdleHost, cb: () => void, timeout = 1200): () => void {
  if (host.requestIdleCallback) {
    const handle = host.requestIdleCallback(cb, { timeout });
    return () => host.cancelIdleCallback?.(handle);
  }
  const handle = host.setTimeout(cb, 200);
  return () => host.clearTimeout(handle);
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
