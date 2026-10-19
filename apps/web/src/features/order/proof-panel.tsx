"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import { validateProofFile } from "./proof-file";
import { describeUploadError, uploadProof } from "./proof-upload";
import { formatDate } from "./status-labels";
import { BUTTON_PRIMARY, CARD } from "./ui";

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
      <h2 id={`${uid}-heading`} className="font-display text-2xl font-bold">
        Send proof of payment
      </h2>
      <p className="text-muted text-sm">
        Paid by transfer? Upload a screenshot or photo of the receipt so we can find your payment.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-file`} className="block text-sm font-bold">
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
            className="border-border bg-surface rounded-soft block w-full max-w-full border-2 border-dashed p-3 text-sm file:bg-pink-soft file:text-foreground file:mr-3 file:rounded-full file:border-0 file:px-4 file:py-2 file:font-bold"
          />
          <p id={hintId} className="text-muted text-xs">
            PNG, JPEG or WebP, up to 5 MB.
          </p>
        </div>

        {chosen ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL, nothing to optimise
          <img
            src={chosen.url}
            alt={`Preview of ${chosen.file.name}`}
            className="border-border rounded-soft max-h-64 w-auto max-w-full border"
          />
        ) : null}

        <div aria-live="polite" id={errorId}>
          {error ? (
            <p className="text-pink-strong text-sm font-semibold wrap-anywhere">{error}</p>
          ) : null}
          {busy ? <p className="text-muted text-sm">Uploading your proof…</p> : null}
          {done ? (
            <p className="bg-mint text-foreground rounded-soft p-3 text-sm font-semibold">
              We have your proof. We will confirm your payment soon.
            </p>
          ) : null}
        </div>

        <button type="submit" disabled={!chosen || busy} className={BUTTON_PRIMARY}>
          {busy ? "Uploading…" : "Upload proof"}
        </button>
      </form>

      {proofs.length > 0 ? (
        <div>
          <h3 className="text-sm font-bold">Proofs you sent</h3>
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
