import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { safeTrackingUrl } from "@/features/order/tracking-link";
import { CARD, CARD_TITLE, META_LABEL, SECONDARY } from "@/features/order/ui";

export function ShipmentPanel({
  shipment,
}: {
  shipment: NonNullable<PublicOrderView["shipment"]>;
}): ReactElement {
  const href = safeTrackingUrl(shipment.trackingUrl);
  return (
    <section aria-labelledby="shipment-heading" className={CARD}>
      <h2 id="shipment-heading" className={CARD_TITLE}>
        Courier
      </h2>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className={META_LABEL}>Courier</dt>
          <dd className="wrap-anywhere">{shipment.courier}</dd>
        </div>
        <div>
          <dt className={META_LABEL}>Tracking number</dt>
          <dd className="font-semibold wrap-anywhere select-all">{shipment.trackingNumber}</dd>
        </div>
      </dl>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 ${SECONDARY} inline-flex min-h-11 items-center justify-center rounded-md px-4 font-semibold`}
        >
          Track with the courier<span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </section>
  );
}
