import { CreateStaffRequestSchema } from "@giftpop/contracts";

export interface SeedEnv {
  mongodbUri: string;
  ownerEmail: string;
  ownerPassword: string;
  /** `SEED_OWNER_ONLY=1`: create the first owner and write no countries, catalog or prices. */
  ownerOnly: boolean;
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

  const ownerOnlyRaw = source["SEED_OWNER_ONLY"]?.trim() ?? "";
  if (!["", "0", "1"].includes(ownerOnlyRaw)) problems.push("SEED_OWNER_ONLY must be 1 or 0");

  if (problems.length > 0 || !owner.success) {
    throw new Error(
      `Seed cannot start. Fix these in apps/api/.env or the shell:\n${problems.map((p) => `  ${p}`).join("\n")}`,
    );
  }
  return {
    mongodbUri,
    ownerEmail: owner.data.email,
    ownerPassword: owner.data.password,
    ownerOnly: ownerOnlyRaw === "1",
  };
}

/**
 * The full seed replaces seeded items, packagings, countries and prices, which would put the
 * demo catalog live or undo staff edits, so production needs an explicit override. Owner-only
 * mode writes one staff account (and never overwrites an existing one), so it may run there.
 */
export function assertSeedMayRun(
  env: Pick<SeedEnv, "ownerOnly">,
  source: Record<string, string | undefined>,
): void {
  if (env.ownerOnly || source["NODE_ENV"] !== "production") return;
  if (source["SEED_ALLOW_PRODUCTION"] === "1") return;
  throw new Error(
    "Refusing to write the demo catalog with NODE_ENV=production. To create only the first " +
      "owner, set SEED_OWNER_ONLY=1. To load the demo catalog anyway, set SEED_ALLOW_PRODUCTION=1.",
  );
}
