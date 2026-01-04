//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  trailingComma: "all",
  tailwindStylesheet: "./src/styles.css",
  tailwindFunctions: ["clsx", "cn", "twMerge", "cva"],
};

export default config;
