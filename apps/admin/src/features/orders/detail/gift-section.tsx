import type { AdminOrderDetail } from "@giftpop/contracts";

import { CopyableText } from "./copy-button";
import { Field, Panel } from "./panel";
import { ScenePanel } from "./scene-panel";
import { itemRows, personalisationTexts, sceneInput } from "./view-model";

import { ScrollRegion } from "@/components/scroll-region";
import { formatMoney } from "@/lib/format";

/** The gift exactly as ordered: drawn from snapshots, items, packaging and the texts to copy. */
export function GiftSection({ order }: { order: AdminOrderDetail }) {
  const currency = order.quote.currency;
  const rows = itemRows(order);
  const texts = personalisationTexts(order);

  return (
    <Panel id="gift-heading" title="The gift">
      <div className="grid grid-cols-1 gap-4">
        <ScenePanel scene={sceneInput(order)} />

        <ScrollRegion label="Items as ordered, with prices at the time of the order">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Items as ordered, with prices at the time of the order
            </caption>
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs">
                <th scope="col" className="py-2 pr-2 font-medium">
                  Item
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Qty
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Unit price
                </th>
                <th scope="col" className="py-2 pl-2 text-right font-medium">
                  Line total
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.itemId} className="border-b align-top">
                  <th scope="row" className="py-2 pr-2 text-left font-medium wrap-anywhere">
                    {row.name}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums">{row.qty}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                    {formatMoney(row.unitPriceMinor, currency)}
                  </td>
                  <td className="py-2 pl-2 text-right whitespace-nowrap tabular-nums">
                    {formatMoney(row.lineMinor, currency)}
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-2 pr-2 text-left font-medium wrap-anywhere">
                  Packaging: {order.packaging.name}
                </th>
                <td className="px-2 py-2 text-right tabular-nums">1</td>
                <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                  {formatMoney(order.packaging.priceMinor, currency)}
                </td>
                <td className="py-2 pl-2 text-right whitespace-nowrap tabular-nums">
                  {formatMoney(order.packaging.priceMinor, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollRegion>

        <dl className="grid grid-cols-2 gap-3">
          <Field label="Wrapper colour">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block size-4 rounded border"
                style={{ backgroundColor: order.design.wrapperColor }}
              />
              {order.design.wrapperColor}
            </span>
          </Field>
          <Field label="Ribbon colour">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block size-4 rounded border"
                style={{ backgroundColor: order.design.ribbonColor }}
              />
              {order.design.ribbonColor}
            </span>
          </Field>
        </dl>

        <div className="grid gap-2">
          <h3 className="text-sm font-semibold">Personalisation</h3>
          {texts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing to write for this gift.</p>
          ) : (
            texts.map((text) => (
              <CopyableText key={text.key} label={text.label} value={text.value} />
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}
