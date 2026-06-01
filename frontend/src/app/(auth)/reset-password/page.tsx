"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas" });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ password }: FormData) => {
    try {
      setError("");
      await api.auth.resetPassword(token, password);
      router.push("/login?reset=success");
    } catch (err: any) {
      setError(err.message ?? "Token invalide ou expiré");
    }
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Alert variant="error">Lien invalide. <Link href="/forgot-password" className="underline">Recommencer</Link></Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            id="password"
            label="Nouveau mot de passe"
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            id="confirm"
            label="Confirmer"
            type="password"
            error={errors.confirm?.message}
            {...register("confirm")}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Réinitialiser
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
