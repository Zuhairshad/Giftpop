import { expect, type Page } from "@playwright/test";

/** The page must not be wider than the window. Only meaningful in a non-mobile context. */
export async function expectNoHorizontalOverflow(page: Page, where: string): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `horizontal overflow on ${where}`).toBeLessThanOrEqual(0);
}
