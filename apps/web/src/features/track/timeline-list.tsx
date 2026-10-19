import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { buildTimeline } from "./timeline";
import type { TimelineStep } from "./timeline";

import { statusTone } from "@/features/order/status-labels";
import { CARD, CARD_TITLE, META_LABEL } from "@/features/order/ui";

function Marker({ step, last }: { step: TimelineStep; last: boolean }): ReactElement {
  return (
    <div aria-hidden="true" className="flex shrink-0 flex-col items-center">
      {step.current ? (
        <span
          className={`${statusTone(step.status)} grid size-7 place-items-center rounded-full shadow-hairline`}
        >
          <span className="size-2.5 rounded-full bg-current" />
        </span>
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-success-tint text-success">
          <svg
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3.5 8.5l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {last ? null : <span className="mt-1 w-px flex-1 bg-border-strong" />}
    </div>
  );
}

export function TimelineList({
  view,
}: {
  view: Pick<PublicOrderView, "history" | "status" | "createdAt">;
}): ReactElement {
  const steps = buildTimeline(view);
  return (
    <section aria-labelledby="timeline-heading" className={CARD}>
      <h2 id="timeline-heading" className={CARD_TITLE}>
        Progress
      </h2>
      <ol className="mt-5">
        {steps.map((step, index) => (
          <li
            key={step.key}
            aria-current={step.current ? "step" : undefined}
            className="flex gap-4"
          >
            <Marker step={step} last={index === steps.length - 1} />
            <div className={`min-w-0 ${index === steps.length - 1 ? "" : "pb-6"}`}>
              <p
                className={`wrap-anywhere ${step.current ? "text-lg font-bold" : "font-semibold text-muted"}`}
              >
                {step.label}
                {step.current ? <span className="sr-only"> (current status)</span> : null}
              </p>
              <p className={META_LABEL}>{step.date}</p>
              {step.current ? <p className="mt-1 text-sm">{step.hint}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
