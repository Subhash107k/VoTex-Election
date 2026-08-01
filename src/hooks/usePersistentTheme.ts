import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "high-contrast";

const THEME_STORAGE_KEY = "votex_theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "high-contrast") {
    return stored;
  }
  return "dark";
};

const applyThemeClass = (theme: ThemeMode) => {
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("light", "dark", "high-contrast");
  root.classList.add(theme);
  body.classList.remove("light", "dark", "high-contrast");
  body.classList.add(theme);
};

export function usePersistentTheme() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    applyThemeClass(theme);
  }, []);

  return { theme, setTheme };
}
