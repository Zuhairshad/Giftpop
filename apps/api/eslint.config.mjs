import { baseConfig } from "@giftpop/config/eslint";
import globals from "globals";

export default [
  ...baseConfig,
  { languageOptions: { globals: { ...globals.node } } },
  {
    // mongoose is CommonJS: Node's native ESM loader cannot see these as named
    // exports (Vitest can, which hides the crash until `pnpm dev` or production).
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "mongoose",
              importNames: ["models", "connection"],
              message: "Use the default import (`mongoose.models`, `mongoose.connection`).",
            },
          ],
        },
      ],
    },
  },
];
