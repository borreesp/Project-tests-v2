import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "@packages/ui-tokens";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { mobileApi, mobileTokenStorage } from "../../lib/sdk";
import { extractErrorMessage, isUnauthorizedError, normalizeRole, type AppSession } from "../lib/session";
import { DashboardScreen } from "../screens/athlete/DashboardScreen";
import { RankingScreen } from "../screens/athlete/RankingScreen";
import { WorkoutsScreen as AthleteWorkoutsScreen } from "../screens/athlete/WorkoutsScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterFromInviteScreen } from "../screens/auth/RegisterFromInviteScreen";
import { AthletesScreen } from "../screens/coach/AthletesScreen";
import { OverviewScreen } from "../screens/coach/OverviewScreen";
import { WorkoutsScreen as CoachWorkoutsScreen } from "../screens/coach/WorkoutsScreen";
import type { AthleteTabsParamList, CoachTabsParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AthleteTabs = createBottomTabNavigator<AthleteTabsParamList>();
const CoachTabs = createBottomTabNavigator<CoachTabsParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["myapp://"],
  config: {
    screens: {
      LoginScreen: "login",
      RegisterFromInviteScreen: "invite",
      AthleteTabs: "athlete",
      CoachTabs: "coach",
    },
  },
};

export function AppNavigator() {
  const [session, setSession] = useState<AppSession>({ isLoading: true, role: null, email: null });

  const hydrateSession = useCallback(async () => {
    try {
      const me = await mobileApi.me();
      const role = normalizeRole(me.role);

      if (!role) {
        await mobileTokenStorage.clear();
        setSession({ isLoading: false, role: null, email: null });
        return;
      }

      setSession({ isLoading: false, role, email: me.email });
    } catch (err) {
      if (!isUnauthorizedError(err)) {
        console.warn(`[mobile] hydrate session failed: ${extractErrorMessage(err)}`);
      }

      await mobileTokenStorage.clear();
      setSession({ isLoading: false, role: null, email: null });
    }
  }, []);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  const onAuthenticated = useCallback((role: AppSession["role"], email: string) => {
    if (!role) {
      return;
    }
    setSession({ isLoading: false, role, email });
  }, []);

  const onLogout = useCallback(async () => {
    try {
      const tokens = await mobileApi.getCurrentTokens();
      if (tokens?.refreshToken) {
        await mobileApi.request("/auth/logout", {
          method: "POST",
          body: { refreshToken: tokens.refreshToken },
        });
      }
    } catch {
      // no-op
    }

    await mobileTokenStorage.clear();
    setSession({ isLoading: false, role: null, email: null });
  }, []);

  const isAthlete = session.role === "ATHLETE";
  const isCoachLike = session.role === "COACH" || session.role === "ADMIN";

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="dark" />

      {session.isLoading ? (
        <View style={{ alignItems: "center", flex: 1, gap: 12, justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.muted }}>Cargando sesion...</Text>
        </View>
      ) : session.role === null ? (
        <RootStack.Navigator>
          <RootStack.Screen name="LoginScreen" options={{ title: "Login" }}>
            {(props) => <LoginScreen {...props} onAuthenticated={onAuthenticated} />}
          </RootStack.Screen>
          <RootStack.Screen name="RegisterFromInviteScreen" options={{ title: "Register from Invite" }}>
            {(props) => <RegisterFromInviteScreen {...props} onAuthenticated={onAuthenticated} />}
          </RootStack.Screen>
        </RootStack.Navigator>
      ) : isAthlete ? (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="AthleteTabs">
            {() => (
              <AthleteTabs.Navigator screenOptions={{ headerShown: false }}>
                <AthleteTabs.Screen name="DashboardScreen">{() => <DashboardScreen email={session.email} onLogout={() => void onLogout()} />}</AthleteTabs.Screen>
                <AthleteTabs.Screen name="WorkoutsScreen">{() => <AthleteWorkoutsScreen email={session.email} onLogout={() => void onLogout()} />}</AthleteTabs.Screen>
                <AthleteTabs.Screen name="RankingScreen">{() => <RankingScreen email={session.email} onLogout={() => void onLogout()} />}</AthleteTabs.Screen>
              </AthleteTabs.Navigator>
            )}
          </RootStack.Screen>
        </RootStack.Navigator>
      ) : isCoachLike ? (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="CoachTabs">
            {() => (
              <CoachTabs.Navigator screenOptions={{ headerShown: false }}>
                <CoachTabs.Screen name="OverviewScreen">{() => <OverviewScreen email={session.email} onLogout={() => void onLogout()} />}</CoachTabs.Screen>
                <CoachTabs.Screen name="AthletesScreen">{() => <AthletesScreen email={session.email} onLogout={() => void onLogout()} />}</CoachTabs.Screen>
                <CoachTabs.Screen name="WorkoutsScreen">{() => <CoachWorkoutsScreen email={session.email} onLogout={() => void onLogout()} />}</CoachTabs.Screen>
              </CoachTabs.Navigator>
            )}
          </RootStack.Screen>
        </RootStack.Navigator>
      ) : (
        <View style={{ alignItems: "center", flex: 1, gap: 12, justifyContent: "center" }}>
          <Text style={{ color: "#dc2626" }}>Rol no soportado</Text>
        </View>
      )}
    </NavigationContainer>
  );
}
