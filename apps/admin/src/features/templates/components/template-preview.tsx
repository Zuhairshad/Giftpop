"use client";

import type { FeaturedTemplate, SharedDesignView } from "@giftpop/contracts";
import { GiftScene, isKnownLayoutType } from "@giftpop/renderer";
import { useEffect, useState } from "react";

import { loadSharedDesign } from "../api/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { readApiError } from "@/features/catalog/lib/api-errors";

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; view: SharedDesignView };

interface TemplatePreviewProps {
  template: FeaturedTemplate | null;
  onClose: () => void;
}

export function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  return (
    <Dialog open={template !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        {template ? <PreviewBody key={template.id} template={template} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({ template }: { template: FeaturedTemplate }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    loadSharedDesign(template.shareId, controller.signal)
      .then((view) => setLoad({ state: "ready", view }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoad({ state: "error", message: readApiError(error).message });
      });
    return () => controller.abort();
  }, [template.shareId]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-8 wrap-anywhere">{template.title}</DialogTitle>
        <DialogDescription className="wrap-anywhere">
          {template.description === "" ? "How customers see this gift." : template.description}
        </DialogDescription>
      </DialogHeader>
      {load.state === "loading" ? (
        <Skeleton className="aspect-square w-full" role="status" aria-label="Loading preview" />
      ) : null}
      {load.state === "error" ? (
        <p role="alert" className="text-destructive text-sm">
          {load.message}
        </p>
      ) : null}
      {load.state === "ready" ? (
        <div className="bg-muted/40 overflow-hidden rounded-lg border">
          {isKnownLayoutType(load.view.packaging.layoutType) ? (
            <GiftScene
              design={template.design}
              packaging={load.view.packaging}
              items={load.view.items}
            />
          ) : (
            <p className="text-muted-foreground p-6 text-center text-sm">
              There is no layout called &ldquo;{load.view.packaging.layoutType}&rdquo;, so there is
              nothing to preview.
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
