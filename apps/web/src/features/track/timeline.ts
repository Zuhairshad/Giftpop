import type { OrderStatus, PublicOrderView } from "@giftpop/contracts";

import { formatDate, statusHint, statusLabel } from "@/features/order/status-labels";

export type TimelineStep = {
  key: string;
  status: OrderStatus;
  label: string;
  hint: string;
  date: string;
  current: boolean;
};

/**
 * One step per history entry, oldest first. The newest entry is the current one. If the
 * history is empty or out of step with the status, the current status is shown last.
 */
export function buildTimeline(
  view: Pick<PublicOrderView, "history" | "status" | "createdAt">,
): TimelineStep[] {
  const entries = [...view.history].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const last = entries[entries.length - 1];
  if (!last || last.to !== view.status) {
    entries.push({ to: view.status, at: last?.at ?? view.createdAt });
  }
  return entries.map((entry, index) => ({
    key: `${index}-${entry.to}`,
    status: entry.to,
    label: statusLabel(entry.to),
    hint: statusHint(entry.to),
    date: formatDate(entry.at),
    current: index === entries.length - 1,
  }));
}
