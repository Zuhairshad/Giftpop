"use client";

import type { Country, FeaturedTemplate } from "@giftpop/contracts";
import { EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { listCountries, listTemplates, updateTemplate } from "../api/client";
import { toActiveRequest } from "../lib/template-form";

import { DeleteTemplateDialog } from "./delete-template-dialog";
import { TemplateDialog } from "./template-dialog";
import { TemplatePreview } from "./template-preview";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { readApiError } from "@/features/catalog/lib/api-errors";

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; templates: FeaturedTemplate[] };

export function TemplatesManager() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [countries, setCountries] = useState<Country[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<FeaturedTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewing, setPreviewing] = useState<FeaturedTemplate | null>(null);
  const [removing, setRemoving] = useState<FeaturedTemplate | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  async function setActive(template: FeaturedTemplate, active: boolean) {
    setTogglingId(template.id);
    try {
      replace(await updateTemplate(template.id, toActiveRequest(active)));
    } catch (error) {
      toast.error(readApiError(error).message);
    } finally {
      setTogglingId(null);
    }
  }

  function openDialog(template: FeaturedTemplate | null) {
    setEditing(template);
    setDialogOpen(true);
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Button onClick={() => openDialog(null)}>
          <PlusIcon data-icon="inline-start" />
          Create from share link
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

      {load.state === "ready" && load.templates.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No featured templates yet. Save a gift in the builder, then create one from its share
          link.
        </p>
      ) : null}

      {load.state === "ready" && load.templates.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3">
          {load.templates.map((template) => (
            <li
              key={template.id}
              className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div className="grid min-w-0 grid-cols-1 gap-1.5">
                <p className="font-medium wrap-anywhere">{template.title}</p>
                {template.description ? (
                  <p className="text-muted-foreground text-sm wrap-anywhere">
                    {template.description}
                  </p>
                ) : null}
                <ul className="flex flex-wrap gap-1" aria-label="Countries">
                  {template.countries.map((code) => (
                    <li key={code}>
                      <Badge variant="secondary">{countryName(code)}</Badge>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-xs">Sort order {template.sortOrder}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`active-${template.id}`}
                    checked={template.active}
                    disabled={togglingId === template.id}
                    onCheckedChange={(checked) => void setActive(template, checked)}
                  />
                  <Label htmlFor={`active-${template.id}`}>
                    {template.active ? "Active" : "Hidden"}
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPreviewing(template)}>
                  <EyeIcon data-icon="inline-start" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => openDialog(template)}>
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRemoving(template)}>
                  <Trash2Icon data-icon="inline-start" />
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <TemplateDialog
        template={editing}
        open={dialogOpen}
        countries={countries}
        onOpenChange={setDialogOpen}
        onSaved={replace}
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

/** The home page order: sort order, then oldest first. */
function sortTemplates(templates: readonly FeaturedTemplate[]): FeaturedTemplate[] {
  return [...templates].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt),
  );
}
