"use client";

import { useRef } from "react";
import type { ReactElement } from "react";

import { CopyButton } from "./copy-button";
import { META_LABEL } from "./ui";

/** The order number, big, with a button that copies it (or selects it when copying is blocked). */
export function CopyNumber({ number }: { number: string }): ReactElement {
  const textRef = useRef<HTMLSpanElement>(null);
  return (
    <div className="min-w-0 space-y-1">
      <p className={META_LABEL}>Your order number</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          ref={textRef}
          className="font-display text-[28px] leading-tight font-bold tracking-[-0.6px] wrap-anywhere select-all sm:text-4xl sm:tracking-[-0.9px]"
        >
          {number}
        </span>
        <CopyButton
          text={number}
          label="Copy order number"
          copiedMessage="Order number copied."
          targetRef={textRef}
        />
      </div>
    </div>
  );
}
