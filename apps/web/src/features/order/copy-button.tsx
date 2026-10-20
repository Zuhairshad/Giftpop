"use client";

import { useState } from "react";
import type { ReactElement, RefObject } from "react";

import { SECONDARY } from "./ui";

import { Button } from "@/components/ui";
import { copyLink } from "@/features/share/copy-link";

type CopyButtonProps = {
  text: string;
  /** What the button says, e.g. "Copy order number". */
  label: string;
  /** What the live region says once copied, e.g. "Order number copied." */
  copiedMessage: string;
  /** The element showing `text`; selected when the browser blocks copying. */
  targetRef: RefObject<HTMLElement | null>;
  className?: string;
};

const MANUAL = "It is selected. Press Ctrl+C, or Cmd+C on a Mac, to copy it.";

/** A secondary button that copies `text`, with a polite status line under it. */
export function CopyButton({
  text,
  label,
  copiedMessage,
  targetRef,
  className = "",
}: CopyButtonProps): ReactElement {
  const [message, setMessage] = useState("");

  async function onCopy(): Promise<void> {
    const outcome = await copyLink(text, navigator.clipboard);
    if (outcome === "manual" && targetRef.current) {
      const range = document.createRange();
      range.selectNodeContents(targetRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setMessage(outcome === "copied" ? copiedMessage : MANUAL);
  }

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <Button variant="ghost" size="sm" onClick={onCopy} className={SECONDARY}>
        {label}
      </Button>
      <p role="status" aria-live="polite" className="text-ink-2 text-sm">
        {message}
      </p>
    </div>
  );
}
