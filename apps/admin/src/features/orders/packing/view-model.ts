import type { AdminOrderDetail } from "@giftpop/contracts";

/** Common colour words. The design stores hex only, so we name the nearest one when it is close. */
const COLOUR_WORDS: ReadonlyArray<readonly [string, string]> = [
  ["#000000", "Black"],
  ["#ffffff", "White"],
  ["#808080", "Grey"],
  ["#c0c0c0", "Silver"],
  ["#ff0000", "Red"],
  ["#800000", "Maroon"],
  ["#ffa500", "Orange"],
  ["#ffff00", "Yellow"],
  ["#808000", "Olive"],
  ["#00ff00", "Lime"],
  ["#008000", "Green"],
  ["#00ffff", "Cyan"],
  ["#008080", "Teal"],
  ["#0000ff", "Blue"],
  ["#000080", "Navy"],
  ["#ff00ff", "Magenta"],
  ["#800080", "Purple"],
  ["#ffc0cb", "Pink"],
  ["#ff69b4", "Hot pink"],
  ["#a52a2a", "Brown"],
  ["#f5f5dc", "Beige"],
  ["#fffdd0", "Cream"],
  ["#d4af37", "Gold"],
  ["#e6e6fa", "Lavender"],
  ["#e6b8b7", "Blush"],
  ["#b87333", "Copper"],
];

/** Squared RGB distance below which a hex is named after the nearest word (about 50 per channel). */
const MAX_DISTANCE_SQ = 50 * 50 * 3;

function rgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) return null;
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The colour word for a hex ("Red"), or an empty string when nothing is close enough. */
export function colourWord(hex: string): string {
  const target = rgb(hex);
  if (!target) return "";
  let best = "";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [candidateHex, word] of COLOUR_WORDS) {
    const c = rgb(candidateHex);
    if (!c) continue;
    const d = (c[0] - target[0]) ** 2 + (c[1] - target[1]) ** 2 + (c[2] - target[2]) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = word;
    }
  }
  return bestDistance <= MAX_DISTANCE_SQ ? best : "";
}

/**
 * What to call a chosen colour: the packaging palette name saved on the order ("Blush"), or the
 * nearest colour word for older orders that do not carry one, or "" when neither fits.
 */
export function colourName(hex: string, savedName: string | undefined): string {
  return savedName ?? colourWord(hex);
}

export interface ChecklistLine {
  itemId: string;
  qty: number;
  name: string;
  /** The text to put on the item, when the customer named it. */
  customName: string | null;
}

/** One line per ordered item, in arrangement (slot) order, with the customer's name for it if any. */
export function buildChecklist(order: Pick<AdminOrderDetail, "items" | "design">): ChecklistLine[] {
  const slotOf = new Map(order.design.items.map((line) => [line.itemId, line.slot]));
  const names = order.design.personalisation.itemNames;
  return [...order.items]
    .sort(
      (a, b) =>
        (slotOf.get(a.itemId) ?? Number.MAX_SAFE_INTEGER) -
        (slotOf.get(b.itemId) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((item) => {
      const custom = (names[item.itemId] ?? "").trim();
      return {
        itemId: item.itemId,
        qty: item.qty,
        name: item.name,
        customName: custom === "" ? null : custom,
      };
    });
}

export function totalPieces(lines: readonly ChecklistLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Address label lines in reading order, skipping blanks. */
export function addressLines(
  order: Pick<AdminOrderDetail, "contact" | "address" | "country">,
): string[] {
  const { address, contact, country } = order;
  const cityLine = [address.city, address.region, address.postalCode]
    .map((part) => (part ?? "").trim())
    .filter((part) => part !== "")
    .join(", ");
  return [contact.name, address.line1, address.line2 ?? "", cityLine, country, contact.phone]
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** Whether the personalisation block has anything to show. */
export function hasPersonalisation(order: Pick<AdminOrderDetail, "design">): boolean {
  const p = order.design.personalisation;
  return p.recipientName.trim() !== "" || p.cardMessage.trim() !== "";
}

/** Notes for the packer, oldest first, with blanks removed. */
export function packerNotes(order: Pick<AdminOrderDetail, "notes">): string[] {
  return [...order.notes]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((note) => note.text.trim())
    .filter((text) => text !== "");
}

/** Sizes the checklist text down for long lists so a big bouquet still fits one page. */
export function checklistDensity(lineCount: number): "roomy" | "compact" | "tight" {
  if (lineCount <= 6) return "roomy";
  if (lineCount <= 12) return "compact";
  return "tight";
}
