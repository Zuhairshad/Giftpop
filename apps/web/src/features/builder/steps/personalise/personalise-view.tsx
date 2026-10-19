"use client";

import { CARD_MESSAGE_MAX_LENGTH, RECIPIENT_NAME_MAX_LENGTH } from "@giftpop/contracts";
import { GiftScene } from "@giftpop/renderer";
import Link from "next/link";
import { useMemo } from "react";

import { CardPreview } from "./card-preview";
import { LimitedField } from "./limited-field";
import { nameableItems } from "./limits";

import { StepProgress } from "@/features/builder/components/progress";
import { stepHref } from "@/features/builder/state";
import type { BuilderApi } from "@/features/builder/state";

/** What this screen needs from the builder store. */
export type PersonaliseBuilder = Pick<
  BuilderApi,
  | "country"
  | "catalog"
  | "packaging"
  | "design"
  | "lines"
  | "cardMessage"
  | "recipientName"
  | "itemNames"
  | "setCardMessage"
  | "setRecipientName"
  | "setItemName"
>;

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors motion-reduce:transition-none";
const PRIMARY = `${BUTTON_BASE} bg-pink-strong text-on-pink hover:opacity-90`;
const SECONDARY = `${BUTTON_BASE} border-border bg-surface text-foreground hover:bg-surface-soft border-2`;

export function PersonaliseView({ builder }: { builder: PersonaliseBuilder }) {
  const { country, catalog, packaging, design, lines } = builder;

  const sceneItems = useMemo(() => catalog.items.map((priced) => priced.item), [catalog.items]);
  const nameable = useMemo(() => nameableItems(lines, sceneItems), [lines, sceneItems]);

  if (!packaging || !design) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <StepProgress current="personalise" />
        <p className="mt-6 text-lg">Pick a format and some items first, then come back here.</p>
        <Link href={stepHref(country, "format")} className={`${PRIMARY} mt-4`}>
          Choose a format
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <StepProgress current="personalise" />

      <div className="mt-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Make it personal</h1>
        <p className="text-muted mt-2 max-w-xl">
          Add a note for the card and, if you like, names on your items. You can skip all of it.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-surface-soft border-border shadow-pop rounded-blob mx-auto w-48 border p-3 sm:w-64 lg:w-72">
            <GiftScene design={design} packaging={packaging} items={sceneItems} />
          </div>
          <CardPreview recipientName={builder.recipientName} message={builder.cardMessage} />
        </div>

        <form
          className="space-y-6"
          aria-label="Personalise your gift"
          onSubmit={(event) => event.preventDefault()}
        >
          <LimitedField
            label="Recipient name"
            value={builder.recipientName}
            limit={RECIPIENT_NAME_MAX_LENGTH}
            onChange={builder.setRecipientName}
            placeholder="Who is it for?"
            autoComplete="off"
          />
          <LimitedField
            label="Card message"
            value={builder.cardMessage}
            limit={CARD_MESSAGE_MAX_LENGTH}
            onChange={builder.setCardMessage}
            placeholder="Write something kind"
            multiline
          />

          {nameable.length > 0 ? (
            <fieldset className="border-border rounded-card space-y-5 border-2 p-4">
              <legend className="font-display px-2 text-lg font-bold">Names on items</legend>
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
        </form>
      </div>

      <nav
        aria-label="Builder steps"
        className="border-border mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6"
      >
        <Link href={stepHref(country, "arrange")} className={SECONDARY}>
          Back to arrange
        </Link>
        <Link href={stepHref(country, "review")} className={PRIMARY}>
          Continue to review
        </Link>
      </nav>
    </div>
  );
}
