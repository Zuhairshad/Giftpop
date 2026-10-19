"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** A proof thumbnail that opens the full-size image in a dialog (Esc or Close to dismiss). */
export function ProofPreview({ url, label }: { url: string; label: string }) {
  return (
    <div className="grid gap-1">
      <Dialog>
        <DialogTrigger
          className="focus-visible:ring-ring/50 block w-fit max-w-full rounded-md border focus-visible:ring-[3px]"
          aria-label={`Zoom ${label}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            loading="lazy"
            className="h-28 w-auto max-w-full rounded-md object-contain"
          />
        </DialogTrigger>
        <DialogContent className="max-h-[92dvh] overflow-auto sm:max-w-3xl">
          <DialogTitle className="pr-8 wrap-anywhere">{label}</DialogTitle>
          <DialogDescription className="sr-only">Full-size payment proof image</DialogDescription>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} loading="lazy" className="mx-auto h-auto max-w-full" />
        </DialogContent>
      </Dialog>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit text-sm underline underline-offset-4"
      >
        Open in a new tab
      </a>
    </div>
  );
}
