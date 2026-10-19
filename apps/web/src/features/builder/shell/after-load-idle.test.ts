import { describe, expect, it, vi } from "vitest";

import { afterLoadIdle } from "./after-load-idle";

type Listener = () => void;

function fakeWindow(readyState: DocumentReadyState, idle: boolean) {
  const listeners = new Map<string, Listener>();
  const win = {
    document: { readyState },
    addEventListener: vi.fn((type: string, fn: Listener) => listeners.set(type, fn)),
    removeEventListener: vi.fn((type: string) => listeners.delete(type)),
    requestIdleCallback: idle ? vi.fn((fn: Listener) => (fn(), 7)) : undefined,
    cancelIdleCallback: vi.fn(),
    setTimeout: vi.fn((fn: Listener) => (fn(), 3)),
    clearTimeout: vi.fn(),
  };
  return { win, fire: (type: string) => listeners.get(type)?.() };
}

const asWindow = (value: unknown): Window => value as Window;

describe("afterLoadIdle", () => {
  it("waits for the load event before asking for idle time", () => {
    const { win, fire } = fakeWindow("interactive", true);
    const task = vi.fn();
    afterLoadIdle(task, asWindow(win));
    expect(task).not.toHaveBeenCalled();
    fire("load");
    expect(win.requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("schedules at once when the page has already loaded", () => {
    const { win } = fakeWindow("complete", true);
    const task = vi.fn();
    afterLoadIdle(task, asWindow(win));
    expect(win.addEventListener).not.toHaveBeenCalled();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("falls back to a timer where requestIdleCallback does not exist", () => {
    const { win } = fakeWindow("complete", false);
    const task = vi.fn();
    afterLoadIdle(task, asWindow(win));
    expect(win.setTimeout).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("cancel before load removes the listener and never runs the task", () => {
    const { win, fire } = fakeWindow("loading", true);
    const task = vi.fn();
    const cancel = afterLoadIdle(task, asWindow(win));
    cancel();
    expect(win.removeEventListener).toHaveBeenCalledWith("load", expect.any(Function));
    fire("load");
    expect(task).not.toHaveBeenCalled();
  });

  it("cancel after scheduling cancels the idle callback", () => {
    const { win } = fakeWindow("complete", true);
    win.requestIdleCallback = vi.fn(() => 9);
    const cancel = afterLoadIdle(vi.fn(), asWindow(win));
    cancel();
    expect(win.cancelIdleCallback).toHaveBeenCalledWith(9);
  });
});
