"use client";

import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { coloursReady } from "./can-continue";
import { SwatchGroup } from "./colours/swatch-group";

/** Question 2 body: wrapper and ribbon colours. The overview recolours as soon as one is picked. */
export function ColoursBody(): ReactElement {
  const builder = useBuilder();
  const { packaging } = builder;

  if (!packaging) {
    return <p className="text-muted text-sm">Pick what your gift comes in first.</p>;
  }

  return (
    <div className="space-y-5">
      <SwatchGroup
        label="Wrapper"
        options={packaging.wrapperColors}
        value={builder.wrapperColor}
        onChange={builder.setWrapperColor}
      />
      <SwatchGroup
        label="Ribbon"
        options={packaging.ribbonColors}
        value={builder.ribbonColor}
        onChange={builder.setRibbonColor}
      />
    </div>
  );
}

/** Both colours are chosen (the store defaults each to the packaging's first colour). */
export function useColoursCanContinue(): boolean {
  return coloursReady(useBuilder());
}
