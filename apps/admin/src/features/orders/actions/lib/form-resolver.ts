import type { FieldError, FieldErrors, FieldValues, Resolver } from "react-hook-form";

type FormValidation = { ok: true } | { ok: false; errors: Partial<Record<string, string>> };

/** A react-hook-form resolver from a validator that answers `{ ok }` or per-field messages. */
export function validationResolver<T extends FieldValues>(
  validate: (values: T) => FormValidation,
): Resolver<T> {
  return (values) => {
    const result = validate(values);
    if (result.ok) return { values, errors: {} };
    const errors: Record<string, FieldError> = {};
    for (const [name, message] of Object.entries(result.errors)) {
      if (message !== undefined) errors[name] = { type: "validate", message };
    }
    // The validator names only fields of T, which TypeScript cannot see through the generic.
    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
