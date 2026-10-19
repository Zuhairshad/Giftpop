import type { DesignProblem, Packaging } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { checkoutRedirect } from "./checkout-redirect";
import type { QuestionGuardInput } from "./question-guard";
import { BOUQUET_ID, makeCatalog } from "./test-fixtures";

function bouquet(): Packaging {
  const found = makeCatalog().packagings.find((p) => p.packaging.id === BOUQUET_ID);
  if (!found) throw new Error("fixture missing");
  return found.packaging;
}

const problem: DesignProblem = { code: "OVER_CAPACITY", message: "Too many" };
const ready: QuestionGuardInput = { packaging: bouquet(), itemCount: 2, problems: [] };

describe("checkoutRedirect", () => {
  it("keeps a gift that can be ordered on checkout", () => {
    expect(checkoutRedirect("PK", ready)).toBeNull();
  });

  it("sends a visitor with no packaging to the builder of their country", () => {
    expect(checkoutRedirect("PK", { packaging: null, itemCount: 0, problems: [] })).toBe(
      "/pk/build",
    );
  });

  it("sends a visitor with too few items to the builder", () => {
    expect(checkoutRedirect("GB", { ...ready, itemCount: 1 })).toBe("/gb/build");
  });

  it("sends a visitor whose design has problems to the builder", () => {
    expect(checkoutRedirect("PK", { ...ready, problems: [problem] })).toBe("/pk/build");
  });

  it("never points at an old step URL", () => {
    const href = checkoutRedirect("PK", { packaging: null, itemCount: 0, problems: [] });
    expect(href).not.toMatch(/\/build\//);
  });
});
