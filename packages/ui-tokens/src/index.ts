export const pulsePalette = {
  white: "#FFFFFF",
  harvestOrange: "#F5760B",
  silver: "#C0C0C0",
  gunmetal: "#404040",
  black: "#000000",
} as const;

export const colors = {
  primary: pulsePalette.harvestOrange,
  primaryHover: "#DB6A0A",
  primaryPressed: "#BF5C09",
  background: pulsePalette.black,
  surface: pulsePalette.gunmetal,
  border: pulsePalette.silver,
  textPrimary: pulsePalette.white,
  textSecondary: pulsePalette.silver,
  disabled: "#666666",
  error: "#BF5C09",
  foreground: pulsePalette.white,
  secondary: pulsePalette.gunmetal,
  muted: pulsePalette.silver,
  success: "#16A34A",
  warning: "#CA8A04",
  danger: "#DC2626",
  focusRing: pulsePalette.harvestOrange,
} as const;

export const buttonColors = {
  primary: {
    default: colors.primary,
    hover: colors.primaryHover,
    pressed: colors.primaryPressed,
    disabled: colors.disabled,
    text: pulsePalette.white,
  },
  secondary: {
    default: colors.surface,
    hover: "#595959",
    pressed: "#333333",
    disabled: colors.disabled,
    text: colors.textPrimary,
  },
  ghost: {
    default: "transparent",
    hover: colors.surface,
    pressed: "#333333",
    disabled: "transparent",
    text: colors.textPrimary,
  },
  destructive: {
    default: colors.error,
    hover: "#A64F08",
    pressed: "#8F4507",
    disabled: colors.disabled,
    text: pulsePalette.white,
  },
} as const;

export const webThemeColors = {
  border: colors.border,
  input: colors.border,
  ring: colors.focusRing,
  background: colors.background,
  foreground: colors.textPrimary,
  primary: {
    DEFAULT: colors.primary,
    foreground: pulsePalette.white,
  },
  secondary: {
    DEFAULT: colors.surface,
    foreground: colors.textPrimary,
  },
  muted: {
    DEFAULT: colors.surface,
    foreground: colors.textSecondary,
  },
  accent: {
    DEFAULT: colors.surface,
    foreground: colors.textPrimary,
  },
  destructive: {
    DEFAULT: colors.error,
    foreground: pulsePalette.white,
  },
  card: {
    DEFAULT: colors.surface,
    foreground: colors.textPrimary,
  },
  popover: {
    DEFAULT: colors.surface,
    foreground: colors.textPrimary,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const typography = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;
