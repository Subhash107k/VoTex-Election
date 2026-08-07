import { Bell, Menu, Moon, RefreshCw, Search, Sun, UserCircle2 } from "lucide-react";

interface AdminTopbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onRefresh: () => void;
  onSearch?: (value: string) => void;
  onToggleMobileMenu?: () => void;
}

export default function AdminTopbar({
  theme,
  onToggleTheme,
  onRefresh,
  onSearch,
  onToggleMobileMenu,
}: AdminTopbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex w-full flex-1 items-center gap-3 sm:w-auto">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 sm:block">
          <Search className="h-4 w-4" />
        </div>
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:hidden" />
          <input
            type="search"
            placeholder="Search operations"
            onChange={(event) => onSearch?.(event.target.value)}
            className="w-full min-w-[150px] rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:w-80 sm:pl-3"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
          <UserCircle2 className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}
