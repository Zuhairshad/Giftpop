"use client";

import type { SharedDesignView } from "@giftpop/contracts";
import { useEffect, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { loadSharedDesign } from "../api/client";
import { readShareInput } from "../lib/share-link";

import { SharedDesignScene } from "./shared-design-scene";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/features/catalog/components/field";
import { readApiError } from "@/features/catalog/lib/api-errors";
import { isApiError } from "@/lib/api";

export type CreateSource = "link" | "builder";

interface ShareSourceFieldProps {
  source: CreateSource;
  /** Where the shop's builder lives, when the admin knows it. Without it the guide has no link. */
  builderUrl?: string | undefined;
  /** What staff typed or pasted, as the form holds it. */
  value: string;
  error: string | undefined;
  registration: UseFormRegisterReturn;
}

/** The share link input for a new template: a guide for where to get it, what was understood, and a preview. */
export function ShareSourceField({
  source,
  builderUrl,
  value,
  error,
  registration,
}: ShareSourceFieldProps) {
  const reading = readShareInput(value);
  return (
    <div className="grid grid-cols-1 gap-3">
      {source === "builder" ? <BuilderGuide builderUrl={builderUrl} /> : null}
      <Field
        label="Share link or share id"
        error={error}
        hint="Paste the whole link or just the id at its end. Either works."
      >
        {(control) => (
          <Input
            {...control}
            autoComplete="off"
            spellCheck={false}
            placeholder="https://…/g/abc123XYZ_"
            {...registration}
          />
        )}
      </Field>
      <p role="status" aria-live="polite" className="text-muted-foreground text-sm wrap-anywhere">
        {understood(reading)}
      </p>
      {reading.shareId ? <SharePreview shareId={reading.shareId} /> : null}
    </div>
  );
}

function understood(reading: ReturnType<typeof readShareInput>): string {
  if (reading.kind === "id") return `Understood: share id ${reading.shareId}.`;
  if (reading.kind === "link")
    return `Understood: a link to the gift with share id ${reading.shareId}.`;
  if (reading.kind === "unreadable") {
    return "Not understood yet. A share link looks like https://…/g/abc123XYZ_.";
  }
  return "";
}

function BuilderGuide({ builderUrl }: { builderUrl: string | undefined }) {
  return (
    <section
      aria-labelledby="builder-guide-heading"
      className="bg-muted/40 grid grid-cols-1 gap-2 rounded-lg border p-3 text-sm"
    >
      <h3 id="builder-guide-heading" className="font-medium">
        Build it in the shop, then bring the link back
      </h3>
      <ol className="text-muted-foreground list-decimal space-y-1 pl-5">
        <li>
          {builderUrl ? (
            <a
              href={builderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              Open the shop (opens in a new tab)
            </a>
          ) : (
            "Open the shop in a new tab, pick a country and tap Build your gift."
          )}
        </li>
        <li>Choose a packaging and items, and arrange the gift the way you want it sold.</li>
        <li>
          On the last question, choose &ldquo;Save and share&rdquo;, then &ldquo;Copy link&rdquo;.
        </li>
        <li>
          Come back here and paste the link below. You will see the gift before anything is saved.
        </li>
      </ol>
    </section>
  );
}

type Load = { state: "error"; message: string } | { state: "ready"; view: SharedDesignView };

const DEBOUNCE_MS = 400;

/** The saved gift behind a share id, drawn as customers see it. Waits for typing to pause. */
function SharePreview({ shareId }: { shareId: string }) {
  // The answer is kept with the id it is for, so a new id reads as loading without resetting state.
  const [answer, setAnswer] = useState<{ shareId: string; load: Load } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      loadSharedDesign(shareId, controller.signal)
        .then((view) => setAnswer({ shareId, load: { state: "ready", view } }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          const message =
            isApiError(error) && error.status === 404
              ? "No saved gift has that share id. Check the link and try again."
              : readApiError(error).message;
          setAnswer({ shareId, load: { state: "error", message } });
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [shareId]);

  const load = answer?.shareId === shareId ? answer.load : null;
  if (!load) {
    return <Skeleton className="aspect-square w-full" role="status" aria-label="Loading preview" />;
  }
  if (load.state === "error") {
    return (
      <p role="alert" className="text-destructive text-sm">
        {load.message}
      </p>
    );
  }
  const { view } = load;
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mx-auto w-full max-w-xs">
        <SharedDesignScene view={view} />
      </div>
      <p className="text-muted-foreground text-xs">
        Built for {view.country}.
        {view.packagingAvailable ? "" : " Its packaging is not for sale there today."}
        {view.unavailableItemIds.length > 0
          ? ` ${view.unavailableItemIds.length} item(s) are not for sale there today.`
          : ""}{" "}
        Choose the countries to list it in below; each one is checked when you save.
      </p>
    </div>
  );
}
