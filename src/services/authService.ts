import type {
  AuthResult,
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
} from "../types/auth.ts";
import type { User, UserPreferences } from "../types.js";
import { authHeader, jsonRequestOptions, requestJson } from "./apiClient.ts";

export function getCurrentUser(token: string) {
  return requestJson<{ user: User | null; sessionExpired?: boolean }>(
    "/api/auth/me",
    {
      headers: authHeader(token),
    },
  );
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

export interface AvailabilityResult {
  success: boolean;
  available: {
    email: boolean;
    username: boolean;
    phone: boolean;
    nid: boolean;
    citizenship: boolean;
  };
  message: Record<string, string>;
}

export function checkAvailability(params: {
  email?: string;
  username?: string;
  phone?: string;
  nid?: string;
  citizenship?: string;
}) {
  const query = new URLSearchParams();
  if (params.email) query.set("email", params.email);
  if (params.username) query.set("username", params.username);
  if (params.phone) query.set("phone", params.phone);
  if (params.nid) query.set("nid", params.nid);
  if (params.citizenship) query.set("citizenship", params.citizenship);

  return requestJson<AvailabilityResult>(
    `/api/auth/check-availability?${query.toString()}`
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
