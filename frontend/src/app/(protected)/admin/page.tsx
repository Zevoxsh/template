"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, UserX, MailWarning, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { api } from "@/lib/api";
import { AdminStats } from "@/types";
import { formatDate } from "@/lib/utils";

const ROLE_CHIP: Record<string, string> = {
  USER:      "bg-slate-100 text-slate-600",
  MODERATOR: "bg-amber-50 text-amber-700",
  ADMIN:     "bg-violet-50 text-violet-700",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => { api.admin.getStats().then(setStats).catch(console.error); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Vue d'ensemble" description="Tableau de bord administrateur" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Utilisateurs"
          value={stats?.totalUsers}
          icon={<Users className="h-4 w-4" />}
          accent="border-t-blue-500"
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Admins"
          value={stats?.totalAdmins}
          icon={<Shield className="h-4 w-4" />}
          accent="border-t-violet-500"
          iconBg="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Bannis"
          value={stats?.bannedUsers}
          icon={<UserX className="h-4 w-4" />}
          accent="border-t-red-500"
          iconBg="bg-red-50 text-red-600"
        />
        <StatCard
          label="Non vérifiés"
          value={stats?.unverifiedUsers}
          icon={<MailWarning className="h-4 w-4" />}
          accent="border-t-amber-500"
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Recent users table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Derniers inscrits</p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Voir tout <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {stats?.recentUsers.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-400 tracking-wider">NOM</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-400 tracking-wider">EMAIL</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-400 tracking-wider">RÔLE</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-400 tracking-wider">INSCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className={`transition-colors hover:bg-slate-50/80 ${i < stats.recentUsers.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-5 py-3 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_CHIP[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{u.createdAt ? formatDate(u.createdAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Aucun utilisateur</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, accent, iconBg,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-t-2 ${accent} p-5 flex items-start justify-between`}>
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
        <p className="text-3xl font-bold text-slate-900 leading-none">
          {value ?? <span className="text-slate-300">—</span>}
        </p>
      </div>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}
