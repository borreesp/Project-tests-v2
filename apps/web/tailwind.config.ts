import type { Config } from "tailwindcss";

const path = require("node:path") as typeof import("node:path");

const tokensModulePath = path.resolve(__dirname, "../../packages/ui-tokens/src/index.ts");
const { webThemeColors } = require(tokensModulePath) as {
  webThemeColors: NonNullable<Config["theme"]>["extend"] extends { colors?: infer T } ? T : Record<string, unknown>;
};

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: webThemeColors,
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
