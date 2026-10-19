"use client";

import { useRef, useState } from "react";
import type { ReactElement } from "react";

import { META_LABEL, SECONDARY } from "./ui";

import { Button } from "@/components/ui";
import { copyLink, copyMessage } from "@/features/share/copy-link";

/** The order number, big, with a button that copies it (or selects it when copying is blocked). */
export function CopyNumber({ number }: { number: string }): ReactElement {
  const textRef = useRef<HTMLSpanElement>(null);
  const [message, setMessage] = useState("");

  async function onCopy(): Promise<void> {
    const outcome = await copyLink(number, navigator.clipboard);
    if (outcome === "manual" && textRef.current) {
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setMessage(
      outcome === "copied"
        ? "Order number copied."
        : copyMessage(outcome).replace("The link is", "The order number is"),
    );
  }

  return (
    <div className="space-y-2">
      <p className={META_LABEL}>Your order number</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          ref={textRef}
          className="font-display text-3xl font-bold tracking-tight wrap-anywhere select-all sm:text-4xl"
        >
          {number}
        </span>
        <Button variant="ghost" size="sm" onClick={onCopy} className={SECONDARY}>
          Copy order number
        </Button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted">
        {message}
      </p>
    </div>
  );
}
