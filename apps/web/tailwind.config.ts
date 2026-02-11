import type { Config } from "tailwindcss";

const webThemeColors = {
  border: "#C0C0C0",
  input: "#C0C0C0",
  ring: "#F5760B",
  background: "#FFFFFF",
  foreground: "#000000",
  primary: {
    DEFAULT: "#F5760B",
    foreground: "#FFFFFF",
  },
  secondary: {
    DEFAULT: "#F3F3F3",
    foreground: "#000000",
  },
  muted: {
    DEFAULT: "#F3F3F3",
    foreground: "#404040",
  },
  accent: {
    DEFAULT: "#F3F3F3",
    foreground: "#000000",
  },
  destructive: {
    DEFAULT: "#BF5C09",
    foreground: "#FFFFFF",
  },
  card: {
    DEFAULT: "#FFFFFF",
    foreground: "#000000",
  },
  popover: {
    DEFAULT: "#FFFFFF",
    foreground: "#000000",
  },
} as const;

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
