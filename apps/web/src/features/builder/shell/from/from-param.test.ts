import { describe, expect, it } from "vitest";

import {
  describeFromError,
  readFromParam,
  unavailableItemNames,
  unavailableNotice,
} from "./from-param";

import { ID_BAR, ID_MUG, makeSharedView } from "@/features/share/shared-view.fixture";
import { ApiError } from "@/lib/api-errors";

describe("readFromParam", () => {
  it("reads no param", () => {
    expect(readFromParam(null)).toEqual({ kind: "none" });
  });

  it("reads a valid share id", () => {
    expect(readFromParam("abcdEFGH12")).toEqual({ kind: "share", shareId: "abcdEFGH12" });
  });

  it("flags a present but malformed param", () => {
    expect(readFromParam("")).toEqual({ kind: "invalid" });
    expect(readFromParam("short")).toEqual({ kind: "invalid" });
    expect(readFromParam("../../etc/passwd")).toEqual({ kind: "invalid" });
    expect(readFromParam("a".repeat(40))).toEqual({ kind: "invalid" });
  });
});

describe("unavailable items", () => {
  it("names unavailable items in slot order", () => {
    const view = makeSharedView({ unavailableItemIds: [ID_BAR, ID_MUG] });
    expect(unavailableItemNames(view)).toEqual(["Mug", "Chocolate"]);
  });

  it("has no names when everything is available", () => {
    expect(unavailableItemNames(makeSharedView())).toEqual([]);
    expect(unavailableNotice([])).toBeNull();
  });

  it("writes a plain notice", () => {
    expect(unavailableNotice(["Mug", "Chocolate"])).toBe(
      "Left out because they are no longer available: Mug, Chocolate.",
    );
  });
});

describe("describeFromError", () => {
  it("explains a missing gift", () => {
    const error = new ApiError(404, { code: "NOT_FOUND", message: "nope" });
    expect(describeFromError(error)).toMatch(/could not find that gift/);
  });

  it("falls back for anything else", () => {
    expect(describeFromError(new Error("boom"))).toMatch(/could not load/);
  });
});
