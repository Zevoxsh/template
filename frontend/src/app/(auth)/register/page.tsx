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

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  path: ["confirm"],
  message: "Les mots de passe ne correspondent pas",
});

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
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Vérifiez votre email</h2>
        <p className="text-sm text-slate-500 mb-5">{message}</p>
        <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Aller à la connexion →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
        <p className="text-sm text-slate-500 mt-1">Gratuit et sans engagement.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <Input id="name" label="Nom complet" autoComplete="name"
          placeholder="Jean Dupont" error={errors.name?.message} {...register("name")} />
        <Input id="email" label="Email" type="email" autoComplete="email"
          placeholder="vous@exemple.com" error={errors.email?.message} {...register("email")} />
        <Input id="password" label="Mot de passe" type="password" autoComplete="new-password"
          placeholder="Min. 8 caractères" error={errors.password?.message} {...register("password")} />
        <Input id="confirm" label="Confirmer le mot de passe" type="password"
          placeholder="••••••••" error={errors.confirm?.message} {...register("confirm")} />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Créer mon compte
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
