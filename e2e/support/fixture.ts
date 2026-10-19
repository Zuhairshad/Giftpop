import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Facts one test file hands to the next (the order test (a) hands its order to (c)). */
export interface SharedFixture {
  pkOrder?: { number: string; phone: string; email: string };
  usOrder?: { number: string };
  partnerRequest?: { brandName: string };
}

const DIR = path.join(__dirname, "..", ".fixtures");
const FILE = path.join(DIR, "shared.json");

/** Called by global setup so a run never reads the previous run's orders. */
export function resetFixture(): void {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, "{}\n");
}

export function readFixture(): SharedFixture {
  if (!existsSync(FILE)) return {};
  return JSON.parse(readFileSync(FILE, "utf8")) as SharedFixture;
}

export function writeFixture(patch: SharedFixture): void {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, `${JSON.stringify({ ...readFixture(), ...patch }, null, 2)}\n`);
}
