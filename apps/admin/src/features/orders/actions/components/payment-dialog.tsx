"use client";

import { PaymentMethodSchema, PaymentRecordKindSchema } from "@giftpop/contracts";
import type { AdminOrderDetail, PaymentMethod, PaymentRecordKind } from "@giftpop/contracts";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Field, FormAlert } from "../../../catalog/components/field";
import { describeActionError } from "../lib/action-errors";
import {
  defaultPaymentKind,
  paymentBlockedReason,
  remainingDueMinor,
  suggestedAmountInput,
} from "../lib/amount";
import { recordOrderPayment } from "../lib/client";
import { defaultPaymentMethod, validatePaymentForm } from "../lib/payment-request";
import type { PaymentFieldName, PaymentFormValues } from "../lib/payment-request";

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

export function RecordPayment({ order }: { order: AdminOrderDetail }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const blocked = paymentBlockedReason(order);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        disabled={blocked !== null}
        aria-describedby={blocked ? "payment-blocked" : undefined}
        onClick={() => setOpen(true)}
      >
        Record payment
      </Button>
      {blocked ? (
        <span id="payment-blocked" className="text-muted-foreground text-xs">
          {blocked}
        </span>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto" finalFocus={triggerRef}>
          {open ? <PaymentForm order={order} onDone={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
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

function PaymentForm({ order, onDone }: { order: AdminOrderDetail; onDone: () => void }) {
  const router = useRouter();
  const { currency } = order.quote;
  const resolver: Resolver<PaymentFormValues> = (values) => {
    const result = validatePaymentForm(order, values);
    if (result.ok) return { values, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const [name, message] of Object.entries(result.errors)) {
      errors[name] = { type: "validate", message };
    }
    return { values: {}, errors };
  };
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
      onDone();
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
                <Select
                  items={KIND_ITEMS}
                  value={field.value}
                  onValueChange={(value) => {
                    if (!value) return;
                    field.onChange(value);
                    if (!form.formState.dirtyFields.amount) {
                      form.setValue(
                        "amount",
                        suggestedAmountInput(order, value as PaymentRecordKind),
                      );
                    }
                  }}
                >
                  <SelectTrigger id={control.id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  items={METHOD_ITEMS}
                  value={field.value}
                  onValueChange={(value) => value && field.onChange(value)}
                >
                  <SelectTrigger id={control.id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Record payment"}
        </Button>
      </DialogFooter>
    </form>
  );
}
