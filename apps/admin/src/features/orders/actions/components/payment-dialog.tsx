"use client";

import type { AdminOrderDetail } from "@giftpop/contracts";
import { useRef, useState } from "react";

import { paymentBlockedReason } from "../lib/amount";
import { paymentHeading } from "../lib/focus";

import { PaymentForm } from "./payment-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function RecordPayment({ order }: { order: AdminOrderDetail }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const recordedRef = useRef(false);
  const [announcement, setAnnouncement] = useState("");
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
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[92dvh] overflow-y-auto"
          // The trigger is disabled once the order is paid, so after a recorded payment focus goes
          // to the Payment heading, which stays on the page.
          finalFocus={() => (recordedRef.current ? paymentHeading() : triggerRef.current)}
        >
          {open ? (
            <PaymentForm
              order={order}
              onDone={(recorded) => {
                if (recorded) {
                  recordedRef.current = true;
                  setAnnouncement("Payment recorded. The payment section is up to date.");
                }
                setOpen(false);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
