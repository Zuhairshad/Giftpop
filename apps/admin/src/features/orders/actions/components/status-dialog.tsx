"use client";

import type { OrderStatus } from "@giftpop/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field, FormAlert } from "../../../catalog/components/field";
import { describeActionError } from "../lib/action-errors";
import { actionFor, CANCEL_WARNING } from "../lib/action-labels";
import { changeOrderStatus } from "../lib/client";
import { validationResolver } from "../lib/form-resolver";
import { EMPTY_STATUS_VALUES, validateStatusForm } from "../lib/status-request";
import type { StatusFieldName, StatusFormValues } from "../lib/status-request";

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
import { Textarea } from "@/components/ui/textarea";

interface StatusDialogProps {
  orderId: string;
  /** The status being moved to, or null when closed. */
  target: OrderStatus | null;
  onClose: () => void;
  finalFocus?: React.RefObject<HTMLElement | null>;
}

export function StatusDialog({ orderId, target, onClose, finalFocus }: StatusDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto"
        {...(finalFocus ? { finalFocus } : {})}
      >
        {target ? <StatusForm orderId={orderId} target={target} onDone={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function StatusForm({
  orderId,
  target,
  onDone,
}: {
  orderId: string;
  target: OrderStatus;
  onDone: () => void;
}) {
  const router = useRouter();
  const action = actionFor(target);
  const resolver = validationResolver<StatusFormValues>((values) =>
    validateStatusForm(target, values),
  );
  const form = useForm<StatusFormValues>({ resolver, defaultValues: EMPTY_STATUS_VALUES });
  const [alert, setAlert] = useState<string>();
  const { errors, isSubmitting } = form.formState;
  const message = (name: StatusFieldName) => errors[name]?.message;

  async function onSubmit(values: StatusFormValues) {
    setAlert(undefined);
    const result = validateStatusForm(target, values);
    if (!result.ok) return;
    try {
      await changeOrderStatus(orderId, result.request);
      toast.success(`${action.label}: done`);
      onDone();
      router.refresh();
    } catch (error) {
      const described = describeActionError(error);
      for (const field of described.fields) {
        form.setError(field.path as StatusFieldName, { type: "server", message: field.message });
      }
      setAlert(described.message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-4">
      <DialogHeader>
        <DialogTitle>{action.label}</DialogTitle>
        <DialogDescription>{action.description}</DialogDescription>
      </DialogHeader>

      {action.dialog === "ship" ? (
        <>
          <Field label="Courier" error={message("courier")}>
            {(control) => (
              <Input {...control} autoComplete="off" autoFocus {...form.register("courier")} />
            )}
          </Field>
          <Field label="Tracking number" error={message("trackingNumber")}>
            {(control) => (
              <Input {...control} autoComplete="off" {...form.register("trackingNumber")} />
            )}
          </Field>
          <Field
            label="Tracking link (optional)"
            hint="A full link starting with http:// or https://"
            error={message("trackingUrl")}
          >
            {(control) => (
              <Input
                {...control}
                type="url"
                inputMode="url"
                autoComplete="off"
                {...form.register("trackingUrl")}
              />
            )}
          </Field>
        </>
      ) : null}

      {action.dialog === "cancel" ? (
        <>
          <p
            role="note"
            className="rounded-lg border border-amber-500/40 bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          >
            {CANCEL_WARNING}
          </p>
          <Field label="Reason for cancelling" error={message("reason")}>
            {(control) => <Textarea {...control} autoFocus {...form.register("reason")} />}
          </Field>
        </>
      ) : null}

      {action.dialog !== "cancel" ? (
        <Field label="Note (optional)" error={message("note")}>
          {(control) => (
            <Textarea
              {...control}
              autoFocus={action.dialog === "confirm"}
              {...form.register("note")}
            />
          )}
        </Field>
      ) : null}

      <FormAlert message={alert} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Keep order as it is
        </Button>
        <Button
          type="submit"
          variant={action.dialog === "cancel" ? "destructive" : "default"}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : action.label}
        </Button>
      </DialogFooter>
    </form>
  );
}
