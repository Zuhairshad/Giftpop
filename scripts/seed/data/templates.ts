import type { Design, TemplateCategory } from "@giftpop/contracts";

/**
 * A ready-made gift the seed writes to `featuredTemplates`. Fixed `id` and `shareId` so a second seed
 * run updates the same documents. `design` uses only seeded packagings and items, with every text
 * field left empty (the customer fills names and the card message at checkout).
 */
export interface SeedTemplate {
  id: string;
  shareId: string;
  title: string;
  description: string;
  category: TemplateCategory | null;
  featured: boolean;
  countries: string[];
  sortOrder: number;
  design: Design;
}

/** Filled in by the `seed-templates` agent in phase 8. */
export const TEMPLATES: SeedTemplate[] = [];
