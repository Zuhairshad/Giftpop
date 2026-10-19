import { isApiError } from "@/lib/api";

/** Plain-language message for a failed sign-in call. */
export function loginErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === "NETWORK_ERROR" || error.status === 0) {
      return "Could not reach the server. Check your connection and try again.";
    }
    if (error.status === 401)
      return "The email or password is not right. Check both and try again.";
    if (error.status === 429) return "Too many sign-in attempts. Wait a minute, then try again.";
    if (error.status === 403) return "This account cannot sign in. Ask the owner to check it.";
    if (error.status >= 500) return "The server had a problem. Try again in a moment.";
  }
  return "Could not sign you in. Try again.";
}
