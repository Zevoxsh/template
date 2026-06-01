"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      setProfileMsg({ type: "success", text: "Profil mis à jour !" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    }
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    try {
      await api.user.changePassword(data);
      passwordForm.reset();
      setPasswordMsg({ type: "success", text: "Mot de passe modifié !" });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message });
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      <Card>
        <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            {profileMsg && <Alert variant={profileMsg.type === "success" ? "success" : "error"}>{profileMsg.text}</Alert>}
            <Input label="Email" value={user?.email ?? ""} disabled />
            <Input
              label="Nom"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register("name")}
            />
            <Button type="submit" loading={profileForm.formState.isSubmitting}>
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Changer le mot de passe</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {passwordMsg && <Alert variant={passwordMsg.type === "success" ? "success" : "error"}>{passwordMsg.text}</Alert>}
            <Input
              label="Mot de passe actuel"
              type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register("currentPassword")}
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register("newPassword")}
            />
            <Button type="submit" loading={passwordForm.formState.isSubmitting}>
              Modifier le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
