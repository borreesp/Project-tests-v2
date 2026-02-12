export const colors = {
  background: "#090f1f",
  surface: "#111a2f",
  surfaceElevated: "#17233d",
  foreground: "#f8fafc",
  foregroundMuted: "#94a3b8",
  primary: "#22d3ee",
  primaryStrong: "#06b6d4",
  accent: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  border: "#1e293b",
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
  level1: "0 1px 2px rgba(15, 23, 42, 0.35)",
  level2: "0 10px 24px rgba(15, 23, 42, 0.35)",
  level3: "0 18px 32px rgba(15, 23, 42, 0.45)",
} as const;
