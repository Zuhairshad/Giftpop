import { describe, expect, it } from "vitest";

import { addressLineText, digitsOnly, nameText, postalCodeText } from "./input-filters";

describe("input filters", () => {
  it("nameText keeps letters, spaces and . ' - and drops digits and symbols", () => {
    expect(nameText("Amna Bibi")).toBe("Amna Bibi");
    expect(nameText("Jo4hn_ O'Neil-Smith Jr.!")).toBe("John O'Neil-Smith Jr.");
    expect(nameText("Zoë Ångström")).toBe("Zoë Ångström");
    expect(nameText("أمنة")).toBe("أمنة");
    expect(nameText("12345")).toBe("");
  });

  it("digitsOnly keeps only 0-9", () => {
    expect(digitsOnly("0300-123 45x67")).toBe("03001234567");
    expect(digitsOnly("+44 7700")).toBe("447700");
    expect(digitsOnly("abc")).toBe("");
  });

  it("postalCodeText keeps letters, digits, space and hyphen", () => {
    expect(postalCodeText("SW1A 1AA")).toBe("SW1A 1AA");
    expect(postalCodeText("75-500!")).toBe("75-500");
    expect(postalCodeText("a_b#c")).toBe("abc");
  });

  it("addressLineText keeps letters, digits and common address punctuation", () => {
    expect(addressLineText("House 12-B, Street 4/5 #7.")).toBe("House 12-B, Street 4/5 #7.");
    expect(addressLineText("Flat <1> $%^*")).toBe("Flat 1 ");
  });
});
