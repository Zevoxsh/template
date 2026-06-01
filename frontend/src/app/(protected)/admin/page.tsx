"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, UserX, MailWarning, ArrowUpRight, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const ROLE_CHIP: Record<string, string> = {
  USER: "bg-slate-100 text-slate-600",
  MODERATOR: "bg-amber-50 text-amber-700",
  ADMIN: "bg-violet-50 text-violet-700",
};

const PERIODS = [
  { label: "7j", days: 7 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
];

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    api.admin.getDetailedStats(days).then(setStats).catch(console.error);
  }, [days]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vue d'ensemble"
        description="Tableau de bord administrateur"
        actions={
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  days === p.days ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Utilisateurs total" value={stats?.totalUsers} color="blue" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Actifs" value={stats ? stats.totalUsers - stats.bannedUsers : undefined} color="green" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Bannis" value={stats?.bannedUsers} color="red" icon={<UserX className="h-4 w-4" />} />
        <StatCard label="Non vérifiés" value={stats?.unverifiedUsers} color="amber" icon={<MailWarning className="h-4 w-4" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Inscriptions" data={stats?.signups ?? []} color="#6366f1" />
        <ChartCard title="Connexions" data={stats?.logins ?? []} color="#8b5cf6" />
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Derniers inscrits</p>
          <Link href="/admin/users" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            Voir tout <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {stats?.recentUsers?.length ? (
          <div className="divide-y divide-slate-50">
            {stats.recentUsers.map((u: any) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <UserAvatar name={u.name} email={u.email} avatarUrl={u.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_CHIP[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {u.role}
                  </span>
                  <span className="text-xs text-slate-400">{u.createdAt ? formatDate(u.createdAt) : "—"}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Aucun utilisateur</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: "/admin/audit-logs", label: "Journal d'activité", desc: "Actions sensibles récentes" },
          { href: "/admin/security", label: "Sécurité", desc: "IPs bloquées, notifications" },
          { href: "/admin/email-templates", label: "Email templates", desc: "Personnaliser les emails" },
        ].map(l => (
          <Link key={l.href} href={l.href} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{l.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value?: number; color: string; icon: React.ReactNode }) {
  const colors: Record<string, { border: string; bg: string; text: string }> = {
    blue:  { border: "border-t-blue-500",   bg: "bg-blue-50",   text: "text-blue-600" },
    green: { border: "border-t-green-500",  bg: "bg-green-50",  text: "text-green-600" },
    red:   { border: "border-t-red-500",    bg: "bg-red-50",    text: "text-red-600" },
    amber: { border: "border-t-amber-500",  bg: "bg-amber-50",  text: "text-amber-600" },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-t-2 ${c.border} p-5 flex items-start justify-between shadow-sm`}>
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
        <p className="text-3xl font-bold text-slate-900 leading-none">{value ?? <span className="text-slate-300">—</span>}</p>
      </div>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>{icon}</div>
    </div>
  );
}

function ChartCard({ title, data, color }: { title: string; data: { date: string; count: number }[]; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm font-semibold text-slate-800 mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            labelFormatter={(label: any) => typeof label === "string" ? fmtDate(label) : label}
          />
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#grad-${title})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
