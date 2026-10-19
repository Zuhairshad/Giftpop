import { describe, expect, it } from "vitest";

import { shouldValidateOnBlur } from "./blur-policy";

describe("shouldValidateOnBlur", () => {
  it("stays quiet for a field that was only tabbed through", () => {
    expect(shouldValidateOnBlur(false, false)).toBe(false);
  });

  it("validates a field the visitor edited", () => {
    expect(shouldValidateOnBlur(true, false)).toBe(true);
  });

  it("validates everything once a submit has been tried", () => {
    expect(shouldValidateOnBlur(false, true)).toBe(true);
  });
});
