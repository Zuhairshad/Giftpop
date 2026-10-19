"use client";

import { useId, useRef, useState } from "react";


import { uploadAsset } from "../api/client";
import { readApiError } from "../lib/api-errors";
import { draftFromUpload, moveAnchor } from "../lib/image-draft";
import type { ImageDraft } from "../lib/image-draft";
import { IMAGE_ACCEPT, imageFileProblem } from "../lib/image-file";

import { AnchorEditor } from "./anchor-editor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploaderProps {
  label: string;
  value: ImageDraft | undefined;
  onChange: (next: ImageDraft | undefined) => void;
  /** Show the draggable anchor marker. Item images need it; packaging layers do not. */
  withAnchor?: boolean;
  hint?: string;
}

/** Uploads one image to the API and shows what came back. */
export function ImageUploader({
  label,
  value,
  onChange,
  withAnchor = false,
  hint,
}: ImageUploaderProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setProblem(undefined);
    const rejected = imageFileProblem(file);
    if (rejected) {
      setProblem(rejected);
      return;
    }
    setBusy(true);
    try {
      onChange(draftFromUpload(await uploadAsset(file)));
    } catch (error) {
      setProblem(readApiError(error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid grid-cols-1 content-start gap-3">
      <div className="grid grid-cols-1 gap-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={IMAGE_ACCEPT}
            disabled={busy}
            aria-invalid={Boolean(problem)}
            aria-describedby={problem ? errorId : undefined}
            onChange={(event) => void onFile(event.target.files?.[0])}
            className="max-w-xs cursor-pointer"
          />
          {value ? (
            <Button type="button" variant="outline" onClick={() => onChange(undefined)}>
              Remove image
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {busy ? "Uploading..." : (hint ?? "PNG, WebP or JPEG with a transparent background.")}
        </p>
        {problem ? (
          <p id={errorId} role="alert" className="text-destructive text-sm">
            {problem}
          </p>
        ) : null}
      </div>

      {value && withAnchor ? (
        <AnchorEditor
          asset={value.asset}
          onChange={(anchor) => onChange(moveAnchor(value, anchor))}
        />
      ) : null}
      {value && !withAnchor ? (
        <div className="border-input bg-muted/40 w-32 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded asset at an arbitrary URL */}
          <img src={value.asset.url} alt={`${label} thumbnail`} className="block h-auto w-full" />
        </div>
      ) : null}
    </div>
  );
}
