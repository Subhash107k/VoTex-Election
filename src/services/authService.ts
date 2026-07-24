import type {
  AuthResult,
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
} from "../types/auth.ts";
import type { User, UserPreferences } from "../types.js";
import { authHeader, jsonRequestOptions, requestJson } from "./apiClient.ts";

export function getCurrentUser(token: string) {
  return requestJson<{ user: User }>("/api/auth/me", {
    headers: authHeader(token),
  });
}

export function getUserPreferences(token: string) {
  return requestJson<{ preferences: UserPreferences }>("/api/preferences/me", {
    headers: authHeader(token),
  });
}

export function updateUserPreferences(
  token: string,
  preferences: Partial<UserPreferences>,
) {
  return requestJson<{ preferences: UserPreferences }>(
    "/api/preferences/me",
    {
      ...jsonRequestOptions("PUT", preferences),
      headers: { ...authHeader(token), "Content-Type": "application/json" },
    },
  );
}

export function registerAccount(form: RegisterForm) {
  return requestJson("/api/auth/register", jsonRequestOptions("POST", form));
}

export function loginAccount(form: LoginForm) {
  return requestJson<AuthResult>("/api/auth/login", jsonRequestOptions("POST", form));
}

export function requestPasswordReset(email: string) {
  return requestJson(
    "/api/auth/forgot-password",
    jsonRequestOptions("POST", { email }),
  );
}

export function resetPassword(form: ForgotPasswordForm) {
  return requestJson(
    "/api/auth/reset-password",
    jsonRequestOptions("POST", {
      email: form.email,
      code: form.code,
      newPassword: form.newPassword,
    }),
  );
}
