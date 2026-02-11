import { HttpError } from "@packages/sdk";
import type { UserRole } from "@packages/types";

export type AppSession = {
  isLoading: boolean;
  role: UserRole | null;
  email: string | null;
};

export function normalizeRole(role: string): UserRole | null {
  if (role === "ATHLETE" || role === "COACH" || role === "ADMIN") {
    return role;
  }
  return null;
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status === 401;
  }
  return error instanceof Error && error.message === "UNAUTHENTICATED";
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (typeof error.body === "string") {
      return error.body;
    }

    if (error.body && typeof error.body === "object" && "detail" in error.body) {
      const detail = (error.body as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }

    return `HTTP ${error.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
