import type { Config } from "tailwindcss";

type WebThemeColors = Config["theme"] extends { extend?: { colors?: infer T } } ? T : Record<string, unknown>;

function resolveWebThemeColors(): WebThemeColors {
  try {
    const shared = require("@packages/ui-tokens") as { webThemeColors: WebThemeColors };
    return shared.webThemeColors;
  } catch {
    const shared = require("../../packages/ui-tokens/src/index.ts") as { webThemeColors: WebThemeColors };
    return shared.webThemeColors;
  }
}

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: resolveWebThemeColors(),
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
