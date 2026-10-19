import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { buildTimeline } from "./timeline";

import { CARD } from "@/features/order/ui";

export function TimelineList({
  view,
}: {
  view: Pick<PublicOrderView, "history" | "status" | "createdAt">;
}): ReactElement {
  const steps = buildTimeline(view);
  return (
    <section aria-labelledby="timeline-heading" className={CARD}>
      <h2 id="timeline-heading" className="font-display text-2xl font-bold">
        Progress
      </h2>
      <ol className="mt-3 space-y-3">
        {steps.map((step) => (
          <li
            key={step.key}
            aria-current={step.current ? "step" : undefined}
            className={`rounded-soft flex gap-3 p-3 ${step.current ? "bg-pink-soft" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`mt-1.5 size-3 shrink-0 rounded-full ${step.current ? "bg-pink" : "bg-border"}`}
            />
            <div className="min-w-0">
              <p className={`wrap-anywhere ${step.current ? "font-bold" : "font-semibold"}`}>
                {step.label}
                {step.current ? <span className="sr-only"> (current status)</span> : null}
              </p>
              <p className="text-muted text-sm">{step.date}</p>
              {step.current ? <p className="text-sm">{step.hint}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
