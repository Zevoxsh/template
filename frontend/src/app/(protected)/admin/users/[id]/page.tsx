"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils";

const ROLE_CHIP: Record<string, string> = {
  USER: "bg-slate-100 text-slate-600",
  MODERATOR: "bg-amber-50 text-amber-700",
  ADMIN: "bg-violet-50 text-violet-700",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api.admin.getUser(id).then(({ user }) => setUser(user)).finally(() => setLoading(false));
  }, [id]);

  const flash = (text: string, type: "success" | "error" = "success") => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const update = async (data: Partial<User & { bannedReason?: string }>) => {
    try {
      const { user: updated } = await api.admin.updateUser(id, data);
      setUser(updated);
      flash("Mis à jour.");
    } catch (e: any) { flash(e.message, "error"); }
  };

  const resetPassword = async () => {
    try { await api.admin.sendPasswordReset(id); flash("Email de réinitialisation envoyé."); }
    catch (e: any) { flash(e.message, "error"); }
  };

  const sendVerification = async () => {
    try { await api.admin.sendEmailVerification(id); flash("Email de vérification envoyé."); }
    catch (e: any) { flash(e.message, "error"); }
  };

  if (loading) return <p className="text-sm text-slate-400 py-8">Chargement…</p>;
  if (!user) return <p className="text-sm text-red-600 py-8">Utilisateur introuvable.</p>;

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={<Button variant="ghost" size="sm" onClick={() => router.back()}>← Retour</Button>}
      />

      {msg && (
        <div className={`text-sm rounded-lg px-4 py-3 ${msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Infos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Informations</p>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <Row label="ID"><span className="font-mono text-xs text-slate-500">{user.id}</span></Row>
          <Row label="Email"><span className="text-sm text-slate-700">{user.email}</span></Row>
          <Row label="Rôle">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_CHIP[user.role] ?? "bg-slate-100 text-slate-600"}`}>
              {user.role}
            </span>
          </Row>
          <Row label="Email vérifié">
            {user.emailVerified
              ? <span className="text-xs font-medium text-green-600">✓ Vérifié</span>
              : <span className="text-xs font-medium text-amber-600">⚠ Non vérifié</span>}
          </Row>
          <Row label="Statut">
            {user.banned
              ? <span className="text-xs font-medium text-red-600">Banni — {user.bannedReason ?? "sans raison"}</span>
              : <span className="text-xs font-medium text-green-600">Actif</span>}
          </Row>
          {user.createdAt && <Row label="Inscription"><span className="text-sm text-slate-500">{formatDate(user.createdAt)}</span></Row>}
        </div>
      </div>

      {/* Rôle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Changer le rôle</p>
        </div>
        <div className="px-5 py-4 flex gap-2 flex-wrap">
          {["USER", "MODERATOR", "ADMIN"].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={user.role === r ? "primary" : "outline"}
              onClick={() => update({ role: r as any })}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <ActionRow
            label="Réinitialiser le mot de passe"
            description="Envoie un email de réinitialisation à l'utilisateur"
            action={<Button size="sm" variant="outline" onClick={resetPassword}>Envoyer</Button>}
          />
          {!user.emailVerified && (
            <ActionRow
              label="Renvoyer la vérification email"
              description="Envoie un nouvel email de vérification"
              action={<Button size="sm" variant="outline" onClick={sendVerification}>Envoyer</Button>}
            />
          )}
          {!user.emailVerified && (
            <ActionRow
              label="Marquer l'email comme vérifié"
              description="Valider manuellement sans envoyer d'email"
              action={<Button size="sm" variant="secondary" onClick={() => update({ emailVerified: true })}>Valider</Button>}
            />
          )}
          {user.banned ? (
            <ActionRow
              label="Débannir l'utilisateur"
              description="Restaurer l'accès au compte"
              action={<Button size="sm" variant="secondary" onClick={() => update({ banned: false })}>Débannir</Button>}
            />
          ) : (
            <ActionRow
              label="Bannir l'utilisateur"
              description="Bloquer définitivement l'accès au compte"
              action={<Button size="sm" variant="danger" onClick={() => update({ banned: true })}>Bannir</Button>}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-xs font-medium text-slate-500 w-28 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function ActionRow({ label, description, action }: { label: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
