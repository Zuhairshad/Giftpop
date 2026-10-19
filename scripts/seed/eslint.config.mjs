import { baseConfig } from "@giftpop/config/eslint";
import globals from "globals";

export default [...baseConfig, { languageOptions: { globals: { ...globals.node } } }];
