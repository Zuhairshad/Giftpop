import { snapshotsToSceneDocs } from "@giftpop/contracts";
import type { AdminOrderDetail } from "@giftpop/contracts";
import { GiftScene } from "@giftpop/renderer";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { loadPackingOrder } from "./load";
import { PrintButton } from "./print-button";
import { PACKING_PRINT_CSS } from "./print-styles";
import {
  addressLines,
  buildChecklist,
  checklistDensity,
  colourName,
  hasPersonalisation,
  packerNotes,
  totalPieces,
} from "./view-model";

import { buttonVariants } from "@/components/ui/button";
import { flagEmoji, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function Swatch({ label, hex, name }: { label: string; hex: string; name: string | undefined }) {
  const word = colourName(hex, name);
  return (
    <div className="flex items-center gap-2">
      <span
        className="packing-swatch inline-block size-7 shrink-0 rounded border border-black"
        style={{ backgroundColor: hex }}
        role="img"
        aria-label={`${label} colour ${word ? `${word}, ` : ""}${hex}`}
      />
      <span className="text-sm leading-tight">
        <span className="font-semibold">{label}</span>
        <br />
        {word ? `${word} ` : ""}
        <span className="font-mono uppercase">{hex}</span>
      </span>
    </div>
  );
}

function Checklist({ order }: { order: AdminOrderDetail }) {
  const lines = buildChecklist(order);
  const density = checklistDensity(lines.length);
  const nameSize =
    density === "roomy" ? "text-xl" : density === "compact" ? "text-lg" : "text-base";
  return (
    <section aria-labelledby="packing-checklist" className="packing-keep">
      <h2 id="packing-checklist" className="mb-1 text-sm font-semibold tracking-wide uppercase">
        Checklist ({totalPieces(lines)} pieces)
      </h2>
      <ol className="packing-checklist divide-y divide-black/30 border-y border-black">
        {lines.map((line) => (
          <li key={line.itemId} className="flex items-center gap-3 py-1">
            <span
              aria-hidden="true"
              className="inline-block size-6 shrink-0 border-2 border-black"
            />
            <span className="w-14 shrink-0 text-right packing-qty text-3xl leading-none font-bold tabular-nums">
              {line.qty}x
            </span>
            <span
              className={cn("packing-name min-w-0 flex-1 leading-tight wrap-anywhere", nameSize)}
            >
              <span className="font-medium">{line.name}</span>
              {line.customName ? (
                <span className="packing-custom block text-2xl font-bold">
                  Name: &ldquo;{line.customName}&rdquo;
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Personalisation({ order }: { order: AdminOrderDetail }) {
  if (!hasPersonalisation(order)) return null;
  const { recipientName, cardMessage } = order.design.personalisation;
  return (
    <section
      aria-labelledby="packing-personal"
      className="packing-keep packing-personal rounded border-2 border-black p-3"
    >
      <h2 id="packing-personal" className="mb-1 text-sm font-semibold tracking-wide uppercase">
        Personalisation
      </h2>
      {recipientName.trim() ? (
        <p className="text-2xl font-bold wrap-anywhere">For: {recipientName}</p>
      ) : null}
      {cardMessage.trim() ? (
        <p className="mt-1 text-xl leading-snug whitespace-pre-wrap wrap-anywhere">{cardMessage}</p>
      ) : null}
    </section>
  );
}

function AddressLabel({ order }: { order: AdminOrderDetail }) {
  const lines = addressLines(order);
  return (
    <section
      aria-labelledby="packing-label"
      className="packing-keep rounded border-2 border-dashed border-black p-4"
    >
      <h2 id="packing-label" className="mb-1 text-sm font-semibold tracking-wide uppercase">
        Ship to (cut out)
      </h2>
      <address className="text-xl leading-snug not-italic wrap-anywhere">
        {lines.map((line, i) => (
          <span key={`${i}-${line}`} className={cn("block", i === 0 && "text-2xl font-bold")}>
            {line}
          </span>
        ))}
      </address>
    </section>
  );
}

export async function PackingSheet({ id }: { id: string }) {
  const order = await loadPackingOrder(id);
  const docs = snapshotsToSceneDocs({
    design: order.design,
    packaging: order.packaging,
    items: order.items,
  });
  const notes = packerNotes(order);

  return (
    <div className="packing-sheet mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <style>{PACKING_PRINT_CSS}</style>

      <div className="packing-no-print flex flex-wrap items-center justify-between gap-2">
        <Link href={`/orders/${order.id}`} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeftIcon aria-hidden="true" />
          Back to order
        </Link>
        <PrintButton />
      </div>

      <header className="flex flex-wrap items-baseline justify-between gap-x-4 border-b-2 border-black pb-1">
        <h1 className="packing-h1 text-3xl font-bold tabular-nums">{order.number}</h1>
        <p className="text-base">
          {flagEmoji(order.country)} {order.country} &middot; {formatDate(order.createdAt)}
        </p>
      </header>

      <div className="packing-grid grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col gap-3">
          <div className="packing-scene mx-auto aspect-square w-full max-w-sm">
            <GiftScene
              design={order.design}
              packaging={docs.packaging}
              items={docs.items}
              className="size-full"
            />
          </div>
          <section aria-labelledby="packing-wrap" className="packing-keep flex flex-col gap-1">
            <h2 id="packing-wrap" className="text-sm font-semibold tracking-wide uppercase">
              Packaging: <span className="text-base normal-case">{order.packaging.name}</span>
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <Swatch
                label="Wrapper"
                hex={order.design.wrapperColor}
                name={order.packaging.wrapperColorName}
              />
              <Swatch
                label="Ribbon"
                hex={order.design.ribbonColor}
                name={order.packaging.ribbonColorName}
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3">
          <Checklist order={order} />
          <Personalisation order={order} />
          {notes.length > 0 ? (
            <section
              aria-labelledby="packing-notes"
              className="packing-keep packing-box rounded border-2 border-black bg-amber-50 p-2"
            >
              <h2 id="packing-notes" className="text-sm font-semibold tracking-wide uppercase">
                Notes for the packer
              </h2>
              <ul className="list-disc pl-5 text-base wrap-anywhere">
                {notes.map((text, i) => (
                  <li key={`${i}-${text}`}>{text}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <AddressLabel order={order} />
    </div>
  );
}
