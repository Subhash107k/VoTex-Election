import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Users,
  Vote,
  WalletCards,
} from "lucide-react";
import type {
  DashboardStats,
  Election,
  Notification,
  User,
} from "../../../types.js";
import { PageHeader } from "../../../components/Admin/Shared/PageHeader.tsx";
import { StatCard } from "../../../components/Admin/Shared/StatCard.tsx";
import { SectionCard } from "../../../components/Admin/Shared/SectionCard.tsx";

interface DashboardProps {
  stats: DashboardStats | null;
  elections: Election[];
  notifications: Notification[];
  voters: User[];
  team?: User[];
  loading: boolean;
}

export default function Dashboard({
  stats,
  elections,
  notifications,
  voters,
  team,
  loading,
}: DashboardProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Admin Dashboard"
          description="Loading live operational overview..."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-slate-200/70 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/70"
            />
          ))}
        </div>
      </div>
    );
  }

  const activeElection =
    elections.find((election) => election.status === "Active") ?? elections[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        description="Operational readiness, election momentum, and recent activity at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total users"
          value={voters.length}
          subtitle="Registered accounts in the system"
          icon={<Users className="h-4 w-4" />}
          accent="text-blue-600"
        />
        <StatCard
          title="Total admins"
          value={stats.metrics.totalAdmins ?? team?.length ?? 1}
          subtitle="System operators & administrators"
          icon={<UserCheck className="h-4 w-4" />}
          accent="text-purple-600"
        />
        <StatCard
          title="Active voters"
          value={stats.metrics.verifiedVoters}
          subtitle="Biometrically verified citizens"
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="text-emerald-600"
        />
        <StatCard
          title="Candidates"
          value={stats.metrics.totalCandidates}
          subtitle="Profiles awaiting or already approved"
          icon={<WalletCards className="h-4 w-4" />}
          accent="text-amber-600"
        />
        <StatCard
          title="Votes cast"
          value={stats.metrics.totalVotes}
          subtitle="Audited ballots recorded"
          icon={<Vote className="h-4 w-4" />}
          accent="text-indigo-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <SectionCard
          title="Election pulse"
          description="Live status and recent activity across the current election cycle."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <Activity className="h-4 w-4" />
                {activeElection?.title ?? "No active election"}
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {activeElection
                  ? `${activeElection.status} • ${new Date(activeElection.startDate).toLocaleDateString()} → ${new Date(activeElection.endDate).toLocaleDateString()}`
                  : "No election data is currently being tracked."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <CalendarDays className="h-4 w-4" /> Turnout
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {stats.metrics.turnoutPercent}%
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4" /> Verification backlog
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {Math.max(
                    0,
                    stats.metrics.totalCandidates -
                      stats.metrics.verifiedVoters,
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Latest notifications"
          description="System updates and operator alerts."
        >
          <div className="space-y-3">
            {notifications.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />{" "}
                  {item.title}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
