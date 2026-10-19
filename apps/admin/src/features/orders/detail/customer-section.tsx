import type { AdminOrderDetail } from "@giftpop/contracts";

import { Field, Panel } from "./panel";
import { addressLines } from "./view-model";

import { flagEmoji } from "@/lib/format";

export function CustomerSection({ order }: { order: AdminOrderDetail }) {
  const { contact } = order;
  return (
    <Panel id="customer-heading" title="Customer and delivery">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">{contact.name}</Field>
        <Field label="Email">
          <a href={`mailto:${contact.email}`} className="underline underline-offset-4">
            {contact.email}
          </a>
        </Field>
        <Field label="Phone">
          <a
            href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
            className="underline underline-offset-4"
          >
            {contact.phone}
          </a>
        </Field>
        <Field label="Country">
          <span aria-hidden>{flagEmoji(order.country)} </span>
          {order.country}
        </Field>
        {addressLines(order).map((line) => (
          <Field key={line.label} label={line.label}>
            {line.value}
          </Field>
        ))}
      </dl>
    </Panel>
  );
}
