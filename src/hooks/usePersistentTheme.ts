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
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeClass(newTheme);
    window.dispatchEvent(new CustomEvent("votex_theme_changed", { detail: newTheme }));
  };

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        if (e.newValue === "light" || e.newValue === "dark" || e.newValue === "high-contrast") {
          setThemeState(e.newValue);
          applyThemeClass(e.newValue);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail && (customEvent.detail === "light" || customEvent.detail === "dark" || customEvent.detail === "high-contrast")) {
        setThemeState(customEvent.detail);
        applyThemeClass(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("votex_theme_changed", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("votex_theme_changed", handleCustomEvent);
    };
  }, []);

  return { theme, setTheme };
}
