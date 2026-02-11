import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { apiClient } from "@packages/sdk";
import type { UserRole } from "@packages/types";
import { colors, spacing, typography } from "@packages/ui-tokens";

const RootTabs = createBottomTabNavigator();
const AthleteTabsNavigator = createBottomTabNavigator();
const CoachTabsNavigator = createBottomTabNavigator();

function ScreenTemplate({ title, role }: { title: string; role: UserRole }) {
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    async function checkBackend() {
      try {
        const result = await apiClient.request<{ status?: string }>("/health");
        if (isMounted) {
          setHealth(result.status ?? "ok");
        }
      } catch {
        if (isMounted) {
          setHealth("unreachable");
        }
      }
    }

    void checkBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>role: {role}</Text>
      <Text style={styles.subtitle}>backend: {health}</Text>
    </View>
  );
}

function DashboardScreen() {
  return <ScreenTemplate title="Dashboard" role="athlete" />;
}

function AthleteWorkoutsScreen() {
  return <ScreenTemplate title="Workouts" role="athlete" />;
}

function RankingScreen() {
  return <ScreenTemplate title="Ranking" role="athlete" />;
}

function OverviewScreen() {
  return <ScreenTemplate title="Overview" role="coach" />;
}

function AthletesScreen() {
  return <ScreenTemplate title="Athletes" role="coach" />;
}

function CoachWorkoutsScreen() {
  return <ScreenTemplate title="Workouts" role="coach" />;
}

function AthleteTabs() {
  return (
    <AthleteTabsNavigator.Navigator>
      <AthleteTabsNavigator.Screen component={DashboardScreen} name="Dashboard" />
      <AthleteTabsNavigator.Screen component={AthleteWorkoutsScreen} name="Workouts" />
      <AthleteTabsNavigator.Screen component={RankingScreen} name="Ranking" />
    </AthleteTabsNavigator.Navigator>
  );
}

function CoachTabs() {
  return (
    <CoachTabsNavigator.Navigator>
      <CoachTabsNavigator.Screen component={OverviewScreen} name="Overview" />
      <CoachTabsNavigator.Screen component={AthletesScreen} name="Athletes" />
      <CoachTabsNavigator.Screen component={CoachWorkoutsScreen} name="Workouts" />
    </CoachTabsNavigator.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <RootTabs.Navigator>
        <RootTabs.Screen component={AthleteTabs} name="AthleteTabs" />
        <RootTabs.Screen component={CoachTabs} name="CoachTabs" />
      </RootTabs.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.lg,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.md,
  },
});
