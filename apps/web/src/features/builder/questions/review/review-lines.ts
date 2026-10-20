import type { CatalogResponse, DesignItem } from "@giftpop/contracts";

export interface ReviewLine {
  itemId: string;
  name: string;
  qty: number;
  /** Name the customer chose to put on the item, or null. */
  customName: string | null;
}

/** Item rows for the review list, in slot order, with names from the catalog. No prices. */
export function buildReviewLines(
  lines: readonly DesignItem[],
  catalog: Pick<CatalogResponse, "items">,
  itemNames: Readonly<Record<string, string>>,
): ReviewLine[] {
  const names = new Map(catalog.items.map((priced) => [priced.item.id, priced.item.name]));
  return [...lines]
    .sort((a, b) => a.slot - b.slot)
    .map((line) => ({
      itemId: line.itemId,
      name: names.get(line.itemId) ?? "Unknown item",
      qty: line.qty,
      customName: itemNames[line.itemId]?.trim() || null,
    }));
}

export interface PersonalisationSummaryRow {
  label: string;
  value: string;
}

/** Card, recipient and item names as label/value rows. Empty fields say "None" so nothing looks missing. */
export function buildPersonalisationRows(input: {
  cardMessage: string;
  customRequest?: string;
  recipientName: string;
  lines: readonly ReviewLine[];
}): PersonalisationSummaryRow[] {
  const named = input.lines.filter((line) => line.customName !== null);
  const request = input.customRequest?.trim() ?? "";
  return [
    { label: "Card message", value: input.cardMessage.trim() || "None" },
    { label: "Recipient", value: input.recipientName.trim() || "None" },
    {
      label: "Names on items",
      value:
        named.length > 0
          ? named.map((line) => `${line.name}: ${line.customName}`).join(", ")
          : "None",
    },
    ...(request === "" ? [] : [{ label: "Your request", value: request }]),
  ];
}
