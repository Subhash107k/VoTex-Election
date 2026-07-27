import React from "react";
import { Sun, Moon, Eye } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark" | "high-contrast";
  setTheme: (theme: "light" | "dark" | "high-contrast") => void;
  className?: string;
}

export default function ThemeToggle({ theme, setTheme, className = "" }: ThemeToggleProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1 shadow-sm transition-colors ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Switch to Light Theme"
        aria-pressed={theme === "light"}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
          theme === "light"
            ? "bg-emerald-500 text-white shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Switch to Dark Theme"
        aria-pressed={theme === "dark"}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-emerald-500 text-white shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("high-contrast")}
        aria-label="Switch to High Contrast Theme"
        aria-pressed={theme === "high-contrast"}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
          theme === "high-contrast"
            ? "bg-amber-400 text-black font-extrabold shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Contrast</span>
      </button>
    </div>
  );
}
