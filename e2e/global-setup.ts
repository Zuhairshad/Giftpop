import { execFileSync } from "node:child_process";
import net from "node:net";

import { STAFF_EMAIL, STAFF_PASSWORD } from "./support/env";
import { ensureFeaturedTemplate } from "./support/featured-template";
import { resetFixture } from "./support/fixture";
import { ensureReadyMadeGifts } from "./support/ready-made-gifts";
import { warmUpRoutes } from "./support/warm-up";

function mongoIsUp(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port: 27017 });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

/**
 * Makes sure MongoDB is running (Docker, unless one is already listening on 27017,
 * for example the in-memory replica set from `e2e/mongo-memory.cjs`), then loads the
 * seed data and one featured US template. Seeding upserts, so running it twice is safe.
 */
export default async function globalSetup(): Promise<void> {
  if (!(await mongoIsUp())) {
    execFileSync("docker", ["compose", "up", "-d", "--wait", "mongo"], { stdio: "inherit" });
  }
  execFileSync("pnpm", ["seed"], {
    stdio: "inherit",
    env: {
      ...process.env,
      SEED_OWNER_EMAIL: STAFF_EMAIL,
      SEED_OWNER_PASSWORD: STAFF_PASSWORD,
    },
  });
  resetFixture();
  const staffCookie = await ensureFeaturedTemplate();
  await ensureReadyMadeGifts(staffCookie);
  await warmUpRoutes(staffCookie);
}
