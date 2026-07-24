import type React from "react";

import type { User } from "../types.js";

export type ThemeMode = "light" | "dark";
export type AuthTab = "login" | "register" | "forgot_password";

export interface RegisterForm {
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  dob: string;
  gender: "Male" | "Female" | "Other" | string;
  occupation: string;
  password: string;
  confirmPassword: string;
  role: "Voter" | "Candidate" | string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface ForgotPasswordForm {
  email: string;
  code: string;
  newPassword: string;
}

export type ForgotPasswordStep = "request" | "verify";
export type PresetLoginRole = "super" | "officer" | "voter";

export interface AuthResult {
  token: string;
  user: User;
}

export interface PublicLandingProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  loading: boolean;
  loginForm: LoginForm;
  setLoginForm: (form: LoginForm) => void;
  handleLoginSubmit: (event: React.FormEvent) => void;
  regForm: RegisterForm;
  setRegForm: (form: RegisterForm) => void;
  regFaceImage: string;
  setRegFaceImage: (image: string) => void;
  regFaceTemplate: number[] | null;
  setRegFaceTemplate: (template: number[] | null) => void;
  handleRegisterSubmit: (event: React.FormEvent) => void;
  forgotForm: ForgotPasswordForm;
  setForgotForm: (form: ForgotPasswordForm) => void;
  forgotStep: ForgotPasswordStep;
  setForgotStep: (step: ForgotPasswordStep) => void;
  handleForgotPasswordSubmit: (event: React.FormEvent) => void;
  handleResetPasswordSubmit: (event: React.FormEvent) => void;
  loginAsPresetUser: (role: PresetLoginRole) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}
