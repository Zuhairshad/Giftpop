"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";

import { LayerContent } from "./layer-content";
import { layerVariants } from "./layer-variants";
import type { LayerCustom } from "./layer-variants";
import { NoticeBanner } from "./notice-banner";
import { ProgressBar } from "./progress-bar";
import { QuestionFooter } from "./question-footer";
import type { QuestionTracking } from "./transitions";
import { useBlockHeight } from "./use-block-height";

import { SPRING } from "@/styles/motion";

/**
 * The question surface: a bottom sheet that hugs its content on phones (below 900px), a floating card
 * beside the overview on desktop. Its height follows the question with the same spring that moves the
 * content, and the body scrolls inside it when there is not enough room.
 */
export function QuestionSurface({ tracking }: { tracking: QuestionTracking }): ReactElement {
  const { question, direction, moved } = tracking;
  const reduced = useReducedMotion() ?? false;
  const variants = useMemo(() => layerVariants(reduced), [reduced]);
  const custom: LayerCustom = { direction, instant: !moved };

  const top = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLDivElement>(null);
  const topHeight = useBlockHeight(top);
  const footerHeight = useBlockHeight(footer);
  const [natural, setNatural] = useState<{ question: string; height: number } | null>(null);
  const layerHeight = natural?.question === question ? natural.height : 0;
  const total =
    topHeight > 0 && footerHeight > 0 && layerHeight > 0
      ? topHeight + layerHeight + footerHeight
      : 0;

  return (
    <m.section
      aria-label="Gift question"
      initial={false}
      animate={total > 0 ? { height: total } : undefined}
      transition={reduced ? { duration: 0 } : SPRING.question}
      className="bg-surface shadow-float relative flex max-h-[58dvh] min-h-0 min-w-0 flex-col overflow-hidden rounded-t-lg min-[900px]:mr-10 min-[900px]:max-h-[calc(100%-1.75rem)] min-[900px]:w-[460px] min-[900px]:self-center min-[900px]:rounded-lg"
    >
      <div ref={top} className="shrink-0 px-4 pt-2 min-[900px]:px-6 min-[900px]:pt-5">
        <div
          aria-hidden="true"
          className="bg-border-strong mx-auto mb-3 h-1 w-10 rounded-full min-[900px]:hidden"
        />
        <NoticeBanner />
        <ProgressBar question={question} />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={custom}>
          <m.div
            key={question}
            custom={custom}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-full min-h-0"
          >
            <LayerContent
              question={question}
              focusOnMount={moved}
              onNaturalHeight={(height) => setNatural({ question, height })}
            />
          </m.div>
        </AnimatePresence>
      </div>
      <div ref={footer} className="shrink-0">
        <QuestionFooter key={question} question={question} />
      </div>
    </m.section>
  );
}
