"use client";

import type { FeaturedTemplate, TemplateCategory } from "@giftpop/contracts";
import { useState } from "react";
import { toast } from "sonner";

import { updateTemplate } from "../api/client";
import { planMove } from "../lib/reorder";
import type { MoveDirection } from "../lib/reorder";
import { toActiveRequest, toCategoryRequest, toSortOrderRequest } from "../lib/template-form";

import { readApiError } from "@/features/catalog/lib/api-errors";

interface TemplateActionsOptions {
  /** The list as shown, in order. */
  templates: readonly FeaturedTemplate[];
  /** Puts a saved template into the list. */
  replace: (saved: FeaturedTemplate) => void;
  /** Loads the list again from the server. */
  reload: () => void;
  /** Called when a change can alter what customers see. */
  onVisibilityChange: () => void;
}

/** The one-click changes in the list (switch, category, move), each marking its rows busy while it saves. */
export function useTemplateActions({
  templates,
  replace,
  reload,
  onVisibilityChange,
}: TemplateActionsOptions) {
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  function markBusy(ids: readonly string[], busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (busy) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function setActive(template: FeaturedTemplate, active: boolean) {
    markBusy([template.id], true);
    try {
      replace(await updateTemplate(template.id, toActiveRequest(active)));
      onVisibilityChange();
    } catch (error) {
      toast.error(readApiError(error).message);
    } finally {
      markBusy([template.id], false);
    }
  }

  async function setCategory(template: FeaturedTemplate, category: TemplateCategory | null) {
    markBusy([template.id], true);
    try {
      replace(await updateTemplate(template.id, toCategoryRequest(category)));
    } catch (error) {
      toast.error(readApiError(error).message);
    } finally {
      markBusy([template.id], false);
    }
  }

  async function move(template: FeaturedTemplate, direction: MoveDirection) {
    const updates = planMove(templates, template.id, direction);
    if (updates.length === 0) return;
    const ids = updates.map((update) => update.id);
    markBusy(ids, true);
    const results = await Promise.allSettled(
      updates.map((update) => updateTemplate(update.id, toSortOrderRequest(update.sortOrder))),
    );
    for (const result of results) {
      if (result.status === "fulfilled") replace(result.value);
    }
    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      toast.error(`Could not save the new order. ${readApiError(failed.reason).message}`);
      // Some updates may have landed: load the list again so it shows what is saved.
      reload();
    }
    markBusy(ids, false);
  }

  return { busyIds, setActive, setCategory, move };
}
