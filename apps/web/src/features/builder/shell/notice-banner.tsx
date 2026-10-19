"use client";

import type { ReactElement } from "react";

import { setNotice, useNotice } from "./notice-store";

import { Button } from "@/components/ui";

/** Tells the visitor what a shared gift lost on the way in (items no longer sold here). */
export function NoticeBanner(): ReactElement | null {
  const notice = useNotice();
  if (!notice) return null;
  return (
    <div
      role="status"
      className="bg-pink-soft text-foreground mb-3 flex items-start gap-2 rounded-md py-1 ps-3 text-sm"
    >
      <p className="flex-1 py-2 wrap-anywhere">{notice}</p>
      <Button variant="ghost" size="sm" onClick={() => setNotice(null)} className="shrink-0">
        Dismiss
      </Button>
    </div>
  );
}
