"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, Ban, MailWarning } from "lucide-react";
import { api } from "@/lib/api";
import { AdminStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.admin.getStats().then(setStats).catch(console.error);
  }, []);

  const roleBadge: Record<string, "info" | "warning" | "danger"> = {
    USER: "info", MODERATOR: "warning", ADMIN: "danger",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de l'application</p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} color="bg-blue-100 text-blue-600" />
            <StatCard icon={Shield} label="Admins" value={stats.totalAdmins} color="bg-indigo-100 text-indigo-600" />
            <StatCard icon={Ban} label="Bannis" value={stats.bannedUsers} color="bg-red-100 text-red-600" />
            <StatCard icon={MailWarning} label="Non vérifiés" value={stats.unverifiedUsers} color="bg-yellow-100 text-yellow-600" />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Derniers inscrits</CardTitle>
                <Link href="/admin/users" className="text-sm text-indigo-600 hover:text-indigo-700">
                  Voir tous →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-3">
                        <Badge variant={roleBadge[user.role] ?? "default"}>{user.role}</Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {user.createdAt ? formatDate(user.createdAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
