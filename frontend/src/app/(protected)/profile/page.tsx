"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Trash2, Check, X, Link2, Link2Off } from "lucide-react";

// ─── Schemas ────────────────────────────────────────
const nameSchema = z.object({ name: z.string().min(2, "Minimum 2 caractères") });
const emailSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Requis"),
  newPassword: z.string().min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  path: ["confirmPassword"], message: "Ne correspond pas",
});

type NameData = z.infer<typeof nameSchema>;
type EmailData = z.infer<typeof emailSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

// ─── Flash banner ────────────────────────────────────
function Flash({ msg }: { msg: { type: "success" | "error"; text: string } | null }) {
  if (!msg) return null;
  return (
    <p className={`text-xs font-medium ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
      {msg.type === "success" ? "✓ " : "✗ "}{msg.text}
    </p>
  );
}

// ─── Section card ────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── OAuth provider icons / labels ──────────────────
const PROVIDERS: Record<string, { label: string; color: string; bg: string }> = {
  google:    { label: "Google",    color: "text-red-600",    bg: "bg-red-50" },
  github:    { label: "GitHub",    color: "text-slate-800",  bg: "bg-slate-100" },
  discord:   { label: "Discord",   color: "text-indigo-600", bg: "bg-indigo-50" },
  microsoft: { label: "Microsoft", color: "text-blue-600",   bg: "bg-blue-50" },
};

function ProviderIcon({ name }: { name: string }) {
  const p = PROVIDERS[name];
  return (
    <span className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${p?.bg ?? "bg-slate-100"} ${p?.color ?? "text-slate-600"}`}>
      {(p?.label ?? name)[0].toUpperCase()}
    </span>
  );
}

