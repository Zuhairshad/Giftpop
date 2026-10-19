"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { useBuilder, useStepGuard } from "../../state";

import { ItemsView } from "./items-view";

/** Step 2: pick items for the chosen format, then go on to arrange them. */
export function ItemsStep(): ReactElement {
  useStepGuard("items");
  const builder = useBuilder();
  const router = useRouter();
  return <ItemsView builder={builder} navigate={(href) => router.push(href)} />;
}
