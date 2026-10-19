import { LoginRequestSchema } from "@giftpop/contracts";
import type { LoginRequest } from "@giftpop/contracts";

export type LoginField = keyof LoginRequest;
export type LoginFieldErrors = Partial<Record<LoginField, string>>;

export type LoginValidation =
  { ok: true; data: LoginRequest } | { ok: false; errors: LoginFieldErrors };

const MESSAGES: Record<LoginField, { empty: string; invalid: string }> = {
  email: { empty: "Enter your email address.", invalid: "Enter a valid email address." },
  password: { empty: "Enter your password.", invalid: "Enter a password under 200 characters." },
};

function isLoginField(key: unknown): key is LoginField {
  return key === "email" || key === "password";
}

/** Validates the login form with the contract schema and returns one plain message per field. */
export function validateLogin(values: { email: string; password: string }): LoginValidation {
  const parsed = LoginRequestSchema.safeParse({
    email: values.email.trim(),
    password: values.password,
  });
  if (parsed.success) return { ok: true, data: parsed.data };

  const errors: LoginFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (!isLoginField(field) || errors[field]) continue;
    const empty = values[field].trim() === "";
    errors[field] = empty ? MESSAGES[field].empty : MESSAGES[field].invalid;
  }
  return { ok: false, errors };
}
