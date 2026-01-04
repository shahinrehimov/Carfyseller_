//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";
import { globalIgnores } from "eslint/config";
import pluginRouter from "@tanstack/eslint-plugin-router";

export default [
  ...pluginRouter.configs["flat/recommended"],
  ...tanstackConfig,
  globalIgnores([
    "src/routeTree.gen.ts",
    "vite.config.js",
    "prettier.config.js",
    "eslint.config.js",
  ]),
  {
    name: "disable-unneeded rules",
    rules: {
      "no-shadow": "off",
      "import/no-cycle": "off",
    },
  },
];
