import { CreateStaffRequestSchema } from "@giftpop/contracts";

export interface SeedEnv {
  mongodbUri: string;
  ownerEmail: string;
  ownerPassword: string;
}

/**
 * The owner credentials are validated with the contract's zod schema (valid email,
 * password at least PASSWORD_MIN_LENGTH characters). The seed package has no direct
 * zod dependency, so the schema is reused through `.pick`.
 */
const OwnerCredentialsSchema = CreateStaffRequestSchema.pick({ email: true, password: true });

/** Parses the seed's env vars. Throws an Error listing every problem, one per line. */
export function parseSeedEnv(source: Record<string, string | undefined>): SeedEnv {
  const problems: string[] = [];

  const mongodbUri = source["MONGODB_URI"]?.trim() ?? "";
  if (mongodbUri === "") problems.push("MONGODB_URI is required");

  const owner = OwnerCredentialsSchema.safeParse({
    email: source["SEED_OWNER_EMAIL"] ?? "",
    password: source["SEED_OWNER_PASSWORD"] ?? "",
  });
  if (!owner.success) {
    for (const issue of owner.error.issues) {
      const name = issue.path[0] === "email" ? "SEED_OWNER_EMAIL" : "SEED_OWNER_PASSWORD";
      problems.push(`${name}: ${issue.message}`);
    }
  }

  if (problems.length > 0 || !owner.success) {
    throw new Error(
      `Seed cannot start. Fix these in apps/api/.env or the shell:\n${problems.map((p) => `  ${p}`).join("\n")}`,
    );
  }
  return { mongodbUri, ownerEmail: owner.data.email, ownerPassword: owner.data.password };
}
