import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startNotificationsWorker, shouldRunWorker, workerOffWarning } from "./worker";

const processOutbox = vi.hoisted(() => vi.fn<() => Promise<number>>());
vi.mock("./service", () => ({ processOutbox }));

beforeEach(() => {
  vi.useFakeTimers();
  processOutbox.mockReset();
  processOutbox.mockResolvedValue(0);
});
afterEach(() => vi.useRealTimers());

describe("workerOffWarning", () => {
  it("warns only in production with the worker off", () => {
    expect(workerOffWarning({ NODE_ENV: "production", NOTIFICATIONS_WORKER: "off" })).toMatch(
      /NOTIFICATIONS_WORKER is off/,
    );
    expect(workerOffWarning({ NODE_ENV: "production", NOTIFICATIONS_WORKER: "on" })).toBeNull();
    expect(workerOffWarning({ NODE_ENV: "development", NOTIFICATIONS_WORKER: "off" })).toBeNull();
  });
});

describe("shouldRunWorker", () => {
  it("is true only for on", () => {
    expect(shouldRunWorker("on")).toBe(true);
    expect(shouldRunWorker("off")).toBe(false);
    expect(shouldRunWorker(undefined)).toBe(false);
    expect(shouldRunWorker("ON")).toBe(false);
  });
});

describe("startNotificationsWorker", () => {
  it("runs on the interval and stops cleanly", async () => {
    const worker = startNotificationsWorker({ intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(3000);
    expect(processOutbox).toHaveBeenCalledTimes(3);
    worker.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(processOutbox).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never overlaps runs and survives a failing run", async () => {
    const errors: unknown[] = [];
    let release: () => void = () => undefined;
    processOutbox.mockImplementationOnce(
      () => new Promise<number>((resolve) => (release = () => resolve(0))),
    );
    const worker = startNotificationsWorker({ intervalMs: 1000, onError: (e) => errors.push(e) });
    await vi.advanceTimersByTimeAsync(3000);
    expect(processOutbox).toHaveBeenCalledTimes(1);

    processOutbox.mockRejectedValueOnce(new Error("db down"));
    release();
    await vi.advanceTimersByTimeAsync(1000);
    expect(errors).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(processOutbox.mock.calls.length).toBeGreaterThanOrEqual(3);
    worker.stop();
  });
});
