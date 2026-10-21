"use client";

import type { Country, FeaturedTemplate } from "@giftpop/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createTemplate, updateTemplate } from "../api/client";
import { categoryOptions } from "../lib/category";
import { countryChoices } from "../lib/countries";
import { describeRejection, readTemplateRejection } from "../lib/problems";
import {
  CreateTemplateFormSchema,
  TemplateFormSchema,
  emptyTemplateValues,
  templateToValues,
  toCreateRequest,
  toUpdateRequest,
} from "../lib/template-form";
import type { TemplateFormValues } from "../lib/template-form";

import { CategoryField } from "./category-field";
import { CountryCheckboxes } from "./country-checkboxes";
import { ShareSourceField } from "./share-source-field";
import type { CreateSource } from "./share-source-field";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormAlert, ToggleRow } from "@/features/catalog/components/field";
import { readApiError } from "@/features/catalog/lib/api-errors";
import { isApiError } from "@/lib/api";

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

function TemplateForm({
  template,
  source,
  templates,
  builderUrl,
  countries,
  onDone,
  onSaved,
}: {
  template: FeaturedTemplate | null;
  source: CreateSource;
  templates: readonly FeaturedTemplate[];
  builderUrl: string | undefined;
  countries: readonly Country[];
  onDone: () => void;
  onSaved: (template: FeaturedTemplate) => void;
}) {
  const form = useForm<TemplateFormValues, unknown, TemplateFormValues>({
    resolver: zodResolver(template ? TemplateFormSchema : CreateTemplateFormSchema),
    defaultValues: template ? templateToValues(template) : emptyTemplateValues(),
  });
  const [saveError, setSaveError] = useState<string>();
  const { isSubmitting, errors } = form.formState;
  const selectedCountries = useWatch({ control: form.control, name: "countries" });
  const shareLink = useWatch({ control: form.control, name: "shareLink" });
  const countryName = (code: string) => countries.find((c) => c.code === code)?.name ?? code;

  async function onSubmit(values: TemplateFormValues) {
    setSaveError(undefined);
    try {
      const saved = template
        ? await updateTemplate(template.id, toUpdateRequest(values))
        : await createTemplate(toCreateRequest(values));
      toast.success(template ? "Template saved" : "Template created");
      onSaved(saved);
      onDone();
    } catch (error) {
      setSaveError(
        failureMessage(error, countryName, (message) =>
          form.setError("shareLink", { type: "server", message }),
        ),
      );
    }
  }

  const choices = countryChoices(countries, selectedCountries);
  const categories = categoryOptions(templates, template?.category ?? null);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-4">
      <DialogHeader>
        <DialogTitle>
          {template
            ? "Edit template"
            : source === "builder"
              ? "Create from a gift I built"
              : "Create from share link"}
        </DialogTitle>
        <DialogDescription>
          {template
            ? "The design stays as it was saved. Change how it is listed."
            : source === "builder"
              ? "Build the gift in the shop, share it there, then come back with the link."
              : "Save a gift in the builder, copy its share link, and paste it here."}
        </DialogDescription>
      </DialogHeader>

      {template ? (
        <Field
          label="Share link or share id"
          hint="The design cannot be changed after creating the template."
        >
          {(control) => (
            <Input {...control} autoComplete="off" disabled {...form.register("shareLink")} />
          )}
        </Field>
      ) : (
        <ShareSourceField
          source={source}
          builderUrl={builderUrl}
          value={shareLink}
          error={errors.shareLink?.message}
          registration={form.register("shareLink")}
        />
      )}
      <Field label="Title" error={errors.title?.message}>
        {(control) => <Input {...control} maxLength={80} {...form.register("title")} />}
      </Field>
      <Field label="Description" error={errors.description?.message} hint="Up to 300 characters.">
        {(control) => (
          <Textarea {...control} rows={3} maxLength={300} {...form.register("description")} />
        )}
      </Field>
      <Controller
        control={form.control}
        name="countries"
        render={({ field }) => (
          <CountryCheckboxes
            choices={choices}
            value={field.value}
            onChange={field.onChange}
            error={errors.countries?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="category"
        render={({ field }) => (
          <CategoryField
            value={field.value}
            options={categories}
            onChange={field.onChange}
            error={errors.category?.message ?? errors.category?.slug?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="featured"
        render={({ field }) => (
          <ToggleRow
            label="Featured gift"
            description="Shown first on the ready-made gifts page for the countries it is listed in."
          >
            {({ id }) => <Switch id={id} checked={field.value} onCheckedChange={field.onChange} />}
          </ToggleRow>
        )}
      />
      <Field
        label="Sort order"
        error={errors.sortOrder?.message}
        hint="Lower numbers show first. You can also move templates up and down in the list."
        className="sm:w-40"
      >
        {(control) => (
          <Input
            {...control}
            type="number"
            inputMode="numeric"
            step={1}
            {...form.register("sortOrder", { valueAsNumber: true })}
          />
        )}
      </Field>
      {template ? (
        <Controller
          control={form.control}
          name="active"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch id="template-active" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="template-active">Show to customers</Label>
            </div>
          )}
        />
      ) : null}

      <FormAlert message={saveError} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : template ? "Save template" : "Create template"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** The sentence for a failed save. A 422 names the country and the problems. */
function failureMessage(
  error: unknown,
  countryName: (code: string) => string,
  markShareLink: (message: string) => void,
): string {
  if (isApiError(error)) {
    if (error.status === 422) {
      const rejection = readTemplateRejection(error.details);
      if (rejection) return describeRejection(rejection, countryName);
    }
    if (error.status === 404) {
      const message = "No saved design has that share id. Check the link and try again.";
      markShareLink(message);
      return message;
    }
  }
  return readApiError(error).message;
}
