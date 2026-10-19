import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { ShipmentPanel } from "./shipment-panel";
import { TimelineList } from "./timeline-list";

import { AmountsPanel } from "@/features/order/amounts-panel";
import { GiftPanel } from "@/features/order/gift-panel";
import { statusHint } from "@/features/order/status-labels";
import { StatusPill } from "@/features/order/status-pill";
import { CARD, META_LABEL } from "@/features/order/ui";

/** Everything the tracking page shows for a found order. */
export function TrackResult({ view }: { view: PublicOrderView }): ReactElement {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className={`${CARD} space-y-3`}>
        <p className={META_LABEL}>Order number</p>
        <p className="font-display text-3xl font-bold tracking-tight wrap-anywhere sm:text-4xl">
          {view.number}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusPill status={view.status} />
          <span className="text-sm text-muted">{statusHint(view.status)}</span>
        </div>
      </header>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:items-start">
        <div className="min-w-0 space-y-6 sm:space-y-8">
          <TimelineList view={view} />
          {view.shipment ? <ShipmentPanel shipment={view.shipment} /> : null}
          <AmountsPanel view={view} />
        </div>
        <div className="min-w-0 md:sticky md:top-6">
          <GiftPanel view={view} />
        </div>
      </div>
    </div>
  );
}
