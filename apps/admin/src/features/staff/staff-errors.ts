import { isApiError } from "@/lib/api";

/** Plain-language message for a failed staff call. `action` completes "Could not ...". */
export function staffErrorMessage(error: unknown, action: string): string {
  if (isApiError(error)) {
    if (error.code === "NETWORK_ERROR" || error.status === 0) {
      return "Could not reach the server. Check your connection and try again.";
    }
    if (error.status === 401) return "Your session ended. Sign in again.";
    if (error.status === 403) return "Only the owner can manage staff.";
    if (error.status === 409) return "A staff member with this email already exists.";
    if (error.status === 400 || error.status === 422) return error.message;
  }
  return `Could not ${action}. Try again.`;
}
