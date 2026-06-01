"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({ email: z.string().email("Email invalide") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.auth.forgotPassword(data.email);
    setSent(true);
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-2xl">📧</p>
          <p className="font-semibold text-gray-900">Email envoyé</p>
          <p className="text-sm text-gray-500">Si cet email existe, un lien de réinitialisation a été envoyé.</p>
          <Link href="/login" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-700">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Entrez votre email pour recevoir un lien de réinitialisation</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Envoyer le lien
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700">
              Retour à la connexion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
