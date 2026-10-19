import type { AdminOrderListItem } from "@giftpop/contracts";

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from "../../status";

import { flagEmoji, formatDate, formatMoney } from "@/lib/format";

export interface OrderRow {
  id: string;
  href: string;
  number: string;
  date: string;
  countryCode: string;
  flag: string;
  customer: string;
  total: string;
  paymentLabel: string;
  paymentStyle: string;
  statusLabel: string;
  statusStyle: string;
  items: string;
  hasPendingProof: boolean;
}

/** Everything a table row shows, as text, so the markup has no logic. */
export function toRow(item: AdminOrderListItem): OrderRow {
  return {
    id: item.id,
    href: `/orders/${item.id}`,
    number: item.number,
    date: formatDate(item.createdAt),
    countryCode: item.country,
    flag: flagEmoji(item.country),
    customer: item.customerName.trim() === "" ? "No name" : item.customerName,
    total: formatMoney(item.totalMinor, item.currency),
    paymentLabel: PAYMENT_STATUS_LABELS[item.paymentStatus],
    paymentStyle: PAYMENT_STATUS_STYLES[item.paymentStatus],
    statusLabel: ORDER_STATUS_LABELS[item.status],
    statusStyle: ORDER_STATUS_STYLES[item.status],
    items: item.itemCount === 1 ? "1 item" : `${item.itemCount} items`,
    hasPendingProof: item.hasPendingProof,
  };
}
