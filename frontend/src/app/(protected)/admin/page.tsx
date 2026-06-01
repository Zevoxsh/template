"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, UserX, MailWarning, ArrowRight, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { AdminStats } from "@/types";
import { formatDate } from "@/lib/utils";

const ROLE_CHIP: Record<string, string> = {
  USER:       "bg-slate-100 text-slate-600",
  MODERATOR:  "bg-amber-50 text-amber-700",
  ADMIN:      "bg-indigo-50 text-indigo-700",
};

const STATS_CONFIG = [
  { key: "totalUsers",      label: "Utilisateurs",   icon: Users,        bg: "bg-blue-500",   light: "bg-blue-50",   text: "text-blue-600" },
  { key: "totalAdmins",     label: "Admins",          icon: Shield,       bg: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-600" },
  { key: "bannedUsers",     label: "Bannis",          icon: UserX,        bg: "bg-red-500",    light: "bg-red-50",    text: "text-red-600" },
  { key: "unverifiedUsers", label: "Non vérifiés",    icon: MailWarning,  bg: "bg-amber-500",  light: "bg-amber-50",  text: "text-amber-600" },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => { api.admin.getStats().then(setStats).catch(console.error); }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Vue d'ensemble</h1>
        <p className="text-sm text-slate-500 mt-0.5">Statistiques en temps réel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CONFIG.map(({ key, label, icon: Icon, light, text }) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <span className={`h-8 w-8 rounded-lg ${light} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${text}`} />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {stats ? stats[key] : "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Derniers inscrits</p>
          </div>
          <Link href="/admin/users" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats?.recentUsers.length ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-900">{u.name}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_CHIP[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-400">{u.createdAt ? formatDate(u.createdAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-400">Aucun utilisateur</div>
        )}
      </div>
    </div>
  );
}
