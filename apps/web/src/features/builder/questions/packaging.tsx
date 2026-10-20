"use client";

import type { PricedPackaging } from "@giftpop/contracts";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { useQuestionData } from "./data-context";
import { droppedItemNames, droppedItemsNotice, visiblePackagings } from "./packaging/format-copy";
import { groupPackagings, groupSpan } from "./packaging/groups";
import { PackagingTile } from "./packaging/packaging-tile";
import { TemplatesSection } from "./packaging/templates-section";

// Whole class names, so Tailwind sees them: a group's span at 2 and at 3 columns.
const PHONE_SPAN: Record<number, string> = { 1: "col-span-1", 2: "col-span-2" };
const WIDE_SPAN: Record<number, string> = {
  1: "min-[560px]:col-span-1",
  2: "min-[560px]:col-span-2",
  3: "min-[560px]:col-span-3",
};

/** Question 1 body: what the gift comes in, grouped by kind, then ready-made gifts to start from. */
export function PackagingBody(): ReactElement {
  const builder = useBuilder();
  const { country, templates } = useQuestionData();
  const { catalog } = builder;
  const groups = useMemo(() => groupPackagings(visiblePackagings(catalog)), [catalog]);
  const [notice, setNotice] = useState<string | null>(null);

  const choose = (priced: PricedPackaging) => {
    const { droppedItemIds } = builder.choosePackaging(priced.packaging.id);
    setNotice(droppedItemsNotice(priced.packaging.name, droppedItemNames(droppedItemIds, catalog)));
  };

  return (
    <div>
      {notice ? (
        <p
          role="status"
          className="bg-warm text-foreground rounded-md mb-3 p-3 text-sm font-medium wrap-anywhere"
        >
          {notice}
        </p>
      ) : null}

      {groups.length === 0 ? (
        <p className="bg-warm text-muted rounded-md p-4 text-center text-sm">
          We have no gift formats for this country right now. Please check back soon.
        </p>
      ) : (
        // One shared grid (2 columns on phones, 3 from 560px) so tiles always fill the width;
        // each group takes as many columns as it has tiles and lines up on the same tracks.
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 min-[560px]:grid-cols-3">
          {groups.map((group) => (
            <section
              key={group.kind}
              aria-labelledby={`packaging-group-${group.kind}`}
              className={`grid grid-cols-subgrid content-start ${PHONE_SPAN[groupSpan(group.packagings.length, 2)]} ${WIDE_SPAN[groupSpan(group.packagings.length, 3)]}`}
            >
              <h3
                id={`packaging-group-${group.kind}`}
                className="text-muted col-span-full text-xs font-semibold tracking-wide uppercase"
              >
                {group.heading}
              </h3>
              <ul className="col-span-full mt-2 grid grid-cols-subgrid gap-y-2.5">
                {group.packagings.map((priced) => (
                  <PackagingTile
                    key={priced.packaging.id}
                    priced={priced}
                    catalog={catalog}
                    selected={builder.packaging?.id === priced.packaging.id}
                    onChoose={choose}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <TemplatesSection country={country} templates={templates} />
    </div>
  );
}
