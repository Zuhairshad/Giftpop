"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import { validateProofFile } from "./proof-file";
import { describeUploadError, uploadProof } from "./proof-upload";
import { formatDate } from "./status-labels";
import { CARD, CARD_TITLE, FIELD_LABEL } from "./ui";

import { Button } from "@/components/ui";

type Proof = PublicOrderView["proofs"][number];

const PROOF_STATUS: Record<Proof["status"], string> = {
  pending: "Waiting for us to check",
  accepted: "Accepted",
  rejected: "Not accepted",
};

type ProofPanelProps = {
  number: string;
  contact: string;
  proofs: readonly Proof[];
  onUploaded: (proof: Proof) => void;
};

/** Upload a picture of the transfer, and see the proofs already sent. */
export function ProofPanel({ number, contact, proofs, onUploaded }: ProofPanelProps): ReactElement {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const urlRef = useRef<string | null>(null);

  // Object URLs hold the image in memory until revoked: revoke on replace, clear and unmount.
  function setPreview(next: File | null): void {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next ? URL.createObjectURL(next) : null;
    setChosen(next && urlRef.current ? { file: next, url: urlRef.current } : null);
  }

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function onChange(event: ChangeEvent<HTMLInputElement>): void {
    const picked = event.target.files?.[0] ?? null;
    setDone(false);
    if (!picked) {
      setPreview(null);
      setError(null);
      return;
    }
    const check = validateProofFile(picked);
    if (!check.ok) {
      setPreview(null);
      setError(check.message);
      event.target.value = "";
      return;
    }
    setError(null);
    setPreview(picked);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!chosen || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { proof } = await uploadProof({ number, contact, file: chosen.file });
      onUploaded({ uploadedAt: proof.uploadedAt, status: proof.status });
      setDone(true);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (failure) {
      setError(describeUploadError(failure));
    } finally {
      setBusy(false);
    }
  }

  const errorId = `${uid}-error`;
  const hintId = `${uid}-hint`;

  return (
    <section aria-labelledby={`${uid}-heading`} className={`${CARD} space-y-4`}>
      <h2 id={`${uid}-heading`} className={CARD_TITLE}>
        Send proof of payment
      </h2>
      <p className="text-sm text-muted">
        Paid by transfer? Upload a screenshot or photo of the receipt so we can find your payment.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-file`} className={FIELD_LABEL}>
            Picture of your receipt
          </label>
          <input
            ref={inputRef}
            id={`${uid}-file`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onChange}
            disabled={busy}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            aria-invalid={error ? true : undefined}
            className="block min-h-12 w-full max-w-full rounded-md border-2 border-dashed border-border-strong bg-warm p-3 text-sm file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-surface file:px-4 file:py-2 file:font-semibold file:text-foreground file:shadow-hairline"
          />
          <p id={hintId} className="text-xs text-muted">
            PNG, JPEG or WebP, up to 5 MB.
          </p>
        </div>

        {chosen ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL, nothing to optimise
          <img
            src={chosen.url}
            alt={`Preview of ${chosen.file.name}`}
            className="max-h-64 w-auto max-w-full rounded-md shadow-hairline"
          />
        ) : null}

        <div aria-live="polite" id={errorId}>
          {error ? (
            <p className="text-sm font-semibold text-danger wrap-anywhere">{error}</p>
          ) : null}
          {busy ? <p className="text-sm text-muted">Uploading your proof…</p> : null}
          {done ? (
            <p className="rounded-md bg-success-tint p-3 text-sm font-semibold text-success">
              We have your proof. We will confirm your payment soon.
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={!chosen || busy} block className="sm:w-auto">
          {busy ? "Uploading…" : "Upload proof"}
        </Button>
      </form>

      {proofs.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold">Proofs you sent</h3>
          <ul className="mt-1.5 space-y-1">
            {proofs.map((proof, index) => (
              <li
                key={`${proof.uploadedAt}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm"
              >
                <span>{formatDate(proof.uploadedAt)}</span>
                <span className="font-semibold">{PROOF_STATUS[proof.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
