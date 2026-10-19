import { describe, expect, it, vi } from "vitest";

import { hasWebGL, whenIdle } from "./capabilities";

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
