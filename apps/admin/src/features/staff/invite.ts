import { CreateStaffRequestSchema, PASSWORD_MIN_LENGTH } from "@giftpop/contracts";
import type { CreateStaffRequest } from "@giftpop/contracts";

export type InviteField = keyof CreateStaffRequest;
export type InviteFieldErrors = Partial<Record<InviteField, string>>;

export type InviteValidation =
  { ok: true; data: CreateStaffRequest } | { ok: false; errors: InviteFieldErrors };

export interface InviteValues {
  name: string;
  email: string;
  role: string;
  password: string;
}

const MESSAGES: Record<InviteField, { empty: string; invalid: string }> = {
  name: { empty: "Enter the person's name.", invalid: "Use a name of 80 characters or fewer." },
  email: { empty: "Enter an email address.", invalid: "Enter a valid email address." },
  role: { empty: "Choose a role.", invalid: "Choose owner or staff." },
  password: {
    empty: "Enter a temporary password, or generate one.",
    invalid: `Use at least ${PASSWORD_MIN_LENGTH} characters (200 at most).`,
  },
};

const FIELDS: readonly InviteField[] = ["name", "email", "role", "password"];

function isInviteField(key: unknown): key is InviteField {
  return typeof key === "string" && (FIELDS as readonly string[]).includes(key);
}

/** Validates the invite form with the contract schema and returns one plain message per field. */
export function validateInvite(values: InviteValues): InviteValidation {
  const parsed = CreateStaffRequestSchema.safeParse({
    name: values.name,
    email: values.email.trim(),
    role: values.role,
    password: values.password,
  });
  if (parsed.success) return { ok: true, data: parsed.data };

  const errors: InviteFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (!isInviteField(field) || errors[field]) continue;
    const empty = values[field].trim() === "";
    errors[field] = empty ? MESSAGES[field].empty : MESSAGES[field].invalid;
  }
  return { ok: false, errors };
}

// 32 characters, so one random byte maps to a character with no bias. No 0/O/1/I/L lookalikes.
const PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789_";
const GENERATED_PASSWORD_LENGTH = 16;

/** A random temporary password the owner can read out or paste. Uses the Web Crypto random source. */
export function generateTemporaryPassword(
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes),
): string {
  const bytes = random(new Uint8Array(GENERATED_PASSWORD_LENGTH));
  let out = "";
  for (const byte of bytes) out += PASSWORD_ALPHABET.charAt(byte & 31);
  return out;
}
