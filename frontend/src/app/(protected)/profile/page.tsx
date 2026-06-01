"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import {
  Camera, Check, Link2, Link2Off, ShieldCheck,
  User, Lock, KeyRound, AlertCircle, CalendarDays,
  Smartphone, Mail as MailIcon, Shield, Copy, RefreshCw,
} from "lucide-react";

// ─── Schemas ────────────────────────────────────────────────────────────────
const nameSchema = z.object({ name: z.string().min(2, "Min. 2 caractères") });
const emailSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Requis"),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Requis"),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { path: ["confirm"], message: "Ne correspond pas" });

type NameData = z.infer<typeof nameSchema>;
type EmailData = z.infer<typeof emailSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

// ─── Constants ──────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  USER: "Utilisateur",
  MODERATOR: "Modérateur",
  ADMIN: "Administrateur",
};
const ROLE_COLORS: Record<string, string> = {
  USER: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  MODERATOR: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  ADMIN: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
};
const PROVIDER_CONFIG: Record<string, { bg: string; text: string; abbr: string }> = {
  google:    { bg: "bg-white border border-slate-200", text: "text-slate-800", abbr: "Go" },
  github:    { bg: "bg-slate-900",                     text: "text-white",     abbr: "GH" },
  discord:   { bg: "bg-indigo-500",                    text: "text-white",     abbr: "Di" },
  microsoft: { bg: "bg-blue-600",                      text: "text-white",     abbr: "Ms" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function ProviderIcon({ name }: { name: string }) {
  const s = PROVIDER_CONFIG[name] ?? { bg: "bg-slate-100", text: "text-slate-700", abbr: name.slice(0, 2).toUpperCase() };
  return (
    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0", s.bg, s.text)}>
      {s.abbr}
    </div>
  );
}

function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
      type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
    )}>
      {type === "success"
        ? <Check className="h-4 w-4 shrink-0" />
        : <AlertCircle className="h-4 w-4 shrink-0" />}
      {msg}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, refresh } = useAuthContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [connections, setConnections] = useState<{ provider: string }[]>([]);
  const [availableProviders, setAvailableProviders] = useState<{ name: string; displayName: string }[]>([]);

  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connMsg, setConnMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA
  const [twoFaPolicy, setTwoFaPolicy] = useState<{ policy: string; methods: string[] } | null>(null);
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "totp-qr" | "totp-verify" | "email-sent" | "backup">( "idle");
  const [twoFaMsg, setTwoFaMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const flash = (set: (v: { type: "success" | "error"; text: string } | null) => void, type: "success" | "error", text: string) => {
    set({ type, text });
    setTimeout(() => set(null), type === "success" ? 3000 : 4000);
  };

  useEffect(() => {
    api.user.getProfile().then(({ oauthAccounts }) => setConnections(oauthAccounts ?? []));
    fetch("/api/auth/providers").then(r => r.json())
      .then(d => setAvailableProviders(d.oauth ?? [])).catch(() => {});
  }, []);

  const nameForm = useForm<NameData>({ resolver: zodResolver(nameSchema), defaultValues: { name: user?.name ?? "" } });
  const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema), defaultValues: { email: user?.email ?? "" } });
  const pwForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  // Pre-fill forms and compute gravatar once user data is loaded
  useEffect(() => {
    if (!user) return;
    nameForm.reset({ name: user.name });
    emailForm.reset({ email: user.email });
  }, [user?.id]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Erreur ${res.status}`);
      }
      await refresh();
      setAvatarPreview(null);
    } catch (e: any) {
      setAvatarPreview(null);
      setAvatarErr(e.message ?? "Échec de l'upload");
      setTimeout(() => setAvatarErr(null), 4000);
    } finally { setUploading(false); }
  };

  const avatar = avatarPreview ?? user?.avatarUrl;

  const onName = async (d: NameData) => {
    try { await api.user.updateProfile(d); await refresh(); flash(setNameMsg, "success", "Nom mis à jour avec succès"); }
    catch (e: any) { flash(setNameMsg, "error", e.message); }
  };

  const onEmail = async (d: EmailData) => {
    try { await api.user.changeEmail(d); await refresh(); flash(setEmailMsg, "success", "Email mis à jour avec succès"); }
    catch (e: any) { flash(setEmailMsg, "error", e.message); }
  };

  const onPw = async (d: PasswordData) => {
    try {
      await api.user.changePassword({ currentPassword: d.currentPassword, newPassword: d.newPassword });
      pwForm.reset();
      flash(setPwMsg, "success", "Mot de passe modifié avec succès");
    } catch (e: any) { flash(setPwMsg, "error", e.message); }
  };

  const unlink = async (provider: string) => {
    try {
      await api.user.unlinkConnection(provider);
      setConnections(c => c.filter(x => x.provider !== provider));
      flash(setConnMsg, "success", "Compte déconnecté avec succès");
    } catch (e: any) { flash(setConnMsg, "error", e.message); }
  };

  // ─── 2FA handlers ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/2fa/policy", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTwoFaPolicy({ policy: d.policy, methods: d.methods }); })
      .catch(() => {});
  }, []);

  const startTotpSetup = async () => {
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      const { qrCode: qr, secret } = await api.auth.twoFactor.totpSetup();
      setQrCode(qr);
      setTotpSecret(secret);
      setTwoFaStep("totp-qr");
    } catch (e: any) { flash(setTwoFaMsg, "error", e.message); }
    finally { setTwoFaLoading(false); }
  };

  const activateTotp = async () => {
    if (!totpCode.trim()) return;
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      const { backupCodes: codes } = await api.auth.twoFactor.totpActivate(totpCode);
      setBackupCodes(codes);
      setTwoFaStep("backup");
      setTotpCode("");
      await refresh();
    } catch (e: any) { flash(setTwoFaMsg, "error", e.message); }
    finally { setTwoFaLoading(false); }
  };

  const startEmailSetup = async () => {
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      await api.auth.twoFactor.emailSetup();
      setTwoFaStep("email-sent");
    } catch (e: any) { flash(setTwoFaMsg, "error", e.message); }
    finally { setTwoFaLoading(false); }
  };

  const activateEmail = async () => {
    if (!totpCode.trim()) return;
    setTwoFaLoading(true);
    setTwoFaMsg(null);
    try {
      const { backupCodes: codes } = await api.auth.twoFactor.emailActivate(totpCode);
      setBackupCodes(codes);
      setTwoFaStep("backup");
      setTotpCode("");
      await refresh();
    } catch (e: any) { flash(setTwoFaMsg, "error", e.message); }
    finally { setTwoFaLoading(false); }
  };

  const disable2FA = async () => {
    if (!confirm("Désactiver la double authentification ?")) return;
    setTwoFaLoading(true);
    try {
      await api.auth.twoFactor.disable();
      await refresh();
      setTwoFaStep("idle");
      flash(setTwoFaMsg, "success", "2FA désactivée");
    } catch (e: any) { flash(setTwoFaMsg, "error", e.message); }
    finally { setTwoFaLoading(false); }
  };

  const regenBackupCodes = async () => {
    setTwoFaLoading(true);
    try {
      const { backupCodes: codes } = await api.auth.twoFactor.regenerateBackupCodes();
      setBackupCodes(codes);
      setTwoFaStep("backup");
    } catch (e: any) { flash(setTwoFaMsg, "error", e.message); }
    finally { setTwoFaLoading(false); }
  };

  const copySecret = () => {
    if (totpSecret) navigator.clipboard.writeText(totpSecret);
  };

  const allProviders = [...new Set([...Object.keys(PROVIDER_CONFIG), ...availableProviders.map(p => p.name)])];

  return (
    <div className="flex-1 bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* ── Left: Profile card ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600" />

              <div className="px-5 pb-5">
                {/* Avatar row */}
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="group relative h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-md hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {avatar
                      ? <img src={avatar} alt="" className="h-full w-full object-cover" />
                      : user && <UserAvatar name={user.name} email={user.email} avatarUrl={null} size="lg" className="rounded-none w-full h-full" />
                    }
                    {uploading ? (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                        <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </button>

                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", ROLE_COLORS[user?.role ?? "USER"])}>
                    {ROLE_LABEL[user?.role ?? "USER"]}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-tight">{user?.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5 truncate">{user?.email}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                  {user?.emailVerified && (
                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Email vérifié</span>
                    </div>
                  )}
                  {user?.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Membre depuis{" "}
                        {new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {connections.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {connections.length} compte{connections.length > 1 ? "s" : ""} connecté{connections.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {avatarErr && (
              <div className="px-5 pb-4 -mt-2">
                <Toast type="error" msg={avatarErr} />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* ── Right: Forms ───────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Personal Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader
                icon={User}
                title="Informations personnelles"
                description="Mettez à jour votre nom d'affichage et votre adresse email"
              />

              <div className="space-y-6">
                <form onSubmit={nameForm.handleSubmit(onName)} className="space-y-3">
                  <Input
                    label="Nom d'affichage"
                    placeholder="Jean Dupont"
                    error={nameForm.formState.errors.name?.message}
                    {...nameForm.register("name")}
                  />
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {nameMsg ? <Toast type={nameMsg.type} msg={nameMsg.text} /> : <span />}
                    <Button type="submit" size="sm" loading={nameForm.formState.isSubmitting}>
                      Enregistrer
                    </Button>
                  </div>
                </form>

                <div className="border-t border-slate-100" />

                <form onSubmit={emailForm.handleSubmit(onEmail)} className="space-y-3">
                  <Input
                    label="Adresse email"
                    type="email"
                    placeholder="vous@exemple.com"
                    error={emailForm.formState.errors.email?.message}
                    {...emailForm.register("email")}
                  />
                  <Input
                    label="Confirmer avec votre mot de passe"
                    type="password"
                    placeholder="Mot de passe actuel"
                    error={emailForm.formState.errors.password?.message}
                    {...emailForm.register("password")}
                  />
                  <div className="flex items-center justify-between gap-3 pt-1">
                    {emailMsg ? <Toast type={emailMsg.type} msg={emailMsg.text} /> : <span />}
                    <Button type="submit" size="sm" loading={emailForm.formState.isSubmitting}>
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader
                icon={Lock}
                title="Sécurité"
                description="Modifiez votre mot de passe pour protéger votre compte"
              />

              <form onSubmit={pwForm.handleSubmit(onPw)} className="space-y-3">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  placeholder="••••••••"
                  error={pwForm.formState.errors.currentPassword?.message}
                  {...pwForm.register("currentPassword")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nouveau mot de passe"
                    type="password"
                    placeholder="••••••••"
                    error={pwForm.formState.errors.newPassword?.message}
                    {...pwForm.register("newPassword")}
                  />
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    placeholder="••••••••"
                    error={pwForm.formState.errors.confirm?.message}
                    {...pwForm.register("confirm")}
                  />
                </div>
                <p className="text-xs text-slate-400">Min. 8 caractères, une majuscule et un chiffre requis</p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  {pwMsg ? <Toast type={pwMsg.type} msg={pwMsg.text} /> : <span />}
                  <Button type="submit" size="sm" loading={pwForm.formState.isSubmitting}>
                    Modifier le mot de passe
                  </Button>
                </div>
              </form>
            </div>

            {/* 2FA */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader
                icon={Shield}
                title="Double authentification (2FA)"
                description={
                  twoFaPolicy?.policy === "REQUIRED"
                    ? "Obligatoire sur ce site — configurez une méthode ci-dessous"
                    : twoFaPolicy?.policy === "DISABLED"
                    ? "Désactivée par l'administrateur"
                    : "Renforcez la sécurité de votre compte"
                }
              />

              {twoFaMsg && <div className="mb-4"><Toast type={twoFaMsg.type} msg={twoFaMsg.text} /></div>}

              {twoFaPolicy?.policy === "DISABLED" ? (
                <p className="text-sm text-slate-400 italic">La 2FA est désactivée sur ce site.</p>
              ) : user?.twoFactorEnabled && twoFaStep === "idle" ? (
                /* ── Enabled state ── */
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border",
                    user.twoFactorMethod === "totp" ? "bg-indigo-50 border-indigo-100" : "bg-blue-50 border-blue-100"
                  )}>
                    {user.twoFactorMethod === "totp"
                      ? <Smartphone className="h-5 w-5 text-indigo-500 shrink-0" />
                      : <MailIcon className="h-5 w-5 text-blue-500 shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {user.twoFactorMethod === "totp" ? "Application d'authentification" : "Email OTP"} activé
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Votre compte est protégé par la 2FA.</p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-green-500 ml-auto shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={regenBackupCodes} loading={twoFaLoading}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Codes de secours
                    </Button>
                    {twoFaPolicy?.policy !== "REQUIRED" && (
                      <Button size="sm" variant="danger" onClick={disable2FA} loading={twoFaLoading}>
                        Désactiver la 2FA
                      </Button>
                    )}
                  </div>
                </div>

              ) : twoFaStep === "backup" ? (
                /* ── Backup codes display ── */
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Sauvegardez ces codes de secours</p>
                    <p className="text-xs text-amber-700 mb-3">Chaque code ne peut être utilisé qu'une seule fois. Conservez-les dans un endroit sûr.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {backupCodes?.map(code => (
                        <code key={code} className="text-center text-sm font-mono bg-white border border-amber-200 rounded-lg px-3 py-2 text-slate-700">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setTwoFaStep("idle")}>
                    <Check className="h-3.5 w-3.5 mr-1.5" />Compris, j'ai sauvegardé mes codes
                  </Button>
                </div>

              ) : twoFaStep === "totp-qr" ? (
                /* ── TOTP QR code ── */
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Scannez ce QR code avec votre application (Google Authenticator, Authy…)</p>
                  {qrCode && <img src={qrCode} alt="QR Code 2FA" className="w-44 h-44 rounded-xl border border-slate-200" />}
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Ou entrez la clé manuellement :</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 break-all text-slate-600">
                        {totpSecret}
                      </code>
                      <button onClick={copySecret} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Copier">
                        <Copy className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Code de vérification</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000 000"
                        maxLength={7}
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && activateTotp()}
                        className="flex-1 text-center text-xl font-mono tracking-widest border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <Button onClick={activateTotp} loading={twoFaLoading}>Activer</Button>
                    </div>
                    {twoFaMsg && <Toast type={twoFaMsg.type} msg={twoFaMsg.text} />}
                  </div>
                  <button onClick={() => setTwoFaStep("idle")} className="text-sm text-slate-400 hover:text-slate-600">← Annuler</button>
                </div>

              ) : twoFaStep === "email-sent" ? (
                /* ── Email OTP verify ── */
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Un code à 6 chiffres a été envoyé à <strong>{user?.email}</strong></p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Code de vérification</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && activateEmail()}
                        className="flex-1 text-center text-xl font-mono tracking-widest border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <Button onClick={activateEmail} loading={twoFaLoading}>Activer</Button>
                    </div>
                    {twoFaMsg && <Toast type={twoFaMsg.type} msg={twoFaMsg.text} />}
                  </div>
                  <button onClick={() => setTwoFaStep("idle")} className="text-sm text-slate-400 hover:text-slate-600">← Annuler</button>
                </div>

              ) : (
                /* ── Choose method ── */
                <div className="space-y-3">
                  {(twoFaPolicy?.methods ?? ["totp", "email"]).includes("totp") && (
                    <button
                      onClick={startTotpSetup}
                      disabled={twoFaLoading}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <Smartphone className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Application d'authentification</p>
                        <p className="text-xs text-slate-400 mt-0.5">Google Authenticator, Authy, 1Password…</p>
                      </div>
                      <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Configurer →</span>
                    </button>
                  )}
                  {(twoFaPolicy?.methods ?? ["totp", "email"]).includes("email") && (
                    <button
                      onClick={startEmailSetup}
                      disabled={twoFaLoading}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <MailIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Email OTP</p>
                        <p className="text-xs text-slate-400 mt-0.5">Recevez un code à usage unique par email</p>
                      </div>
                      <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Configurer →</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Connected Accounts */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionHeader
                icon={KeyRound}
                title="Comptes connectés"
                description="Liez des services tiers pour vous connecter plus rapidement"
              />

              {connMsg && (
                <div className="mb-4">
                  <Toast type={connMsg.type} msg={connMsg.text} />
                </div>
              )}

              <div className="space-y-2.5">
                {allProviders.map(name => {
                  const isLinked = connections.some(c => c.provider === name);
                  const available = availableProviders.find(p => p.name === name);
                  const label = available?.displayName ?? name.charAt(0).toUpperCase() + name.slice(1);

                  return (
                    <div
                      key={name}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-colors",
                        isLinked
                          ? "border-green-100 bg-green-50/40"
                          : "border-slate-100 bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ProviderIcon name={name} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{label}</p>
                          <p className={cn("text-xs mt-0.5", isLinked ? "text-green-600 font-medium" : "text-slate-400")}>
                            {isLinked ? "✓ Connecté" : available ? "Non connecté" : "Non disponible"}
                          </p>
                        </div>
                      </div>

                      {isLinked ? (
                        <Button size="sm" variant="outline" onClick={() => unlink(name)}>
                          <Link2Off className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          Déconnecter
                        </Button>
                      ) : available ? (
                        <a href={`/api/auth/oauth/${name}`}>
                          <Button size="sm" variant="secondary">
                            <Link2 className="h-3.5 w-3.5 mr-1.5" />
                            Connecter
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300 px-2">Non configuré</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
