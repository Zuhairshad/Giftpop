"use client";

import { PaymentMethodSchema, PaymentRecordKindSchema } from "@giftpop/contracts";
import type { AdminOrderDetail, PaymentMethod, PaymentRecordKind } from "@giftpop/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field, FormAlert } from "../../../catalog/components/field";
import { describeActionError } from "../lib/action-errors";
import { defaultPaymentKind, remainingDueMinor, suggestedAmountInput } from "../lib/amount";
import { recordOrderPayment } from "../lib/client";
import { validationResolver } from "../lib/form-resolver";
import { defaultPaymentMethod, validatePaymentForm } from "../lib/payment-request";
import type { PaymentFieldName, PaymentFormValues } from "../lib/payment-request";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";

const KIND_LABELS: Record<PaymentRecordKind, string> = {
  advance: "Advance",
  full: "Full payment",
  balance: "Balance",
  refund: "Refund",
};
const METHOD_LABELS: Record<PaymentMethod, string> = {
  manual_transfer: "Bank transfer",
  cod: "Cash on delivery",
  card: "Card",
};

const KIND_ITEMS = PaymentRecordKindSchema.options.map((value) => ({
  value,
  label: KIND_LABELS[value],
}));
const METHOD_ITEMS = PaymentMethodSchema.options.map((value) => ({
  value,
  label: METHOD_LABELS[value],
}));

/** A full-width select over fixed `{ value, label }` items; an empty choice is ignored. */
function ChoiceSelect<T extends string>({
  id,
  items,
  value,
  onChange,
}: {
  id: string;
  items: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function initialValues(order: AdminOrderDetail): PaymentFormValues {
  const kind = defaultPaymentKind(order);
  return {
    amount: suggestedAmountInput(order, kind),
    kind,
    method: defaultPaymentMethod(order, kind),
    reference: "",
    note: "",
  };
}

export function PaymentForm({
  order,
  onDone,
}: {
  order: AdminOrderDetail;
  onDone: (recorded: boolean) => void;
}) {
  const router = useRouter();
  const { currency } = order.quote;
  const resolver = validationResolver<PaymentFormValues>((values) =>
    validatePaymentForm(order, values),
  );
  const form = useForm<PaymentFormValues>({ resolver, defaultValues: initialValues(order) });
  const [alert, setAlert] = useState<string>();
  const { errors, isSubmitting } = form.formState;
  const message = (name: PaymentFieldName) => errors[name]?.message;
  const remaining = remainingDueMinor(order);

  async function onSubmit(values: PaymentFormValues) {
    setAlert(undefined);
    const result = validatePaymentForm(order, values);
    if (!result.ok) return;
    try {
      await recordOrderPayment(order.id, result.request);
      toast.success("Payment recorded");
      onDone(true);
      router.refresh();
    } catch (error) {
      const described = describeActionError(error);
      for (const field of described.fields) {
        form.setError(field.path as PaymentFieldName, { type: "server", message: field.message });
      }
      setAlert(described.message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-4">
      <DialogHeader>
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          Money you have received for order {order.number}, in {currency}.
        </DialogDescription>
      </DialogHeader>

      <Field
        label={`Amount received (${currency})`}
        hint={`Still due: ${formatMoney(remaining, currency)} of ${formatMoney(order.quote.totalMinor, currency)}`}
        error={message("amount")}
      >
        {(control) => (
          <Input
            {...control}
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            {...form.register("amount")}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Kind">
          {(control) => (
            <Controller
              control={form.control}
              name="kind"
              render={({ field }) => (
                <ChoiceSelect
                  id={control.id}
                  items={KIND_ITEMS}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    if (!form.formState.dirtyFields.amount) {
                      form.setValue("amount", suggestedAmountInput(order, value));
                    }
                  }}
                />
              )}
            />
          )}
        </Field>
        <Field label="Method">
          {(control) => (
            <Controller
              control={form.control}
              name="method"
              render={({ field }) => (
                <ChoiceSelect
                  id={control.id}
                  items={METHOD_ITEMS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}
        </Field>
      </div>

      <Field
        label="Reference (optional)"
        hint="Transfer number or receipt code"
        error={message("reference")}
      >
        {(control) => <Input {...control} autoComplete="off" {...form.register("reference")} />}
      </Field>
      <Field label="Note (optional)" error={message("note")}>
        {(control) => <Textarea {...control} {...form.register("note")} />}
      </Field>

      <FormAlert message={alert} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onDone(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Record payment"}
        </Button>
      </DialogFooter>
    </form>
  );
}
