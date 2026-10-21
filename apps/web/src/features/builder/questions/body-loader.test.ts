import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const Colours: ComponentType = () => null;
const Review: ComponentType = () => null;

// Controllable loaders in place of the real dynamic imports.
const loaders = vi.hoisted(() => ({
  colours: vi.fn<() => Promise<ComponentType>>(),
  items: vi.fn<() => Promise<ComponentType>>(),
  layout: vi.fn<() => Promise<ComponentType>>(),
  personalise: vi.fn<() => Promise<ComponentType>>(),
  review: vi.fn<() => Promise<ComponentType>>(),
}));
vi.mock("./lazy-bodies", () => ({ LAZY_BODIES: loaders }));

async function freshLoader() {
  vi.resetModules();
  return import("./body-loader");
}

beforeEach(() => {
  for (const loader of Object.values(loaders)) loader.mockReset();
});

describe("question body loader", () => {
  it("has the first question's body at once, without loading anything", async () => {
    const { loadedBody } = await freshLoader();
    const { PackagingBody } = await import("./packaging");
    expect(loadedBody("packaging")).toBe(PackagingBody);
    // Generous: the first import of the packaging module is slow when the whole repo is busy.
  }, 30_000);

  it("loads a lazy body once and then returns it synchronously", async () => {
    loaders.review.mockResolvedValue(Review);
    const { loadBody, loadedBody } = await freshLoader();
    expect(loadedBody("review")).toBeNull();
    const [first, second] = await Promise.all([loadBody("review"), loadBody("review")]);
    expect(first).toBe(Review);
    expect(second).toBe(Review);
    expect(loaders.review).toHaveBeenCalledTimes(1);
    expect(loadedBody("review")).toBe(Review);
    await loadBody("review");
    expect(loaders.review).toHaveBeenCalledTimes(1);
  });

  it("forgets a failed load so the next attempt fetches again", async () => {
    loaders.colours.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(Colours);
    const { loadBody, loadedBody } = await freshLoader();
    await expect(loadBody("colours")).rejects.toThrow("offline");
    expect(loadedBody("colours")).toBeNull();
    await expect(loadBody("colours")).resolves.toBe(Colours);
    expect(loaders.colours).toHaveBeenCalledTimes(2);
  });

  it("preloads every lazy body and swallows failures", async () => {
    for (const loader of Object.values(loaders)) loader.mockResolvedValue(Colours);
    loaders.items.mockRejectedValue(new Error("offline"));
    const { preloadQuestionBodies, loadedBody } = await freshLoader();
    const { LAZY_QUESTION_IDS } = await import("./registry");
    preloadQuestionBodies(LAZY_QUESTION_IDS);
    await vi.waitFor(() => expect(loadedBody("review")).toBe(Colours));
    for (const loader of Object.values(loaders)) expect(loader).toHaveBeenCalledTimes(1);
    expect(loadedBody("items")).toBeNull();
  });
});
