"use client";

import type { PartnerRequest } from "@giftpop/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { updatePartnerRequest } from "../api/client";
import { STATUS_OPTIONS, actorLabel, formatDateTime } from "../lib/format";
import { PartnerUpdateFormSchema, toUpdateBody } from "../lib/update-form";
import type { PartnerUpdateFormValues } from "../lib/update-form";

import { PartnerFields } from "./partner-fields";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormAlert } from "@/features/catalog/components/field";
import { OptionSelect } from "@/features/catalog/components/option-select";
import { readApiError } from "@/features/catalog/lib/api-errors";

interface PartnerDetailProps {
  /** The request to show, or null when the sheet is closed. */
  request: PartnerRequest | null;
  countryName: (code: string) => string;
  onClose: () => void;
  onSaved: (request: PartnerRequest) => void;
}

export function PartnerDetail({ request, countryName, onClose, onSaved }: PartnerDetailProps) {
  return (
    <Sheet open={request !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {request ? (
          <DetailBody
            key={request.id}
            request={request}
            countryName={countryName}
            onSaved={onSaved}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailBody({
  request,
  countryName,
  onSaved,
}: {
  request: PartnerRequest;
  countryName: (code: string) => string;
  onSaved: (request: PartnerRequest) => void;
}) {
  const form = useForm<PartnerUpdateFormValues, unknown, PartnerUpdateFormValues>({
    resolver: zodResolver(PartnerUpdateFormSchema),
    defaultValues: { status: request.status, note: "" },
  });
  const [saveError, setSaveError] = useState<string>();
  const { isSubmitting, errors } = form.formState;

  async function onSubmit(values: PartnerUpdateFormValues) {
    setSaveError(undefined);
    const body = toUpdateBody(values, request.status);
    if (body === null) {
      setSaveError("Change the status or write a note first.");
      return;
    }
    try {
      const saved = await updatePartnerRequest(request.id, body);
      toast.success("Request saved");
      onSaved(saved);
      form.reset({ status: saved.status, note: "" });
    } catch (error) {
      setSaveError(readApiError(error).message);
    }
  }

  const title = request.kind === "brand" ? request.brandName : countryName(request.country);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="pr-8 wrap-anywhere">{title}</SheetTitle>
        <SheetDescription>
          {request.kind === "brand" ? "Brand request" : "Country request"}
        </SheetDescription>
      </SheetHeader>
      <div className="grid grid-cols-1 gap-6 px-4 pb-4">
        <PartnerFields request={request} countryName={countryName} />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="grid grid-cols-1 gap-4 border-t pt-4"
        >
          <Field label="Status">
            {(control) => (
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <OptionSelect
                    id={control.id}
                    value={field.value}
                    options={STATUS_OPTIONS}
                    onValueChange={field.onChange}
                  />
                )}
              />
            )}
          </Field>
          <Field label="Add note" error={errors.note?.message}>
            {(control) => <Textarea {...control} rows={3} {...form.register("note")} />}
          </Field>
          <FormAlert message={saveError} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </form>

        <section aria-labelledby="notes-heading" className="grid grid-cols-1 gap-2">
          <h3 id="notes-heading" className="text-sm font-medium">
            Notes
          </h3>
          {request.notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notes yet.</p>
          ) : (
            <ol className="grid grid-cols-1 gap-2">
              {[...request.notes].reverse().map((note, index) => (
                <li key={`${note.at}-${index}`} className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">
                    {actorLabel(note.actorId)} · {formatDateTime(note.at)}
                  </p>
                  <p className="mt-1 wrap-anywhere whitespace-pre-wrap">{note.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
