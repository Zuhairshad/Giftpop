"use client";

import { useIsPresent } from "motion/react";
import { createElement, useEffect, useEffectEvent, useRef } from "react";
import type { ReactElement } from "react";

import { useQuestionBody } from "../questions/body-loader";
import type { QuestionId } from "../questions/ids";
import { getQuestion } from "../questions/registry";

import { BodySkeleton } from "./body-skeleton";
import { questionProgress } from "./progress-model";
import { BOTTOM_FADE_CLASS, useBottomFade } from "./use-bottom-fade";

import { cn } from "@/lib/cn";

interface LayerContentProps {
  question: QuestionId;
  /** Move focus to the title when this layer appears after the visitor moved. */
  focusOnMount: boolean;
  /** The height this layer needs to show everything (title and body), in px. */
  onNaturalHeight: (height: number) => void;
}

/** The question's body once its chunk is here, a skeleton until then. */
function QuestionBody({ question }: { question: QuestionId }): ReactElement {
  const body = useQuestionBody(question);
  // `body` is a module-level component from the registry, never one made during render.
  return body ? createElement(body) : <BodySkeleton />;
}

/** One question: its title and its body. The body scrolls inside the surface when it is taller than the space. */
export function LayerContent({
  question,
  focusOnMount,
  onNaturalHeight,
}: LayerContentProps): ReactElement {
  const { title } = getQuestion(question);
  const isPresent = useIsPresent();
  const titleBlock = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(focusOnMount);
  const { ref: scroller, fade, onScroll } = useBottomFade<HTMLDivElement>(body);
  // Always the latest callback, without restarting the observer when it changes.
  const report = useEffectEvent(onNaturalHeight);

  useEffect(() => {
    if (shouldFocus.current) titleRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const head = titleBlock.current;
    const content = body.current;
    if (!head || !content || !isPresent) return;
    const measure = () => report(head.offsetHeight + content.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(head);
    observer.observe(content);
    return () => observer.disconnect();
  }, [isPresent]);

  return (
    // A leaving layer is inert, so focus and the screen reader move on to the new question.
    <div inert={!isPresent} className="flex h-full min-h-0 flex-col">
      <div
        ref={titleBlock}
        className="flex shrink-0 items-baseline justify-between gap-2 px-4 pt-3 pb-2 min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:gap-0 min-[900px]:px-6 min-[900px]:pt-3"
      >
        <p
          aria-hidden="true"
          className="font-script text-foreground order-2 shrink-0 text-xl leading-none min-[900px]:order-none min-[900px]:text-[22px]"
        >
          {questionProgress(question).label}
        </p>
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-foreground text-[22px] leading-tight font-bold tracking-[-0.035em] wrap-anywhere min-[900px]:mt-1.5 min-[900px]:text-[30px]"
        >
          {title}
        </h2>
      </div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 min-[900px]:px-6",
          fade && BOTTOM_FADE_CLASS,
        )}
      >
        <div ref={body} className="pb-2">
          <QuestionBody question={question} />
        </div>
      </div>
    </div>
  );
}
