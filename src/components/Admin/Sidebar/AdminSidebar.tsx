import {
  Award,
  BellRing,
  BookOpen,
  CalendarDays,
  FileText,
  Flag,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  KeyRound,
  Mail,
  Users,
  Vote,
  WalletCards,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ThemeMode } from "../../../types/auth.ts";
import type { AdminTab } from "../../../hooks/useAdmin.ts";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

const items: Array<{ id: string; label: string; icon: ReactNode }> = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  {
    id: "elections",
    label: "Elections",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    id: "candidates",
    label: "Candidates",
    icon: <WalletCards className="h-4 w-4" />,
  },
  {
    id: "parties",
    label: "Political Parties",
    icon: <Flag className="h-4 w-4" />,
  },
  { id: "voters", label: "Voters", icon: <Users className="h-4 w-4" /> },
  { id: "votes", label: "Votes", icon: <Vote className="h-4 w-4" /> },
  {
    id: "verification",
    label: "Verification",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText className="h-4 w-4" />,
  },
  { id: "reports", label: "Reports", icon: <BookOpen className="h-4 w-4" /> },
  {
    id: "notifications",
    label: "Notifications",
    icon: <BellRing className="h-4 w-4" />,
  },
  {
    id: "newsletter",
    label: "Election Bulletins",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    id: "admin-passwords",
    label: "Change Password of Admins",
    icon: <KeyRound className="h-4 w-4" />,
  },
];

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapsed,
  onLogout,
  theme,
  mobileMenuOpen,
  setMobileMenuOpen,
}: AdminSidebarProps) {
  const isLight = theme === "light";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-200/70 bg-white/90 p-3 backdrop-blur transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/90 md:relative md:min-h-screen md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "md:w-20" : "md:w-64"} w-64`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-linear-to-br from-blue-600 to-emerald-500 p-2.5 text-sm font-black text-white shadow-lg">
            NP
          </div>
          {!collapsed ? (
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Nepal Vote
              </div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Admin HQ
              </div>
            </div>
          ) : null}
        </div>
        {setMobileMenuOpen && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 md:inline-flex"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id as AdminTab)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow-md" : isLight ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              {item.icon}
              {!collapsed ? <span>{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-slate-200/70 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-red-950/30"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </aside>
  );
}
