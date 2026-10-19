"use client";

import { AddNoteRequestSchema, AdminOrderDetailSchema } from "@giftpop/contracts";
import type { AddNoteRequest } from "@giftpop/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { NoteRow } from "./view-model";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { readApiError } from "@/features/catalog/lib/api-errors";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function NotesBox({ orderId, notes }: { orderId: string; notes: NoteRow[] }) {
  const router = useRouter();
  const form = useForm<AddNoteRequest>({
    resolver: zodResolver(AddNoteRequestSchema),
    defaultValues: { text: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: AddNoteRequest) {
    try {
      await apiFetch(`/admin/orders/${orderId}/notes`, AdminOrderDetailSchema, {
        method: "POST",
        body: values,
      });
      toast.success("Note added");
      form.reset({ text: "" });
      router.refresh();
    } catch (error) {
      toast.error(readApiError(error).message);
    }
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2" noValidate>
        <Label htmlFor="order-note">Internal notes, never shown to the customer</Label>
        <Textarea
          id="order-note"
          rows={3}
          placeholder="For example: customer asked for the gift to arrive before Friday"
          aria-invalid={errors.text ? true : undefined}
          aria-describedby={errors.text ? "order-note-error" : undefined}
          {...form.register("text")}
        />
        {errors.text ? (
          <p id="order-note-error" role="alert" className="text-destructive text-sm">
            {errors.text.message}
          </p>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Adding note" : "Add note"}
        </Button>
      </form>
      {notes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No notes yet.</p>
      ) : (
        <ul className="grid gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border p-3">
              <p className="text-sm wrap-anywhere whitespace-pre-wrap">{note.text}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {note.author}, {formatDateTime(note.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
