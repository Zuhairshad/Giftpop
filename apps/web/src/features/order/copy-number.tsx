"use client";

import { useRef, useState } from "react";
import type { ReactElement } from "react";

import { BUTTON_SECONDARY } from "./ui";

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
      <p className="text-muted text-sm font-bold">Your order number</p>
      <div className="flex flex-wrap items-center gap-3">
        <span
          ref={textRef}
          className="font-display text-3xl font-bold wrap-anywhere select-all sm:text-4xl"
        >
          {number}
        </span>
        <button type="button" onClick={onCopy} className={BUTTON_SECONDARY}>
          Copy order number
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-muted min-h-5 text-sm">
        {message}
      </p>
    </div>
  );
}
