"use client";

import type { CountryCode } from "@giftpop/contracts";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { TemplateCardModel } from "@/features/home/view-models";

/** Server-loaded data the question bodies need besides the catalog (which lives in the builder store). */
export interface QuestionData {
  country: CountryCode;
  /** From the country document, never hard-coded. */
  countryName: string;
  /** Featured templates for this country, shown in the first question. Empty when none or on API failure. */
  templates: readonly TemplateCardModel[];
}

const QuestionDataContext = createContext<QuestionData | null>(null);

/** The shell slice mounts this around the question surface; the contents slice reads it. */
export function QuestionDataProvider({
  value,
  children,
}: {
  value: QuestionData;
  children: ReactNode;
}) {
  return <QuestionDataContext.Provider value={value}>{children}</QuestionDataContext.Provider>;
}

export function useQuestionData(): QuestionData {
  const value = useContext(QuestionDataContext);
  if (value === null)
    throw new Error("useQuestionData must be used inside <QuestionDataProvider>.");
  return value;
}
