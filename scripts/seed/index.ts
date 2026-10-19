import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { connectDb, disconnectDb } from "../../apps/api/src/db";
import { createOwner } from "../../apps/api/src/modules/auth/service";
import {
  upsertItem,
  upsertPackaging,
  upsertPrices,
} from "../../apps/api/src/modules/catalog/service";
import { upsertCountry } from "../../apps/api/src/modules/countries/service";

import { COUNTRIES, ITEMS, PACKAGINGS, PRICES } from "./data";
import { parseSeedEnv } from "./env";

const API_ENV_PATH = fileURLToPath(new URL("../../apps/api/.env", import.meta.url));

async function main(): Promise<void> {
  // Variables already set in the shell win over the file.
  if (existsSync(API_ENV_PATH)) process.loadEnvFile(API_ENV_PATH);
  const env = parseSeedEnv(process.env);

  await connectDb({ uri: env.mongodbUri, maxAttempts: 5, baseDelayMs: 250 });
  try {
    // Every call below is an idempotent upsert keyed by a stable id, so a second run changes nothing.
    const owner = await createOwner({
      email: env.ownerEmail,
      name: "Owner",
      password: env.ownerPassword,
    });
    for (const country of COUNTRIES) await upsertCountry(country);
    for (const packaging of PACKAGINGS) await upsertPackaging(packaging);
    for (const item of ITEMS) await upsertItem(item);
    await upsertPrices(PRICES);

    console.log("Seed complete (safe to run again).");
    console.log(`  owner:      ${owner.email}`);
    console.log(`  countries:  ${COUNTRIES.length} upserted`);
    console.log(`  packagings: ${PACKAGINGS.length} upserted`);
    console.log(`  items:      ${ITEMS.length} upserted`);
    console.log(`  prices:     ${PRICES.length} upserted`);
  } finally {
    await disconnectDb();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
