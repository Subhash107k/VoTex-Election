import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "high-contrast";

const THEME_STORAGE_KEY = "votex_theme";

export function usePersistentTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || "dark";
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.remove("light", "dark", "high-contrast");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return { theme, setTheme };
}
