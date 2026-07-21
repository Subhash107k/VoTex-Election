import { useEffect, useState } from "react";

import type { ThemeMode } from "../types/auth.ts";

const THEME_STORAGE_KEY = "votex_theme";

export function usePersistentTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || "light";
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return { theme, setTheme };
}
