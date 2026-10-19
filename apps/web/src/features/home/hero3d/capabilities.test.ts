import { describe, expect, it, vi } from "vitest";

import { hasWebGL, whenIdle, whenLoadedThenIdle } from "./capabilities";

describe("hasWebGL", () => {
  it("is true when a context exists and releases it", () => {
    const loseContext = vi.fn();
    const gl = { getExtension: () => ({ loseContext }) };
    const doc = {
      createElement: () => ({ getContext: (id: string) => (id === "webgl2" ? gl : null) }),
    };
    expect(hasWebGL(doc)).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it("falls back to webgl1", () => {
    const gl = { getExtension: () => null };
    const doc = {
      createElement: () => ({ getContext: (id: string) => (id === "webgl" ? gl : null) }),
    };
    expect(hasWebGL(doc)).toBe(true);
  });

  it("is false without a context or when the browser throws", () => {
    expect(hasWebGL({ createElement: () => ({ getContext: () => null }) })).toBe(false);
    expect(
      hasWebGL({
        createElement: () => ({
          getContext: () => {
            throw new Error("blocked");
          },
        }),
      }),
    ).toBe(false);
  });
});

describe("whenIdle", () => {
  it("uses requestIdleCallback with a timeout and can cancel", () => {
    const request = vi.fn(() => 7);
    const cancel = vi.fn();
    const stop = whenIdle(
      {
        requestIdleCallback: request,
        cancelIdleCallback: cancel,
        setTimeout: vi.fn(),
        clearTimeout: vi.fn(),
      },
      () => undefined,
      900,
    );
    expect(request).toHaveBeenCalledWith(expect.any(Function), { timeout: 900 });
    stop();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it("falls back to a timer when requestIdleCallback is missing", () => {
    const set = vi.fn(() => 3);
    const clear = vi.fn();
    const stop = whenIdle({ setTimeout: set, clearTimeout: clear }, () => undefined);
    expect(set).toHaveBeenCalled();
    stop();
    expect(clear).toHaveBeenCalledWith(3);
  });
});

describe("whenLoadedThenIdle", () => {
  function host(readyState: string) {
    const listeners: (() => void)[] = [];
    const timers = new Map<number, () => void>();
    let next = 1;
    const fake = {
      document: { readyState },
      addEventListener: (_type: "load", listener: () => void) => void listeners.push(listener),
      removeEventListener: (_type: "load", listener: () => void) => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      },
      setTimeout: (cb: () => void) => {
        timers.set(next, cb);
        return next++;
      },
      clearTimeout: (handle: number) => void timers.delete(handle),
    };
    return {
      fake,
      fireLoad: () => [...listeners].forEach((listener) => listener()),
      runTimers: () => [...timers.values()].forEach((cb) => cb()),
      pendingTimers: () => timers.size,
      listenerCount: () => listeners.length,
    };
  }

  it("waits for the load event, then the delay, then runs", () => {
    const h = host("loading");
    const cb = vi.fn();
    whenLoadedThenIdle(h.fake, 2500, cb);
    expect(h.pendingTimers()).toBe(0);
    h.fireLoad();
    expect(h.pendingTimers()).toBe(1);
    expect(cb).not.toHaveBeenCalled();
    h.runTimers(); // the delay passes; the idle stage has no requestIdleCallback, so it uses a timer
    h.runTimers();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("starts the delay straight away when the page has already loaded", () => {
    const h = host("complete");
    whenLoadedThenIdle(h.fake, 2500, vi.fn());
    expect(h.pendingTimers()).toBe(1);
    expect(h.listenerCount()).toBe(0);
  });

  it("cancels both stages", () => {
    const h = host("loading");
    const cb = vi.fn();
    const cancel = whenLoadedThenIdle(h.fake, 2500, cb);
    cancel();
    expect(h.listenerCount()).toBe(0);
    h.fireLoad();
    h.runTimers();
    expect(cb).not.toHaveBeenCalled();

    const loaded = host("complete");
    const cancelLoaded = whenLoadedThenIdle(loaded.fake, 2500, cb);
    cancelLoaded();
    loaded.runTimers();
    expect(cb).not.toHaveBeenCalled();
  });
});
