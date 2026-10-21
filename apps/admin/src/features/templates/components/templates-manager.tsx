"use client";

import type { Country, FeaturedTemplate } from "@giftpop/contracts";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { listCountries, listTemplates } from "../api/client";
import { categoryOptions } from "../lib/category";
import { compareTemplates } from "../lib/reorder";

import { DeleteTemplateDialog } from "./delete-template-dialog";
import type { CreateSource } from "./share-source-field";
import { TemplateDialog } from "./template-dialog";
import { TemplatePreview } from "./template-preview";
import { TemplateRow } from "./template-row";
import { useCountryPrices } from "./use-country-prices";
import { useTemplateActions } from "./use-template-actions";

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

  const { busyIds, setActive, setCategory, move } = useTemplateActions({
    templates,
    replace,
    reload: () => setAttempt((n) => n + 1),
    onVisibilityChange: () => setPriceVersion((n) => n + 1),
  });

  function remove(id: string) {
    setLoad((current) =>
      current.state === "ready"
        ? { state: "ready", templates: current.templates.filter((item) => item.id !== id) }
        : current,
    );
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
          aria-label="Templates, ordered by position. Featured gifts are shown first to customers"
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
