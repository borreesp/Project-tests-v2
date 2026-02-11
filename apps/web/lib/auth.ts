"use client";

import { HttpError } from "@packages/sdk";

import { webApi, webTokenStorage } from "@/lib/sdk";

export type AppRole = "ATHLETE" | "COACH" | "ADMIN";

export type MeDTO = {
  id: string;
  email: string;
  role: AppRole;
  status: "ACTIVE" | "DISABLED";
};

export function routeForRole(role: AppRole): string {
  if (role === "ATHLETE") return "/athlete/dashboard";
  if (role === "COACH") return "/coach/overview";
  return "/admin";
}

export async function fetchMe(): Promise<MeDTO> {
  return webApi.request<MeDTO>("/me");
}

export async function clearSession(): Promise<void> {
  await webTokenStorage.clear();
}

export async function logout(): Promise<void> {
  const tokens = await webApi.getCurrentTokens();
  const refreshToken = tokens?.refreshToken ?? null;

  if (refreshToken) {
    try {
      await webApi.request("/auth/logout", {
        method: "POST",
        body: { refreshToken },
      });
    } catch {
      // No-op, always clear local tokens.
    }
  }

  await clearSession();
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status === 401;
  }
  return error instanceof Error && error.message === "UNAUTHENTICATED";
}
