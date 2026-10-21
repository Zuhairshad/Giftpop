"use client";

import type { Country, FeaturedTemplate } from "@giftpop/contracts";

import type { CreateSource } from "./share-source-field";
import { TemplateForm } from "./template-form";

import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TemplateDialogProps {
  /** The template to edit, or null to create one. */
  template: FeaturedTemplate | null;
  /** Which way a new template is being made. Ignored when editing. */
  source: CreateSource;
  /** All templates, for the categories already in use. */
  templates: readonly FeaturedTemplate[];
  /** Where the shop's builder lives, when known. */
  builderUrl?: string | undefined;
  open: boolean;
  countries: readonly Country[];
  onOpenChange: (open: boolean) => void;
  onSaved: (template: FeaturedTemplate) => void;
}

/** Remounts its form each time it opens, so a cancelled edit never lingers. */
export function TemplateDialog({
  template,
  source,
  templates,
  builderUrl,
  open,
  countries,
  onOpenChange,
  onSaved,
}: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {open ? (
          <TemplateForm
            template={template}
            source={source}
            templates={templates}
            builderUrl={builderUrl}
            countries={countries}
            onDone={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
