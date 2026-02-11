import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { UserRole } from "@packages/types";

export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterFromInviteScreen: { token?: string } | undefined;
  AthleteTabs: undefined;
  CoachTabs: undefined;
};

export type AthleteTabsParamList = {
  DashboardScreen: undefined;
  WorkoutsScreen: undefined;
  RankingScreen: undefined;
};

export type CoachTabsParamList = {
  OverviewScreen: undefined;
  AthletesScreen: undefined;
  WorkoutsScreen: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "LoginScreen">;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, "RegisterFromInviteScreen">;

export type SessionHandler = {
  onAuthenticated: (role: UserRole, email: string) => void;
};

export type ProtectedScreenProps = {
  onLogout: () => void;
  email: string | null;
};
