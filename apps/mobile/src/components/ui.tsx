import { colors, radius, spacing, typography } from "@packages/ui-tokens";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export type Option<T extends string> = {
  label: string;
  value: T;
};

export function ScreenContainer({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer} style={styles.screen}>
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onLogout,
}: {
  title: string;
  subtitle?: string;
  onLogout?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onLogout ? <AppButton label="Salir" onPress={onLogout} variant="ghost" /> : null}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function FieldInput(props: ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />;
}

export function AppButton({
  label,
  onPress,
  disabled,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" ? styles.buttonPrimary : null,
        variant === "secondary" ? styles.buttonSecondary : null,
        variant === "danger" ? styles.buttonDanger : null,
        variant === "ghost" ? styles.buttonGhost : null,
        pressed ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" ? styles.buttonSecondaryText : null,
          variant === "ghost" ? styles.buttonGhostText : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function OptionSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Label>{label}</Label>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.optionPill, selected ? styles.optionPillSelected : null]}
            >
              <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${width}%` }]} />
    </View>
  );
}

export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

export function InlineSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.successText}>{message}</Text>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <Text style={styles.mutedText}>{message}</Text>
    </Card>
  );
}

export const uiStyles = StyleSheet.create({
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.md,
    fontWeight: "700",
  },
  mutedText: {
    color: colors.muted,
    fontSize: typography.sm,
  },
  listItem: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  listItemSelected: {
    backgroundColor: "#eff6ff",
    borderColor: colors.primary,
  },
  listItemTitle: {
    color: colors.foreground,
    fontSize: typography.md,
    fontWeight: "700",
  },
  listItemSub: {
    color: colors.muted,
    fontSize: typography.sm,
  },
  tableRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tableRank: {
    color: colors.foreground,
    fontSize: typography.sm,
    width: 40,
  },
  tableName: {
    color: colors.foreground,
    flex: 1,
    fontSize: typography.sm,
  },
  tableScore: {
    color: colors.foreground,
    fontSize: typography.sm,
    fontWeight: "700",
    minWidth: 72,
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenContainer: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  headerTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.xl,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.sm,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  label: {
    color: colors.foreground,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  input: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.foreground,
    fontSize: typography.md,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  button: {
    alignItems: "center",
    borderRadius: radius.sm,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonDanger: {
    backgroundColor: "#dc2626",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: typography.sm,
    fontWeight: "700",
  },
  buttonSecondaryText: {
    color: colors.foreground,
  },
  buttonGhostText: {
    color: colors.foreground,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  optionPill: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  optionPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.foreground,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#ffffff",
  },
  progressTrack: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    height: "100%",
  },
  errorText: {
    color: "#dc2626",
    fontSize: typography.sm,
    fontWeight: "600",
  },
  successText: {
    color: "#16a34a",
    fontSize: typography.sm,
    fontWeight: "600",
  },
  mutedText: {
    color: colors.muted,
    fontSize: typography.sm,
  },
});
