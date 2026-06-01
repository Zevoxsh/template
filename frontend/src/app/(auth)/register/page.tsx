"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas" });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuthContext();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ name, email, password }: FormData) => {
    try {
      setError("");
      const res = await api.auth.register({ name, email, password });
      if (res.message.includes("verify")) {
        setMessage(res.message);
      } else {
        await refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue");
    }
  };

  if (message) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-2xl">📧</p>
          <p className="font-semibold text-gray-900">Vérifiez votre email</p>
          <p className="text-sm text-gray-500">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Remplissez le formulaire pour vous inscrire</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            id="name"
            label="Nom"
            autoComplete="name"
            placeholder="Jean Dupont"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            id="password"
            label="Mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            id="confirm"
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirm?.message}
            {...register("confirm")}
          />

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Créer mon compte
          </Button>

          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
