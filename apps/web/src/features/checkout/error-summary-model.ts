import { FIELD_ORDER, fieldId } from "./fields";
import type { FieldErrors, FieldName } from "./fields";

export interface ErrorSummaryEntry {
  field: FieldName;
  /** The field's visible label, or null if the form does not show it under a label. */
  label: string | null;
  message: string;
  href: string;
}

/** One entry per field with an error, in the order the form shows them (audit L2). */
export function errorSummaryEntries(
  errors: FieldErrors,
  labels: Partial<Record<FieldName, string>>,
): ErrorSummaryEntry[] {
  return FIELD_ORDER.flatMap((field) => {
    const message = errors[field];
    if (message === undefined) return [];
    return [{ field, label: labels[field] ?? null, message, href: `#${fieldId(field)}` }];
  });
}

export function summaryHeading(count: number): string {
  return count === 1 ? "1 field needs attention" : `${count} fields need attention`;
}
