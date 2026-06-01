"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils";
import { Mail, RotateCcw, Shield, ShieldOff, CheckCircle, Trash2, ImageOff } from "lucide-react";

const ROLE_CHIP: Record<string, string> = {
  USER:      "bg-slate-100 text-slate-600",
  MODERATOR: "bg-amber-50 text-amber-700",
  ADMIN:     "bg-violet-50 text-violet-700",
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
      const { user: u } = await api.admin.updateUser(id, data);
      setUser(u);
      flash("Mis à jour.");
    } catch (e: any) { flash(e.message, "error"); }
  };

  const resetPassword = async () => {
    try { await api.admin.sendPasswordReset(id); flash("Email de réinitialisation envoyé."); }
    catch (e: any) { flash(e.message, "error"); }
  };

  const resetAvatar = async () => {
    if (!confirm(`Supprimer la photo de profil de ${user?.name} et lui envoyer un avertissement ?`)) return;
    try {
      const { user: u } = await api.admin.resetUserAvatar(id);
      setUser(u);
      flash("Photo de profil supprimée — l'utilisateur sera averti.");
    } catch (e: any) { flash(e.message, "error"); }
  };

  const sendVerification = async () => {
    try { await api.admin.sendEmailVerification(id); flash("Email de vérification envoyé."); }
    catch (e: any) { flash(e.message, "error"); }
  };

  const deleteUser = async () => {
    if (!confirm(`Supprimer ${user?.name} ? Action irréversible.`)) return;
    try { await api.admin.deleteUser(id); router.push("/admin/users"); }
    catch (e: any) { flash(e.message, "error"); }
  };

  if (loading) return <p className="text-sm text-slate-400 py-8">Chargement…</p>;
  if (!user) return <p className="text-sm text-red-600 py-8">Utilisateur introuvable.</p>;

  return (
    <div className="space-y-5">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: infos + rôle */}
        <div className="lg:col-span-1 space-y-5">
          {/* Avatar + statut */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size="md" className="h-14 w-14 text-xl" />
              {user.avatarFlagged && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-400 rounded-full border-2 border-white" title="Photo signalée" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-sm text-slate-400 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_CHIP[user.role] ?? "bg-slate-100 text-slate-600"}`}>
                  {user.role}
                </span>
                {user.banned && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">Banni</span>}
                {!user.emailVerified && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Non vérifié</span>}
              </div>
            </div>
          </div>

          {/* Infos détail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Détails</p>
            </div>
            <div className="px-5 divide-y divide-slate-50">
              <InfoRow label="ID"><code className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{user.id}</code></InfoRow>
              <InfoRow label="Inscription">{user.createdAt ? formatDate(user.createdAt) : "—"}</InfoRow>
              <InfoRow label="Email">
                {user.emailVerified
                  ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Vérifié</span>
                  : <span className="text-xs text-amber-600 font-medium">Non vérifié</span>}
              </InfoRow>
              {user.banned && user.bannedReason && (
                <InfoRow label="Raison ban"><span className="text-xs text-red-600">{user.bannedReason}</span></InfoRow>
              )}
            </div>
          </div>

          {/* Rôle */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rôle</p>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {(["USER", "MODERATOR", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => update({ role: r })}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    user.role === r
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sécurité */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sécurité</p>
            </div>
            <div className="divide-y divide-slate-50">
              <ActionRow
                icon={<Mail className="h-4 w-4 text-slate-400" />}
                label="Réinitialiser le mot de passe"
                description="Envoie un email de réinitialisation à l'utilisateur"
                action={<Button size="sm" variant="outline" onClick={resetPassword}>Envoyer l'email</Button>}
              />
              {!user.emailVerified && (
                <>
                  <ActionRow
                    icon={<Mail className="h-4 w-4 text-slate-400" />}
                    label="Renvoyer la vérification email"
                    description="Envoie un nouvel email de confirmation"
                    action={<Button size="sm" variant="outline" onClick={sendVerification}>Envoyer</Button>}
                  />
                  <ActionRow
                    icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                    label="Valider l'email manuellement"
                    description="Marquer l'email comme vérifié sans envoyer d'email"
                    action={<Button size="sm" variant="secondary" onClick={() => update({ emailVerified: true })}>Valider</Button>}
                  />
                </>
              )}
            </div>
          </div>

          {/* Modération */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modération</p>
            </div>
            <div className="divide-y divide-slate-50">
              <ActionRow
                icon={<ImageOff className="h-4 w-4 text-amber-500" />}
                label="Supprimer la photo de profil"
                description={user.avatarFlagged ? "Photo déjà supprimée — avertissement actif" : "Retire la photo et avertit l'utilisateur"}
                action={
                  <Button size="sm" variant="outline" onClick={resetAvatar} disabled={!user.avatarUrl && user.avatarFlagged}>
                    <ImageOff className="h-3.5 w-3.5 mr-1.5" />
                    {user.avatarFlagged ? "Signalée" : "Retirer"}
                  </Button>
                }
              />
              {user.banned ? (
                <ActionRow
                  icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                  label="Débannir l'utilisateur"
                  description="Restaurer l'accès complet au compte"
                  action={<Button size="sm" variant="secondary" onClick={() => update({ banned: false })}>Débannir</Button>}
                />
              ) : (
                <ActionRow
                  icon={<ShieldOff className="h-4 w-4 text-amber-500" />}
                  label="Bannir l'utilisateur"
                  description="Bloquer l'accès au compte immédiatement"
                  action={<Button size="sm" variant="danger" onClick={() => update({ banned: true })}>Bannir</Button>}
                />
              )}
              <ActionRow
                icon={<Trash2 className="h-4 w-4 text-red-400" />}
                label="Supprimer le compte"
                description="Suppression définitive de toutes les données"
                action={<Button size="sm" variant="danger" onClick={deleteUser}>Supprimer</Button>}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-4">
      <span className="text-xs font-medium text-slate-400 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 text-right">{children}</span>
    </div>
  );
}

function ActionRow({ icon, label, description, action }: {
  icon: React.ReactNode; label: string; description: string; action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
