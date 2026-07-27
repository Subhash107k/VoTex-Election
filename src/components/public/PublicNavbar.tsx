import React, { useState } from "react";
import { Vote, Sun, Moon, Menu, X, Shield, Lock, ChevronRight } from "lucide-react";
import type { ThemeMode } from "../../types/auth.ts";

interface PublicNavbarProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export default function PublicNavbar({
  currentPath,
  setCurrentPath,
  theme,
  setTheme,
}: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLight = theme === "light";

  const handleNav = (pathStr: string) => {
    setCurrentPath(pathStr);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Elections", path: "/elections" },
    { label: "Live Results", path: "/results" },
    { label: "FAQ", path: "/faq" },
    { label: "Contact", path: "/contact" },
    { label: "Documentation", path: "/documentation" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-md border-b transition-colors duration-300 ${
        isLight
          ? "bg-white/85 border-slate-200/80 shadow-sm"
          : "bg-slate-950/85 border-slate-850/80 shadow-lg"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo & Title */}
          <button
            type="button"
            onClick={() => handleNav("/")}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Vote className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  VoTex
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] font-medium font-mono text-slate-500 dark:text-slate-400 block tracking-wider uppercase">
                Secure Civic Platform
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => handleNav(link.path)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs & Theme Switcher */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(isLight ? "dark" : "light")}
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Login CTA */}
            <button
              type="button"
              onClick={() => handleNav("/login")}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              Sign In
            </button>

            {/* Register CTA */}
            <button
              type="button"
              onClick={() => handleNav("/register")}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Create Account</span>
              <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isLight ? "dark" : "light")}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-850 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => handleNav(link.path)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPath === link.path
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleNav("/login")}
              className="w-full text-center py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleNav("/register")}
              className="w-full text-center py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20"
            >
              Create Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
