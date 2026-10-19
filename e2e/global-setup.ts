import { execFileSync } from "node:child_process";
import net from "node:net";

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
 * seed data. Seeding upserts, so running it twice is safe.
 */
export default async function globalSetup(): Promise<void> {
  if (!(await mongoIsUp())) {
    execFileSync("docker", ["compose", "up", "-d", "--wait", "mongo"], { stdio: "inherit" });
  }
  execFileSync("pnpm", ["seed"], {
    stdio: "inherit",
    env: {
      ...process.env,
      SEED_OWNER_EMAIL: process.env.E2E_STAFF_EMAIL ?? "owner@giftpop.test",
      SEED_OWNER_PASSWORD: process.env.E2E_STAFF_PASSWORD ?? "dev-owner-password-1",
    },
  });
}
