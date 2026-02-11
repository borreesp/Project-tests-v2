import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { mobileApi } from "../../../lib/sdk";
import { AppButton, Card, FieldInput, InlineError, Label, ScreenContainer, ScreenHeader } from "../../components/ui";
import { extractErrorMessage, normalizeRole } from "../../lib/session";
import type { LoginScreenProps, SessionHandler } from "../../navigation/types";

export function LoginScreen({ navigation, onAuthenticated }: LoginScreenProps & SessionHandler) {
  const [email, setEmail] = useState("athlete@local.test");
  const [password, setPassword] = useState("Athlete123!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const login = await mobileApi.login({ email, password });
      const me = await mobileApi.me();
      const role = normalizeRole(me.role) ?? login.role;

      if (!role) {
        throw new Error("Role not supported");
      }

      onAuthenticated(role, me.email);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, onAuthenticated, password]);

  return (
    <ScreenContainer>
      <ScreenHeader title="LoginScreen" subtitle="Acceso por rol" />

      <Card>
        <View>
          <Label>Email</Label>
          <FieldInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        </View>

        <View>
          <Label>Password</Label>
          <FieldInput secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <InlineError message={error} />

        <AppButton disabled={isSubmitting} label={isSubmitting ? "Entrando..." : "Entrar"} onPress={() => void onLogin()} />
        <AppButton label="Registro por invite" onPress={() => navigation.navigate("RegisterFromInviteScreen")} variant="secondary" />

        <Text style={{ color: "#64748b", fontSize: 12 }}>Demo: admin@local.com, coach@local.com, athlete@local.com</Text>
      </Card>
    </ScreenContainer>
  );
}
