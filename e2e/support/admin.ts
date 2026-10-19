import type { Page } from "@playwright/test";

import { ADMIN_URL, STAFF_EMAIL, STAFF_PASSWORD } from "./env";

/** Signs a staff member in on the admin app's login page. */
export async function signInAsStaff(page: Page): Promise<void> {
  await page.goto(`${ADMIN_URL}/login`);
  await page.getByLabel("Email").fill(STAFF_EMAIL);
  await page.getByLabel("Password").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}
