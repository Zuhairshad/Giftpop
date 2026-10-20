import { isApiError } from "@/lib/api";

export interface ActionError {
  /** One plain sentence for the alert inside the dialog. Never raw API text. */
  message: string;
  /** Errors to put on named form fields (form field names, not API names). */
  fields: { path: string; message: string }[];
}

export const CONFLICT_MESSAGE =
  "This order was changed by someone else or cannot move there: refresh and try again";

/** API field name -> [form field name, message]. */
const FIELD_MAP: Record<string, readonly [string, string]> = {
  courier: ["courier", "Enter the courier's name"],
  trackingNumber: ["trackingNumber", "Enter the tracking number"],
  trackingUrl: ["trackingUrl", "Enter a full link starting with http:// or https://"],
  reason: ["reason", "Say why this order is being cancelled"],
  note: ["note", "Check the note"],
  amountMinor: ["amount", "That amount is not valid"],
  reference: ["reference", "Check the reference"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function apiFieldNames(details: unknown): string[] {
  if (!isRecord(details)) return [];
  const names: string[] = [];
  if (Array.isArray(details.missing)) {
    for (const name of details.missing) if (typeof name === "string") names.push(name);
  }
  const issues = Array.isArray(details.issues) ? details.issues : [];
  for (const issue of issues) {
    if (isRecord(issue) && Array.isArray(issue.path) && typeof issue.path[0] === "string") {
      names.push(issue.path[0]);
    }
  }
  return names;
}

/** Turns any thrown value into plain wording and field errors. Never shows the API's own text. */
export function describeActionError(error: unknown): ActionError {
  if (!isApiError(error)) return { message: "Something went wrong. Try again.", fields: [] };
  switch (error.status) {
    case 0:
      return {
        message: "Could not reach the server. Check your connection and try again.",
        fields: [],
      };
    case 401:
      return { message: "Your session has ended. Sign in again.", fields: [] };
    case 403:
      return { message: "Your account is not allowed to do this.", fields: [] };
    case 404:
      return { message: "This order could not be found. Refresh the page.", fields: [] };
    case 409:
      return { message: CONFLICT_MESSAGE, fields: [] };
    case 400:
    case 422: {
      if (error.code === "PAYMENT_REQUIRED") {
        return {
          message:
            "Record the payment first (Record payment, on this page). An order is confirmed once the advance is recorded.",
          fields: [],
        };
      }
      const seen = new Set<string>();
      const fields: ActionError["fields"] = [];
      for (const name of apiFieldNames(error.details)) {
        const mapped = FIELD_MAP[name];
        if (!mapped || seen.has(mapped[0])) continue;
        seen.add(mapped[0]);
        fields.push({ path: mapped[0], message: mapped[1] });
      }
      return {
        message:
          fields.length > 0
            ? "Check the highlighted fields and try again."
            : "The server did not accept these details. Check them and try again.",
        fields,
      };
    }
    default:
      return { message: "Something went wrong. Try again.", fields: [] };
  }
}
