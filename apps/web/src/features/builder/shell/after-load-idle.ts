/**
 * Runs `task` once the page has loaded and the browser is idle (or after a short pause where
 * `requestIdleCallback` does not exist). Returns a cancel function, for effect clean-up.
 */
export function afterLoadIdle(task: () => void, win: Window = window): () => void {
  let cancelIdle: (() => void) | null = null;
  const schedule = () => {
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(task, { timeout: 3000 });
      cancelIdle = () => win.cancelIdleCallback(id);
    } else {
      const id = win.setTimeout(task, 1200);
      cancelIdle = () => win.clearTimeout(id);
    }
  };
  if (win.document.readyState === "complete") {
    schedule();
    return () => cancelIdle?.();
  }
  win.addEventListener("load", schedule, { once: true });
  return () => {
    win.removeEventListener("load", schedule);
    cancelIdle?.();
  };
}
