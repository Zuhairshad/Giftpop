"use client";

import type { CountryCode, Design } from "@giftpop/contracts";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ReactElement } from "react";

import { describeSaveError, saveDesign } from "./save-design";

import { buttonClass } from "@/components/ui";
import { copyLink, copyMessage } from "@/features/share/copy-link";
import { shareHref, shareUrl } from "@/features/share/links";

type SaveState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "saved"; shareId: string; url: string }
  | { phase: "error"; message: string };

const BUTTON = buttonClass({ variant: "tint", size: "sm", className: "disabled:opacity-60" });

type SharePanelProps = { country: CountryCode; design: Design };

/** "Save and share": saves the design, then shows a link that can be copied. */
export function SharePanel({ country, design }: SharePanelProps): ReactElement {
  const [state, setState] = useState<SaveState>({ phase: "idle" });
  const [copyStatus, setCopyStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSave(): Promise<void> {
    setState({ phase: "saving" });
    setCopyStatus("");
    try {
      const saved = await saveDesign(country, design);
      setState({
        phase: "saved",
        shareId: saved.shareId,
        url: shareUrl(window.location.origin, saved.shareId),
      });
      setCopyStatus("Your gift is saved. Anyone with the link can see it.");
    } catch (error) {
      setState({ phase: "error", message: describeSaveError(error) });
    }
  }

  async function onCopy(url: string): Promise<void> {
    const outcome = await copyLink(url, navigator.clipboard);
    if (outcome === "manual") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    setCopyStatus(copyMessage(outcome));
  }

  const saving = state.phase === "saving";

  return (
    <section aria-labelledby="share-heading" className="space-y-3">
      <h3 id="share-heading" className="text-foreground text-base font-semibold">
        Share this gift
      </h3>
      <p className="text-muted text-sm">
        Save your gift and send the link to anyone. They see it full screen and can order it too.
      </p>
      <button type="button" onClick={onSave} disabled={saving} className={BUTTON}>
        {saving ? "Saving…" : state.phase === "saved" ? "Save again" : "Save and share"}
      </button>

      {state.phase === "error" ? (
        <p role="alert" className="text-pink-strong text-sm font-semibold">
          {state.message}
        </p>
      ) : null}

      {state.phase === "saved" ? (
        <div className="space-y-2">
          <label htmlFor="share-link" className="block text-sm font-bold">
            Link to your gift
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              id="share-link"
              readOnly
              value={state.url}
              onFocus={(event) => event.currentTarget.select()}
              className="border-border-strong bg-surface min-h-11 min-w-0 flex-1 rounded-md border px-3 text-sm"
            />
            <button type="button" onClick={() => void onCopy(state.url)} className={BUTTON}>
              Copy link
            </button>
          </div>
          <Link
            href={shareHref(state.shareId)}
            className="text-pink-strong inline-block text-sm font-semibold underline underline-offset-4"
          >
            See how it looks when shared
          </Link>
        </div>
      ) : null}

      <p role="status" aria-live="polite" className="text-sm font-semibold">
        {copyStatus}
      </p>
    </section>
  );
}
