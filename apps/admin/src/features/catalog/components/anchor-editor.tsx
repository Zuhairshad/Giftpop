"use client";

import type { Asset } from "@giftpop/contracts";
import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import {
  anchorToPercent,
  DEFAULT_ANCHOR,
  fromPercentValue,
  isArrowKey,
  nudgeAnchor,
  pointerToAnchor,
  toPercentValue,
} from "../lib/anchor";
import type { Anchor } from "../lib/anchor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_PREVIEW_HEIGHT_PX = 320;

interface AnchorEditorProps {
  asset: Asset;
  onChange: (anchor: Anchor) => void;
}

/**
 * The image with a marker where it sits in a slot. Drag the marker, click the image,
 * or focus the marker and use the arrow keys (Shift for bigger steps).
 */
export function AnchorEditor({ asset, onChange }: AnchorEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const { anchor } = asset;
  const ratio = asset.width / asset.height;

  function moveTo(event: PointerEvent<HTMLDivElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (rect) onChange(pointerToAnchor(event, rect));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    moveTo(event);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragging) moveTo(event);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isArrowKey(event.key)) return;
    event.preventDefault();
    onChange(nudgeAnchor(anchor, event.key, event.shiftKey));
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div
        ref={frameRef}
        data-testid="anchor-frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="border-input relative mx-auto touch-none overflow-hidden rounded-lg border bg-[length:16px_16px] bg-[conic-gradient(#e5e5e5_25%,#fafafa_0_50%,#e5e5e5_0_75%,#fafafa_0)] select-none dark:bg-[conic-gradient(#2a2a2a_25%,#1c1c1c_0_50%,#2a2a2a_0_75%,#1c1c1c_0)]"
        style={{
          aspectRatio: ratio,
          width: `min(100%, ${Math.round(MAX_PREVIEW_HEIGHT_PX * ratio)}px)`,
          cursor: dragging ? "grabbing" : "crosshair",
        }}
      >
        <img
          src={asset.url}
          alt="Uploaded image"
          draggable={false}
          className="pointer-events-none absolute inset-0 size-full object-fill"
        />
        <button
          type="button"
          onKeyDown={onKeyDown}
          aria-label="Anchor point. Drag it, or use the arrow keys to move it. Hold Shift to move further."
          className="border-background bg-primary ring-ring/60 focus-visible:ring-ring absolute size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 shadow ring-2 outline-none focus-visible:ring-4"
          style={anchorToPercent(anchor)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <PercentField
          label="Anchor across (%)"
          value={toPercentValue(anchor.x)}
          onChange={(percent) => onChange({ ...anchor, x: fromPercentValue(percent) })}
        />
        <PercentField
          label="Anchor down (%)"
          value={toPercentValue(anchor.y)}
          onChange={(percent) => onChange({ ...anchor, y: fromPercentValue(percent) })}
        />
        <Button type="button" variant="outline" onClick={() => onChange({ ...DEFAULT_ANCHOR })}>
          Reset to bottom centre
        </Button>
      </div>
      <p className="text-muted-foreground text-xs" aria-live="polite">
        The anchor is the point of the image that sits in the gift slot. Now at{" "}
        {toPercentValue(anchor.x)}% across and {toPercentValue(anchor.y)}% down.
      </p>
    </div>
  );
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (percent: number) => void;
}) {
  const id = `anchor-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="grid w-32 gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (!Number.isNaN(next)) onChange(next);
        }}
      />
    </div>
  );
}
