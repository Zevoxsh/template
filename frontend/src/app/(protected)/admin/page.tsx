"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, UserX, MailWarning, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { AdminStats } from "@/types";
import { formatDate } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

const ROLE_CHIP: Record<string, string> = {
  USER: "bg-slate-100 text-slate-600",
  MODERATOR: "bg-amber-50 text-amber-700",
  ADMIN: "bg-indigo-50 text-indigo-700",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.admin.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Vue d'ensemble</h1>
        <p className="text-sm text-slate-500 mt-0.5">Statistiques générales de l'application</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}       label="Utilisateurs"  value={stats.totalUsers}       color="bg-blue-50 text-blue-600" />
            <StatCard icon={Shield}      label="Admins"        value={stats.totalAdmins}      color="bg-indigo-50 text-indigo-600" />
            <StatCard icon={UserX}       label="Bannis"        value={stats.bannedUsers}      color="bg-red-50 text-red-600" />
            <StatCard icon={MailWarning} label="Non vérifiés"  value={stats.unverifiedUsers}  color="bg-amber-50 text-amber-600" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Derniers inscrits</p>
              <Link href="/admin/users" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_CHIP[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">{u.createdAt ? formatDate(u.createdAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
