import type { TokenStorage } from "./storage";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function setTokens(storage: TokenStorage, tokens: AuthTokens): Promise<void> {
  await storage.setTokens(tokens.accessToken, tokens.refreshToken);
}

export async function getTokens(storage: TokenStorage): Promise<AuthTokens | null> {
  const accessToken = await storage.getAccessToken();
  const refreshToken = await storage.getRefreshToken();

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function clearTokens(storage: TokenStorage): Promise<void> {
  await storage.clear();
}
