"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { useBuilder, useStepGuard } from "../../state";

import { FormatView } from "./format-view";

/** Step 1: pick a packaging, then go on to the items. */
export function FormatStep(): ReactElement {
  useStepGuard("format");
  const builder = useBuilder();
  const router = useRouter();
  return <FormatView builder={builder} navigate={(href) => router.push(href)} />;
}
