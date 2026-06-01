"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuthContext();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      await api.auth.login(data);
      await refresh();
      router.push(searchParams.get("next") ?? "/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Entrez vos identifiants pour accéder à votre compte</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

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
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Se connecter
          </Button>

          <p className="text-center text-sm text-gray-500">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              S'inscrire
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
