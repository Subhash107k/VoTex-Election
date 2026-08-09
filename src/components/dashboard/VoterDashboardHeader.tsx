import React, { useState } from "react";
import {
  Shield,
  Bell,
  Search,
  Moon,
  Sun,
  RefreshCw,
  LogOut,
  UserCheck,
  CheckCircle2,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
} from "lucide-react";

import type { ThemeMode } from "../../types/auth";

type DashboardTab =
  | "overview" | "documents" | "family" | "timeline" | "elections" | "myVotes";

interface VoterDashboardHeaderProps {
  user: any;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  theme?: ThemeMode;
  setTheme?: (theme: ThemeMode) => void;
}

export default function VoterDashboardHeader({
  user,
  onLogout,
  onRefresh,
  isRefreshing,
  activeTab,
  setActiveTab,
  setCurrentPath,
  theme = "dark",
  setTheme,
}: VoterDashboardHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleTheme = () => {
    if (setTheme) {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  const name = user?.fullName || "Voter Citizen";
  const customAvatar =
    user?.profilePhoto || user?.profilePicture || user?.faceImage;
  const isCustomPhoto =
    customAvatar &&
    !customAvatar.includes("unsplash.com") &&
    !customAvatar.includes("ui-avatars.com");

  const getInitials = (fullName: string): string => {
    if (!fullName) return "V";
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "V";
    return words.map((w) => w[0].toUpperCase()).join("");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-black tracking-tight text-slate-900 dark:text-white text-base">
                VoTex Election
                <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Secure Portal
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                National Digital Voting System
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md items-center relative">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, election, or news..."
              className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Desktop Action Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Quick Refresh */}
            <button
              onClick={onRefresh}
              title="Sync real-time data"
              className={`p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ${
                isRefreshing ? "animate-spin text-blue-500" : ""
              }`}
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>

            {/* Theme Switcher */}
            {setTheme && (
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-4.5 w-4.5 text-amber-400" />
                ) : (
                  <Moon className="h-4.5 w-4.5 text-slate-700" />
                )}
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors relative"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
                </span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Notifications
                    </h4>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      3 New
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Election Opened
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        House of Representatives voting is live.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Profile Verified
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Your identity biometrics passed security checks.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                {isCustomPhoto ? (
                  <img
                    src={customAvatar}
                    alt={name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/30"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 font-extrabold text-[11px] text-white ring-2 ring-blue-500/30 shadow-xs tracking-wider">
                    {getInitials(name)}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {name}
                    </p>
                    <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                      ID: {user?.nationalID || user?.citizenshipNumber || "N/A"}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentPath("/profile/edit");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <User className="h-4 w-4 text-blue-500" /> View / Edit
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setActiveTab("overview");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <UserCheck className="h-4 w-4 text-emerald-500" />{" "}
                      Biometric Status
                    </button>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-red-500" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-2">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                {isCustomPhoto ? (
                  <img
                    src={customAvatar}
                    alt={name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 font-extrabold text-[11px] text-white shadow-xs tracking-wider">
                    {getInitials(name)}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {name}
                </span>
              </div>
              {setTheme && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                setCurrentPath("/profile/edit");
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              View / Edit Profile
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
            >
              <LogOut className="h-4 w-4 text-red-500" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
