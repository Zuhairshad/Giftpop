export interface TemplateRejection {
  /** Country code the design is not sellable in, when the API said which. */
  country: string | null;
  problems: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads the 422 `details` (`{ country, problems }`) into plain strings. Unknown shapes give null. */
export function readTemplateRejection(details: unknown): TemplateRejection | null {
  if (!isRecord(details) || !Array.isArray(details.problems)) return null;
  const problems = details.problems.flatMap((problem): string[] => {
    if (typeof problem === "string") return [problem];
    if (isRecord(problem) && typeof problem.message === "string") return [problem.message];
    return [];
  });
  if (problems.length === 0) return null;
  const country = typeof details.country === "string" ? details.country : null;
  return { country, problems };
}

/** The sentence for the form: which country failed, then each problem. */
export function describeRejection(
  rejection: TemplateRejection,
  countryName: (code: string) => string,
): string {
  const where = rejection.country
    ? `This gift cannot be sold in ${countryName(rejection.country)}`
    : "This gift cannot be sold in one of the chosen countries";
  return `${where}: ${rejection.problems.join(" ")} Remove that country or fix the design first.`;
}
