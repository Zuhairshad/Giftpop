"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useRef, useState } from "react";

import { copyStrategy } from "./view-model";

import { Button } from "@/components/ui/button";

/** A large, selectable text with a Copy button. Falls back to selecting the text when the Clipboard API is not available. */
export function CopyableText({ label, value }: { label: string; value: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function copy() {
    const strategy = copyStrategy({
      hasClipboard: typeof navigator !== "undefined" && Boolean(navigator.clipboard),
      isSecureContext: typeof window !== "undefined" && window.isSecureContext,
    });
    if (strategy === "clipboard") {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setMessage(`${label} copied`);
        return;
      } catch {
        // fall through to selecting the text
      }
    }
    const node = textRef.current;
    if (node) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setCopied(false);
    setMessage(`${label} selected, press Ctrl+C to copy`);
  }

  return (
    <div className="grid gap-1 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium uppercase">{label}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          Copy
        </Button>
      </div>
      <p
        ref={textRef}
        className="text-lg leading-snug font-medium wrap-anywhere whitespace-pre-wrap select-all"
      >
        {value}
      </p>
      <span role="status" aria-live="polite" className="text-muted-foreground min-h-4 text-xs">
        {message}
      </span>
    </div>
  );
}
