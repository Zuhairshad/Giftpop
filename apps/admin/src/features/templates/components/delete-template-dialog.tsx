"use client";

import type { FeaturedTemplate } from "@giftpop/contracts";
import { useState } from "react";
import { toast } from "sonner";

import { deleteTemplate } from "../api/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert } from "@/features/catalog/components/field";
import { readApiError } from "@/features/catalog/lib/api-errors";

interface DeleteTemplateDialogProps {
  template: FeaturedTemplate | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteTemplateDialog({ template, onClose, onDeleted }: DeleteTemplateDialogProps) {
  return (
    <Dialog open={template !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        {template ? (
          <DeleteBody
            key={template.id}
            template={template}
            onClose={onClose}
            onDeleted={onDeleted}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DeleteBody({
  template,
  onClose,
  onDeleted,
}: {
  template: FeaturedTemplate;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function remove() {
    setBusy(true);
    setError(undefined);
    try {
      await deleteTemplate(template.id);
      toast.success("Template removed");
      onDeleted(template.id);
      onClose();
    } catch (failure) {
      setError(readApiError(failure).message);
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Remove this template?</DialogTitle>
        <DialogDescription className="wrap-anywhere">
          &ldquo;{template.title}&rdquo; will no longer be shown to customers. The saved design and
          its share link keep working.
        </DialogDescription>
      </DialogHeader>
      <FormAlert message={error} />
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Keep template
        </Button>
        <Button variant="destructive" onClick={remove} disabled={busy}>
          {busy ? "Removing…" : "Remove template"}
        </Button>
      </DialogFooter>
    </>
  );
}
