"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const profileSchema = z.object({ name: z.string().min(2, "Minimum 2 caractères") });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Requis"),
  newPassword: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

function StatusBanner({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <div className={`text-sm rounded-lg px-4 py-3 ${type === "success"
      ? "bg-green-50 border border-green-200 text-green-700"
      : "bg-red-50 border border-red-200 text-red-700"}`}>
      {text}
    </div>
  );
}

export default function ProfilePage() {
  const { user, refresh } = useAuthContext();
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileData) => {
    try {
      await api.user.updateProfile(data);
      await refresh();
      setProfileMsg({ type: "success", text: "Profil mis à jour." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    }
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    try {
      await api.user.changePassword(data);
      passwordForm.reset();
      setPasswordMsg({ type: "success", text: "Mot de passe modifié." });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message });
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gérez vos informations personnelles</p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Informations générales</p>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            {profileMsg && <StatusBanner {...profileMsg} />}
            <Input label="Email" value={user?.email ?? ""} disabled />
            <Input
              label="Nom complet"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register("name")}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={profileForm.formState.isSubmitting}>
                Enregistrer
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Sécurité</p>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {passwordMsg && <StatusBanner {...passwordMsg} />}
            <Input label="Mot de passe actuel" type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register("currentPassword")} />
            <Input label="Nouveau mot de passe" type="password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register("newPassword")} />
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={passwordForm.formState.isSubmitting}>
                Modifier le mot de passe
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
