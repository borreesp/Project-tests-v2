import type { RegisterFromInviteRequest, RegisterFromInviteResponse, Sex } from "@packages/types";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { mobileApi } from "../../../lib/sdk";
import { AppButton, Card, FieldInput, InlineError, Label, OptionSelector, ScreenContainer, ScreenHeader } from "../../components/ui";
import { extractErrorMessage } from "../../lib/session";
import type { RegisterScreenProps, SessionHandler } from "../../navigation/types";

export function RegisterFromInviteScreen({ route, onAuthenticated }: RegisterScreenProps & SessionHandler) {
  const [token, setToken] = useState(route.params?.token ?? "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [birthdate, setBirthdate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
    }
  }, [route.params?.token]);

  const onRegister = useCallback(async () => {
    if (!token.trim() || !password.trim()) {
      setError("Token y password son obligatorios");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: RegisterFromInviteRequest = {
      token: token.trim(),
      password,
      athlete: {
        sex: sex || undefined,
        birthdate: birthdate || undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      },
    };

    if (displayName.trim()) {
      payload.displayName = displayName.trim();
    }

    try {
      const response = await mobileApi.request<RegisterFromInviteResponse>("/auth/register-from-invite", {
        method: "POST",
        body: payload,
      });
      await mobileApi.setTokens(response.accessToken, response.refreshToken);
      const me = await mobileApi.me();
      onAuthenticated("ATHLETE", me.email);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [birthdate, displayName, heightCm, onAuthenticated, password, sex, token, weightKg]);

  return (
    <ScreenContainer>
      <ScreenHeader title="RegisterFromInviteScreen" subtitle="myapp://invite?token=..." />

      <Card>
        <View>
          <Label>Token</Label>
          <FieldInput autoCapitalize="none" value={token} onChangeText={setToken} />
        </View>

        <View>
          <Label>Password</Label>
          <FieldInput secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <View>
          <Label>Display Name (opcional)</Label>
          <FieldInput value={displayName} onChangeText={setDisplayName} />
        </View>

        <OptionSelector
          label="Sex"
          onChange={setSex}
          options={[
            { label: "N/A", value: "" },
            { label: "MALE", value: "MALE" },
            { label: "FEMALE", value: "FEMALE" },
          ]}
          value={sex}
        />

        <View>
          <Label>Birthdate (YYYY-MM-DD)</Label>
          <FieldInput autoCapitalize="none" value={birthdate} onChangeText={setBirthdate} />
        </View>

        <View>
          <Label>Height cm</Label>
          <FieldInput keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />
        </View>

        <View>
          <Label>Weight kg</Label>
          <FieldInput keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
        </View>

        <InlineError message={error} />

        <AppButton disabled={isSubmitting} label={isSubmitting ? "Registrando..." : "Crear cuenta"} onPress={() => void onRegister()} />
      </Card>
    </ScreenContainer>
  );
}