// ─── Main page ───────────────────────────────────────
export default function ProfilePage() {
  const { user, refresh } = useAuthContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [connections, setConnections] = useState<{ provider: string }[]>([]);
  const [availableProviders, setAvailableProviders] = useState<{ name: string; displayName: string }[]>([]);

  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connMsg, setConnMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const flash = (setter: typeof setNameMsg, text: string, type: "success" | "error" = "success") => {
    setter({ type, text });
    setTimeout(() => setter(null), 3000);
  };

  useEffect(() => {
    api.user.getProfile().then(({ user, oauthAccounts }) => {
      setConnections(oauthAccounts ?? []);
    });
    fetch("/api/auth/providers").then((r) => r.json())
      .then((d) => setAvailableProviders(d.oauth ?? [])).catch(() => {});
  }, []);

  const nameForm = useForm<NameData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? "" },
  });
  const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema), defaultValues: { email: user?.email ?? "" } });
  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  // Avatar
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      await refresh();
    } catch (e: any) {
      setAvatarPreview(null);
    } finally { setUploading(false); }
  };

  const removeAvatar = async () => {
    await fetch("/api/user/avatar", { method: "DELETE", credentials: "include" });
    setAvatarPreview(null);
    await refresh();
  };

  const avatar = avatarPreview ?? user?.avatarUrl;
  const initials = user?.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  // Name
  const onName = async (data: NameData) => {
    try {
      await api.user.updateProfile(data);
      await refresh();
      flash(setNameMsg, "Nom mis à jour.");
    } catch (e: any) { flash(setNameMsg, e.message, "error"); }
  };

  // Email
  const onEmail = async (data: EmailData) => {
    try {
      await (api as any).user.changeEmail(data);
      await refresh();
      flash(setEmailMsg, "Email mis à jour.");
    } catch (e: any) { flash(setEmailMsg, e.message, "error"); }
  };

  // Password
  const onPassword = async (data: PasswordData) => {
    try {
      await api.user.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      passwordForm.reset();
      flash(setPasswordMsg, "Mot de passe modifié.");
    } catch (e: any) { flash(setPasswordMsg, e.message, "error"); }
  };

  // Unlink
  const unlink = async (provider: string) => {
    try {
      await (api as any).user.unlinkConnection(provider);
      setConnections((c) => c.filter((x) => x.provider !== provider));
      flash(setConnMsg, `${provider} déconnecté.`);
    } catch (e: any) { flash(setConnMsg, e.message, "error"); }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Avatar */}
      <Section title="Photo de profil" description="JPG, PNG ou GIF — max 5 Mo">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-20 w-20 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold flex items-center justify-center border-2 border-slate-200">
                {initials}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                {avatar ? "Changer" : "Ajouter une photo"}
              </Button>
              {avatar && (
                <Button size="sm" variant="ghost" onClick={removeAvatar}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                  Supprimer
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400">Recommandé : photo carrée, min 200×200px</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </Section>

      {/* Name */}
      <Section title="Nom d'affichage">
        <form onSubmit={nameForm.handleSubmit(onName)}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Input
                placeholder="Jean Dupont"
                error={nameForm.formState.errors.name?.message}
                {...nameForm.register("name")}
              />
            </div>
            <Button type="submit" size="sm" loading={nameForm.formState.isSubmitting}>
              <Check className="h-3.5 w-3.5 mr-1" /> Enregistrer
            </Button>
          </div>
          <div className="mt-2"><Flash msg={nameMsg} /></div>
        </form>
      </Section>

      {/* Email */}
      <Section title="Adresse email" description="Confirmez votre mot de passe pour changer d'email">
        <form onSubmit={emailForm.handleSubmit(onEmail)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nouvel email"
              type="email"
              placeholder="nouveau@email.com"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register("email")}
            />
            <Input
              label="Mot de passe actuel"
              type="password"
              placeholder="••••••••"
              error={emailForm.formState.errors.password?.message}
              {...emailForm.register("password")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Flash msg={emailMsg} />
            <Button type="submit" size="sm" loading={emailForm.formState.isSubmitting} className="ml-auto">
              <Check className="h-3.5 w-3.5 mr-1" /> Mettre à jour
            </Button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section title="Mot de passe" description="Minimum 8 caractères, une majuscule et un chiffre">
        <form onSubmit={passwordForm.handleSubmit(onPassword)} className="space-y-3">
          <Input
            label="Mot de passe actuel"
            type="password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register("newPassword")}
            />
            <Input
              label="Confirmer"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register("confirmPassword")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Flash msg={passwordMsg} />
            <Button type="submit" size="sm" loading={passwordForm.formState.isSubmitting} className="ml-auto">
              <Check className="h-3.5 w-3.5 mr-1" /> Modifier
            </Button>
          </div>
        </form>
      </Section>

      {/* Connected accounts */}
      <Section title="Comptes connectés" description="Connectez vos comptes pour vous connecter sans mot de passe">
        <div className="space-y-2">
          <Flash msg={connMsg} />

          {/* All available + configured providers */}
          {[...new Set([...Object.keys(PROVIDERS), ...availableProviders.map((p) => p.name)])].map((name) => {
            const isLinked = connections.some((c) => c.provider === name);
            const pInfo = PROVIDERS[name] ?? { label: name, color: "text-slate-600", bg: "bg-slate-100" };
            const availableP = availableProviders.find((p) => p.name === name);
            const isEnabled = !!availableP;

            return (
              <div key={name} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <ProviderIcon name={name} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{availableP?.displayName ?? pInfo.label}</p>
                    <p className="text-xs text-slate-400">
                      {isLinked ? "Connecté" : isEnabled ? "Non connecté" : "Non configuré par l'admin"}
                    </p>
                  </div>
                </div>
                {isLinked ? (
                  <Button size="sm" variant="ghost" onClick={() => unlink(name)}>
                    <Link2Off className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Déconnecter
                  </Button>
                ) : isEnabled ? (
                  <a href={`/api/auth/oauth/${name}`}>
                    <Button size="sm" variant="outline">
                      <Link2 className="h-3.5 w-3.5 mr-1.5" /> Connecter
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-slate-300 px-3">—</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
