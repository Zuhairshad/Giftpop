"use client";

import type { Country, FeaturedTemplate, TemplateCategory } from "@giftpop/contracts";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { listCountries, listTemplates, updateTemplate } from "../api/client";
import { categoryOptions } from "../lib/category";
import { compareTemplates, planMove } from "../lib/reorder";
import type { MoveDirection } from "../lib/reorder";
import { toActiveRequest, toCategoryRequest, toSortOrderRequest } from "../lib/template-form";

import { DeleteTemplateDialog } from "./delete-template-dialog";
import type { CreateSource } from "./share-source-field";
import { TemplateDialog } from "./template-dialog";
import { TemplatePreview } from "./template-preview";
import { TemplateRow } from "./template-row";
import { useCountryPrices } from "./use-country-prices";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { readApiError } from "@/features/catalog/lib/api-errors";

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; templates: FeaturedTemplate[] };

export function TemplatesManager() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [countries, setCountries] = useState<Country[]>([]);
  const [attempt, setAttempt] = useState(0);
  /** Bumped when a change can alter what customers see, so the prices are asked for again. */
  const [priceVersion, setPriceVersion] = useState(0);
  const [editing, setEditing] = useState<FeaturedTemplate | null>(null);
  const [source, setSource] = useState<CreateSource>("link");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewing, setPreviewing] = useState<FeaturedTemplate | null>(null);
  const [removing, setRemoving] = useState<FeaturedTemplate | null>(null);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    listTemplates(controller.signal)
      .then((templates) => setLoad({ state: "ready", templates: sortTemplates(templates) }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoad({ state: "error", message: readApiError(error).message });
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const controller = new AbortController();
    listCountries(controller.signal)
      .then(setCountries)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const templates = useMemo(() => (load.state === "ready" ? load.templates : []), [load]);
  const listedCountries = useMemo(
    () => templates.flatMap((template) => template.countries),
    [templates],
  );
  const lists = useCountryPrices(listedCountries, priceVersion);
  const categories = useMemo(() => categoryOptions(templates), [templates]);

  const countryName = useCallback(
    (code: string) => countries.find((country) => country.code === code)?.name ?? code,
    [countries],
  );

  const replace = useCallback((saved: FeaturedTemplate) => {
    setLoad((current) =>
      current.state === "ready"
        ? {
            state: "ready",
            templates: sortTemplates(
              current.templates.some((item) => item.id === saved.id)
                ? current.templates.map((item) => (item.id === saved.id ? saved : item))
                : [...current.templates, saved],
            ),
          }
        : current,
    );
  }, []);

  function remove(id: string) {
    setLoad((current) =>
      current.state === "ready"
        ? { state: "ready", templates: current.templates.filter((item) => item.id !== id) }
        : current,
    );
  }

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
      replace(await updateTemplate(template.id, toActiveRequest(active, template)));
      setPriceVersion((n) => n + 1);
    } catch (error) {
      toast.error(readApiError(error).message);
    } finally {
      markBusy([template.id], false);
    }
  }

  async function setCategory(template: FeaturedTemplate, category: TemplateCategory | null) {
    markBusy([template.id], true);
    try {
      replace(await updateTemplate(template.id, toCategoryRequest(category, template)));
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
      updates.map((update) => {
        const saved = templates.find((item) => item.id === update.id) ?? template;
        return updateTemplate(update.id, toSortOrderRequest(update.sortOrder, saved));
      }),
    );
    for (const result of results) {
      if (result.status === "fulfilled") replace(result.value);
    }
    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      toast.error(`Could not save the new order. ${readApiError(failed.reason).message}`);
      // Some updates may have landed: load the list again so it shows what is saved.
      setAttempt((n) => n + 1);
    }
    markBusy(ids, false);
  }

  function openDialog(template: FeaturedTemplate | null, nextSource: CreateSource = "link") {
    setEditing(template);
    setSource(nextSource);
    setDialogOpen(true);
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-auto min-h-8 whitespace-normal"
          onClick={() => openDialog(null, "link")}
        >
          <PlusIcon data-icon="inline-start" />
          Create from share link
        </Button>
        <Button
          variant="outline"
          className="h-auto min-h-8 whitespace-normal"
          onClick={() => openDialog(null, "builder")}
        >
          <PlusIcon data-icon="inline-start" />
          Create from a gift I built in the builder
        </Button>
      </div>

      {load.state === "loading" ? (
        <div className="grid grid-cols-1 gap-2" role="status" aria-label="Loading templates">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {load.state === "error" ? (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/10 grid gap-2 rounded-lg border p-4 text-sm"
        >
          <p className="text-destructive">{load.message}</p>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoad({ state: "loading" });
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : null}

      {load.state === "ready" && templates.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No ready-made gifts yet. Build a gift in the shop, save and share it there, then create a
          template from its link.
        </p>
      ) : null}

      {load.state === "ready" && templates.length > 0 ? (
        <ul
          className="grid grid-cols-1 gap-3"
          aria-label="Templates, in the order customers see them"
        >
          {templates.map((template, index) => (
            <TemplateRow
              key={template.id}
              template={template}
              isFirst={index === 0}
              isLast={index === templates.length - 1}
              busy={busyIds.has(template.id)}
              categories={categories}
              lists={lists}
              countryName={countryName}
              onMove={(direction) => void move(template, direction)}
              onActiveChange={(active) => void setActive(template, active)}
              onCategoryChange={(category) => void setCategory(template, category)}
              onPreview={() => setPreviewing(template)}
              onEdit={() => openDialog(template)}
              onRemove={() => setRemoving(template)}
            />
          ))}
        </ul>
      ) : null}

      <TemplateDialog
        template={editing}
        source={source}
        templates={templates}
        open={dialogOpen}
        countries={countries}
        onOpenChange={setDialogOpen}
        onSaved={(saved) => {
          replace(saved);
          setPriceVersion((n) => n + 1);
        }}
      />
      <TemplatePreview template={previewing} onClose={() => setPreviewing(null)} />
      <DeleteTemplateDialog
        template={removing}
        onClose={() => setRemoving(null)}
        onDeleted={remove}
      />
    </div>
  );
}

/** The list order: sort order, then oldest first. */
function sortTemplates(templates: readonly FeaturedTemplate[]): FeaturedTemplate[] {
  return [...templates].sort(compareTemplates);
}
