"use client";

import { LazyMotion, domAnimation } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import type { ReactElement } from "react";

import { useBuilder } from "../state";
import { useBuilderStore } from "../state/context";
import { FromLoader } from "../steps/review/from-loader";
import { INVALID_FROM_MESSAGE, readFromParam, unavailableNotice } from "../steps/review/from-param";

import { setNotice } from "./notice-store";
import { Overview } from "./overview";
import { QuestionSurface } from "./question-surface";
import { startTracking, trackQuestion } from "./transitions";
import type { QuestionTracking } from "./transitions";

/** While a shared gift or template loads (or fails to), it takes the place of the question surface. */
function FromLoading({ from, onDone }: { from: string; onDone: () => void }): ReactElement {
  const { country, goToQuestion } = useBuilder();
  const param = readFromParam(from);
  return (
    <div className="bg-surface shadow-float relative rounded-t-lg px-4 pb-6 min-[900px]:mr-10 min-[900px]:w-[460px] min-[900px]:self-center min-[900px]:rounded-lg">
      <FromLoader
        country={country}
        shareId={param.kind === "share" ? param.shareId : null}
        invalidMessage={INVALID_FROM_MESSAGE}
        onLoaded={(names) => {
          setNotice(unavailableNotice(names));
          goToQuestion("review");
          onDone();
        }}
      />
    </div>
  );
}

/**
 * The whole builder on one route: the live overview of the gift, and the current question in a bottom
 * sheet (phones) or a floating card (900px and up). `from` is the raw `?from=` value, or null.
 */
export function BuilderShell({ from }: { from: string | null }): ReactElement {
  const store = useBuilderStore();
  const { question } = useBuilder();
  const hydrated = useSyncExternalStore(store.subscribe, store.isHydrated, () => false);
  const [loaded, setLoaded] = useState(false);

  // Which way the visitor moved. Derived while rendering, so the new question and its direction arrive together.
  const [tracking, setTracking] = useState<QuestionTracking>(() =>
    startTracking(question, hydrated),
  );
  let current = tracking;
  if (tracking.question !== question || tracking.hydrated !== hydrated) {
    current = trackQuestion(tracking, question, hydrated);
    setTracking(current);
  }

  const loading = from !== null && !loaded;
  return (
    <LazyMotion features={domAnimation} strict>
      <div
        data-viewport-fit="builder"
        className="bg-background relative flex h-full min-h-0 w-full flex-col min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_auto] min-[900px]:grid-rows-[minmax(0,1fr)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_38%_55%,var(--gp-pool-pink),transparent_72%)] opacity-[var(--gp-pool-opacity)]"
        />
        <Overview />
        {loading ? (
          <FromLoading from={from} onDone={() => setLoaded(true)} />
        ) : (
          <QuestionSurface tracking={current} />
        )}
      </div>
    </LazyMotion>
  );
}
