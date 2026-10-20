import { snapshotsToSceneDocs } from "@giftpop/contracts";
import type {
  AdminOrderDetail,
  Design,
  Item,
  ItemSnapshot,
  Packaging,
  PaymentRecordKind,
} from "@giftpop/contracts";

import { ORDER_STATUS_LABELS } from "../status";

/** Pure display logic for the order detail page. Nothing here prices anything: it only adds what is stored. */

export interface PaymentTotals {
  currency: string;
  totalMinor: number;
  dueNowMinor: number;
  /** Sum of non-refund payment records in the order's currency. */
  receivedMinor: number;
  /** Total minus received. Negative when staff recorded more than the total. */
  balanceMinor: number;
}

export function paymentTotals(order: AdminOrderDetail): PaymentTotals {
  const { currency, totalMinor, dueNowMinor } = order.quote;
  let receivedMinor = 0;
  for (const payment of order.payments) {
    if (payment.kind === "refund" || payment.amount.currency !== currency) continue;
    receivedMinor += payment.amount.amountMinor;
  }
  return {
    currency,
    totalMinor,
    dueNowMinor,
    receivedMinor,
    balanceMinor: totalMinor - receivedMinor,
  };
}

export const PAYMENT_KIND_LABELS: Readonly<Record<PaymentRecordKind, string>> = {
  advance: "Advance",
  full: "Full payment",
  balance: "Balance",
  refund: "Refund",
};

export const PAYMENT_METHOD_LABELS = {
  manual_transfer: "Bank transfer",
  cod: "Cash on delivery",
  card: "Card",
} as const;

export const PAYMENT_MODE_LABELS = {
  prepaid: "Prepaid in full",
  cod: "Advance now, rest on delivery",
} as const;

const FORMER_STAFF = "Former staff member";

/** Who did it: a name, "Customer" for the order's first entry, or "System" for other automatic changes. */
export function actorLabel(
  actorId: string | null,
  actorName: string | null,
  from: string | null = null,
): string {
  if (actorId === null) return from === null ? "Customer" : "System";
  return actorName !== null && actorName.trim() !== "" ? actorName : FORMER_STAFF;
}

export interface TimelineRow {
  key: string;
  fromLabel: string | null;
  toLabel: string;
  at: string;
  actor: string;
  note: string | null;
}

/** Oldest first, as stored. */
export function timelineRows(order: AdminOrderDetail): TimelineRow[] {
  return order.history.map((entry, index) => ({
    key: `${index}-${entry.at}`,
    fromLabel: entry.from === null ? null : ORDER_STATUS_LABELS[entry.from],
    toLabel: ORDER_STATUS_LABELS[entry.to],
    at: entry.at,
    actor: actorLabel(entry.actorId, entry.actorName, entry.from),
    note: entry.note !== undefined && entry.note.trim() !== "" ? entry.note : null,
  }));
}

export interface NoteRow {
  id: string;
  text: string;
  author: string;
  at: string;
}

/** Newest first. */
export function noteRows(order: AdminOrderDetail): NoteRow[] {
  return order.notes
    .map((note) => ({
      id: note.id,
      text: note.text,
      author: actorLabel(note.actorId, note.actorName),
      at: note.at,
    }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export interface ItemRow {
  itemId: string;
  name: string;
  qty: number;
  unitPriceMinor: number;
  /** Integer unit price times integer quantity, for display only. */
  lineMinor: number;
  customName: string | null;
}

export function itemRows(order: AdminOrderDetail): ItemRow[] {
  const names = order.design.personalisation.itemNames;
  return order.items.map((item: ItemSnapshot) => {
    const custom = names[item.itemId];
    return {
      itemId: item.itemId,
      name: item.name,
      qty: item.qty,
      unitPriceMinor: item.unitPriceMinor,
      lineMinor: item.unitPriceMinor * item.qty,
      customName: custom !== undefined && custom.trim() !== "" ? custom : null,
    };
  });
}

export interface PersonalisationText {
  key: string;
  label: string;
  value: string;
}

/** The texts staff must copy onto the gift: customer request first so it is not missed, then card message, recipient name, item names. */
export function personalisationTexts(order: AdminOrderDetail): PersonalisationText[] {
  const { cardMessage, recipientName, customRequest } = order.design.personalisation;
  const out: PersonalisationText[] = [];
  if (customRequest.trim() !== "")
    out.push({ key: "custom-request", label: "Customer request", value: customRequest });
  if (cardMessage.trim() !== "")
    out.push({ key: "card", label: "Card message", value: cardMessage });
  if (recipientName.trim() !== "")
    out.push({ key: "recipient", label: "Recipient name", value: recipientName });
  for (const row of itemRows(order)) {
    if (row.customName !== null)
      out.push({ key: `item-${row.itemId}`, label: `Name on ${row.name}`, value: row.customName });
  }
  return out;
}

export interface SceneInput {
  design: Design;
  packaging: Packaging;
  items: Item[];
}

/** The frozen snapshots as the documents `<GiftScene/>` draws. Never reads the catalog. */
export function sceneInput(order: AdminOrderDetail): SceneInput {
  const docs = snapshotsToSceneDocs({
    design: order.design,
    packaging: order.packaging,
    items: order.items,
  });
  return { design: order.design, packaging: docs.packaging, items: docs.items };
}

/** Use the Clipboard API only where the browser allows it; otherwise select the text for Ctrl+C. */
export function copyStrategy(env: {
  hasClipboard: boolean;
  isSecureContext: boolean;
}): "clipboard" | "select" {
  return env.hasClipboard && env.isSecureContext ? "clipboard" : "select";
}

export function addressLines(order: AdminOrderDetail): { label: string; value: string }[] {
  const { address } = order;
  const rows: [string, string | undefined][] = [
    ["Address line 1", address.line1],
    ["Address line 2", address.line2],
    ["City", address.city],
    ["Region", address.region],
    ["Postal code", address.postalCode],
  ];
  return rows.flatMap(([label, value]) =>
    value !== undefined && value.trim() !== "" ? [{ label, value }] : [],
  );
}
