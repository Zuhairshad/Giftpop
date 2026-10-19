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

interface LoadHost extends IdleHost {
  document: { readyState: string };
  addEventListener: (type: "load", listener: () => void, options?: { once: boolean }) => void;
  removeEventListener: (type: "load", listener: () => void) => void;
}

/**
 * Runs `cb` once the page has loaded, `delayMs` later, when the browser is idle. Returns a cancel
 * function that stops whichever stage is still pending.
 */
export function whenLoadedThenIdle(host: LoadHost, delayMs: number, cb: () => void): () => void {
  let timer: number | undefined;
  let cancelIdle: () => void = () => undefined;
  const start = () => {
    timer = host.setTimeout(() => {
      cancelIdle = whenIdle(host, cb);
    }, delayMs);
  };
  if (host.document.readyState === "complete") start();
  else host.addEventListener("load", start, { once: true });
  return () => {
    host.removeEventListener("load", start);
    if (timer !== undefined) host.clearTimeout(timer);
    cancelIdle();
  };
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
