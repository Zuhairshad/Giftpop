import type { AdminOrderDetail } from "@giftpop/contracts";

import { NotesBox } from "./notes-box";
import { Field, Panel } from "./panel";
import { noteRows, timelineRows } from "./view-model";

import { formatDate, formatDateTime } from "@/lib/format";

export function TimelineSection({ order }: { order: AdminOrderDetail }) {
  const rows = timelineRows(order);
  const { shipment } = order;
  return (
    <>
      <Panel id="timeline-heading" title="Status timeline">
        <ol className="grid gap-3">
          {rows.map((row) => (
            <li key={row.key} className="border-l-2 pl-3">
              <p className="text-sm font-medium">
                {row.fromLabel === null ? row.toLabel : `${row.fromLabel} to ${row.toLabel}`}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(row.at)} by {row.actor}
              </p>
              {row.note ? (
                <p className="mt-1 text-sm wrap-anywhere whitespace-pre-wrap">{row.note}</p>
              ) : null}
            </li>
          ))}
        </ol>

        {shipment ? (
          <div className="mt-4 border-t pt-3">
            <h3 className="mb-2 text-sm font-semibold">Shipment</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Courier">{shipment.courier}</Field>
              <Field label="Tracking number">{shipment.trackingNumber}</Field>
              <Field label="Shipped on">{formatDate(shipment.shippedAt)}</Field>
              {shipment.trackingUrl ? (
                <Field label="Tracking link">
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    Track this parcel
                  </a>
                </Field>
              ) : null}
            </dl>
          </div>
        ) : null}
      </Panel>

      <Panel id="notes-heading" title="Notes">
        <NotesBox orderId={order.id} notes={noteRows(order)} />
      </Panel>
    </>
  );
}
