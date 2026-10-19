"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { FormAlert } from "../../../catalog/components/field";
import { describeActionError } from "../lib/action-errors";
import { reviewPaymentProof } from "../lib/client";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProofStatus = "pending" | "accepted" | "rejected";

const DONE_TEXT: Record<Exclude<ProofStatus, "pending">, string> = {
  accepted: "Proof accepted",
  rejected: "Proof rejected",
};

export function ProofReview({
  orderId,
  proofId,
  status,
}: {
  orderId: string;
  proofId: string;
  status: ProofStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const rejectRef = useRef<HTMLButtonElement>(null);

  if (status !== "pending") {
    return <span className="text-muted-foreground text-sm">{DONE_TEXT[status]}</span>;
  }

  async function review(next: "accepted" | "rejected") {
    setBusy(true);
    setError(undefined);
    try {
      await reviewPaymentProof(orderId, proofId, { status: next });
      toast.success(next === "accepted" ? "Proof accepted" : "Proof rejected");
      setConfirming(false);
      router.refresh();
    } catch (cause) {
      setError(describeActionError(cause).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => void review("accepted")}>
          Accept proof
        </Button>
        <Button
          ref={rejectRef}
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setError(undefined);
            setConfirming(true);
          }}
        >
          Reject proof
        </Button>
      </div>
      {!confirming ? <FormAlert message={error} /> : null}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent finalFocus={rejectRef}>
          <DialogHeader>
            <DialogTitle>Reject this proof?</DialogTitle>
            <DialogDescription>
              The order stays unpaid. The customer can upload another proof.
            </DialogDescription>
          </DialogHeader>
          <FormAlert message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              Keep proof
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void review("rejected")}
            >
              {busy ? "Saving..." : "Reject proof"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
