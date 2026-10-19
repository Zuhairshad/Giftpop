/**
 * Errors show on submit, and on blur only for a field the visitor has typed in (or after a failed
 * submit). Tabbing through an empty form must not mark every required field invalid.
 */
export function shouldValidateOnBlur(edited: boolean, submitAttempted: boolean): boolean {
  return edited || submitAttempted;
}
