import { sharedRules } from "@giftpop/config/eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  sharedRules,
  {
    // These show staff-uploaded images from an arbitrary asset host (local API or R2),
    // so `next/image` optimisation does not apply.
    files: ["src/features/catalog/components/**"],
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
