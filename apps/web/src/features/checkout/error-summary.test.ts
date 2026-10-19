import { describe, expect, it } from "vitest";

import { errorSummaryEntries, summaryHeading } from "./error-summary-model";

const LABELS = { name: "Full name", email: "Email", phone: "Phone", region: "Province" };

describe("errorSummaryEntries", () => {
  it("lists errors in the order the form shows them, with the field's label and a link", () => {
    const entries = errorSummaryEntries(
      { region: "Enter the province", name: "Enter your name", email: "Enter a valid email" },
      LABELS,
    );
    expect(entries).toEqual([
      { field: "name", label: "Full name", message: "Enter your name", href: "#checkout-name" },
      { field: "email", label: "Email", message: "Enter a valid email", href: "#checkout-email" },
      {
        field: "region",
        label: "Province",
        message: "Enter the province",
        href: "#checkout-region",
      },
    ]);
  });

  it("is empty when nothing is wrong", () => {
    expect(errorSummaryEntries({}, LABELS)).toEqual([]);
  });

  it("still lists a field whose label is unknown, by its message", () => {
    expect(errorSummaryEntries({ city: "Enter the city" }, LABELS)).toEqual([
      { field: "city", label: null, message: "Enter the city", href: "#checkout-city" },
    ]);
  });
});

describe("summaryHeading", () => {
  it("counts the fields in plain words", () => {
    expect(summaryHeading(1)).toBe("1 field needs attention");
    expect(summaryHeading(6)).toBe("6 fields need attention");
  });
});
