"use client";

import Link from "next/link";
import { Shield, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useAuthContext } from "@/context/auth-context";
import { formatDate } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  USER: "Utilisateur",
  MODERATOR: "Modérateur",
  ADMIN: "Administrateur",
};

const ROLE_COLOR: Record<string, string> = {
  USER: "bg-blue-50 text-blue-700 border-blue-200",
  MODERATOR: "bg-amber-50 text-amber-700 border-amber-200",
  ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function DashboardPage() {
  const { user } = useAuthContext();
  if (!user) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bonjour, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {user.createdAt ? `Membre depuis le ${formatDate(user.createdAt)}` : "Bienvenue sur votre espace"}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Mon compte</p>
        </div>
        <div className="divide-y divide-slate-100">
          <Row label="Nom" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Rôle">
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_COLOR[user.role] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </Row>
          <Row label="Email vérifié">
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Vérifié
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                <Clock className="h-4 w-4" /> En attente
              </span>
            )}
          </Row>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Modifier mon profil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {user.role === "ADMIN" && (
        <div className="bg-indigo-600 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Panneau d'administration</p>
              <p className="text-xs text-indigo-200 mt-0.5">Gérez les utilisateurs, les rôles et les paramètres</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors shrink-0"
          >
            Accéder
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5">
      <span className="text-sm text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 text-right">{value ?? children}</span>
    </div>
  );
}
