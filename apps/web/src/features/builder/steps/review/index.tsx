"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { ReactElement } from "react";

import { useBuilder, useStepGuard } from "../../state";

import { FromLoader } from "./from-loader";
import { INVALID_FROM_MESSAGE, readFromParam, unavailableNotice } from "./from-param";
import { ReviewScreen } from "./review-screen";

function ReviewStepContent(): ReactElement {
  const builder = useBuilder();
  const searchParams = useSearchParams();
  const [leftOutNotice, setLeftOutNotice] = useState<string | null>(null);

  // Does nothing while `?from=` is present; takes over once the loader removes it.
  useStepGuard("review");

  const from = readFromParam(searchParams.get("from"));
  if (from.kind !== "none") {
    return (
      <FromLoader
        country={builder.country}
        shareId={from.kind === "share" ? from.shareId : null}
        invalidMessage={INVALID_FROM_MESSAGE}
        onLoaded={(names) => setLeftOutNotice(unavailableNotice(names))}
      />
    );
  }

  return <ReviewScreen builder={builder} leftOutNotice={leftOutNotice} />;
}

/** Step 5: the gift, what is in it, the price for both payment modes, share and checkout. */
export function ReviewStep(): ReactElement {
  return (
    <Suspense fallback={<p role="status">Loading your gift&hellip;</p>}>
      <ReviewStepContent />
    </Suspense>
  );
}
