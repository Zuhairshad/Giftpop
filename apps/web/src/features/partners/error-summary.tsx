import type { PartnerRequestKind } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { ErrorIcon } from "./controls";
import { FIELD_LABELS, fieldsFor, partnerFieldId } from "./fields";
import type { PartnerFieldErrors } from "./fields";

/** Lists every field that needs another look, each one a link to the field. */
export function ErrorSummary({
  kind,
  errors,
}: {
  kind: PartnerRequestKind;
  errors: PartnerFieldErrors;
}): ReactElement | null {
  const names = fieldsFor(kind).filter((name) => errors[name] !== undefined);
  if (names.length === 0) return null;
  return (
    <div role="alert" className="bg-warm border-danger min-w-0 rounded-md border-2 p-4">
      <p className="text-danger flex items-start gap-1.5 font-semibold">
        <ErrorIcon />
        Some details need another look
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {names.map((name) => (
          <li
            key={name}
            className="flex min-h-11 min-w-0 flex-wrap items-center gap-x-1 wrap-anywhere"
          >
            <a
              href={`#${partnerFieldId(kind, name)}`}
              onClick={(event) => {
                // A hash link scrolls but does not focus an input: move focus ourselves.
                event.preventDefault();
                document.getElementById(partnerFieldId(kind, name))?.focus();
              }}
              className="text-foreground font-semibold underline underline-offset-4"
            >
              {FIELD_LABELS[name]}
            </a>
            <span className="text-muted min-w-0">{errors[name]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
