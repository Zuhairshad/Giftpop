"use client";

import {
  CARD_MESSAGE_MAX_LENGTH,
  CUSTOM_REQUEST_MAX_LENGTH,
  RECIPIENT_NAME_MAX_LENGTH,
} from "@giftpop/contracts";
import { useMemo } from "react";
import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { LimitedField } from "./personalise/limited-field";
import { nameableItems } from "./personalise/limits";

/** Question 5 body: recipient, card message and names on personalizable items. All optional. */
export function PersonaliseBody(): ReactElement {
  const builder = useBuilder();
  const { catalog, lines } = builder;
  const nameable = useMemo(
    () =>
      nameableItems(
        lines,
        catalog.items.map((entry) => entry.item),
      ),
    [lines, catalog.items],
  );

  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">Everything here is optional. Skip what you like.</p>
      <LimitedField
        label="Recipient"
        value={builder.recipientName}
        limit={RECIPIENT_NAME_MAX_LENGTH}
        onChange={builder.setRecipientName}
        placeholder="Who is it for?"
      />
      <LimitedField
        label="Card message"
        value={builder.cardMessage}
        limit={CARD_MESSAGE_MAX_LENGTH}
        onChange={builder.setCardMessage}
        placeholder="Write something kind"
        multiline
      />
      <LimitedField
        label="Anything else you'd like?"
        hint="Tell us about any special wish that is not listed. We will read it and get in touch if it costs extra. This does not change your price."
        value={builder.customRequest}
        limit={CUSTOM_REQUEST_MAX_LENGTH}
        onChange={builder.setCustomRequest}
        multiline
      />
      {nameable.length > 0 ? (
        <fieldset className="min-w-0 space-y-4">
          <legend className="text-foreground text-base font-semibold">Names on items</legend>
          {nameable.map(({ item, limit }) => (
            <LimitedField
              key={item.id}
              label={`Name on ${item.name}`}
              value={builder.itemNames[item.id] ?? ""}
              limit={limit}
              onChange={(text) => builder.setItemName(item.id, text)}
            />
          ))}
        </fieldset>
      ) : null}
    </div>
  );
}
