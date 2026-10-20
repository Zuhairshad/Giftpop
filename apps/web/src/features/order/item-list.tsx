import type { Item } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { ItemArt } from "@/features/builder/questions/items/item-art";

export type ItemListRow = {
  key: string;
  name: string;
  qty: number;
  /** The drawing or uploaded image; a plain well when the item is unknown. */
  item: Item | undefined;
  /** The name the customer put on the item, or null. */
  customName: string | null;
};

/** What is inside the gift: a small picture, "2 × Pink rose" and any name put on the item. */
export function ItemList({ rows }: { rows: readonly ItemListRow[] }): ReactElement {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.key} className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="bg-warm grid size-10 shrink-0 place-items-center overflow-hidden rounded-sm p-1"
          >
            {row.item ? <ItemArt item={row.item} /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-snug font-semibold wrap-anywhere">
              <span className="tabular-nums">{row.qty}</span> &times; {row.name}
            </span>
            {row.customName ? (
              <span className="text-ink-2 block text-sm wrap-anywhere">
                Named &ldquo;{row.customName}&rdquo;
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
