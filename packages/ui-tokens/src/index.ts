export const colors = {
  background: "#000000",
  surface: "#404040",
  surfaceElevated: "#4a4a4a",
  foreground: "#f5f5f5",
  foregroundMuted: "#c0c0c0",
  primary: "#f5760b",
  primaryStrong: "#d76509",
  accent: "#f5760b",
  success: "#10b981",
  warning: "#f5760b",
  error: "#ef4444",
  border: "#595959",
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 24,
  "2xl": 32,
} as const;

export const elevation = {
  level1: "0 1px 2px rgba(0, 0, 0, 0.35)",
  level2: "0 10px 24px rgba(0, 0, 0, 0.4)",
  level3: "0 18px 32px rgba(0, 0, 0, 0.5)",
} as const;
