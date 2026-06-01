"use client";

import Link from "next/link";
import { Shield, User } from "lucide-react";
import { useAuthContext } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthContext();

  if (!user) return null;

  const roleBadge: Record<string, "info" | "warning" | "danger"> = {
    USER: "info", MODERATOR: "warning", ADMIN: "danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user.name} 👋</h1>
        <p className="text-gray-500 mt-1">Bienvenue sur votre tableau de bord.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Votre rôle</p>
              <Badge variant={roleBadge[user.role] ?? "default"}>{user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-lg">{user.emailVerified ? "✅" : "⚠️"}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900 text-sm">
                {user.emailVerified ? "Vérifié" : "Non vérifié"}
              </p>
            </div>
          </CardContent>
        </Card>

        {user.createdAt && (
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Membre depuis</p>
                <p className="font-medium text-gray-900 text-sm">{formatDate(user.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {user.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Accès administrateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Gérez les utilisateurs, les rôles et les paramètres du site.</p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Shield className="h-4 w-4" />
              Panneau admin
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
