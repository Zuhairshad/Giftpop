import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { safeTrackingUrl } from "@/features/order/tracking-link";
import { CARD } from "@/features/order/ui";

export function ShipmentPanel({
  shipment,
}: {
  shipment: NonNullable<PublicOrderView["shipment"]>;
}): ReactElement {
  const href = safeTrackingUrl(shipment.trackingUrl);
  return (
    <section aria-labelledby="shipment-heading" className={CARD}>
      <h2 id="shipment-heading" className="font-display text-2xl font-bold">
        Courier
      </h2>
      <dl className="mt-2 space-y-2">
        <div>
          <dt className="text-muted text-sm font-bold">Courier</dt>
          <dd className="wrap-anywhere">{shipment.courier}</dd>
        </div>
        <div>
          <dt className="text-muted text-sm font-bold">Tracking number</dt>
          <dd className="wrap-anywhere select-all">{shipment.trackingNumber}</dd>
        </div>
      </dl>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-strong mt-3 inline-block font-bold underline underline-offset-4"
        >
          Track with the courier<span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </section>
  );
}
