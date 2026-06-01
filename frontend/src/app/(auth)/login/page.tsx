"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuthContext();
  const [error, setError] = useState(searchParams.get("banned") ? decodeURIComponent(searchParams.get("banned")!) : "");
  const [oauthProviders, setOauthProviders] = useState<{ name: string; displayName: string }[]>([]);

  useEffect(() => {
    fetch("/api/auth/providers").then((r) => r.json()).then((d) => setOauthProviders(d.oauth ?? [])).catch(() => {});
  }, []);

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
      setError(err.message ?? "Email ou mot de passe incorrect");
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-500 mt-1">Ravi de vous revoir.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <Input id="email" label="Email" type="email" autoComplete="email"
          placeholder="vous@exemple.com" error={errors.email?.message} {...register("email")} />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Mot de passe</label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700">
              Oublié ?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password"
            placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Se connecter
        </Button>
      </form>

      {oauthProviders.length > 0 && (
        <div className="mt-5">
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">ou continuer avec</span></div>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(oauthProviders.length, 3)}, 1fr)` }}>
            {oauthProviders.map((p) => (
              <a
                key={p.name}
                href={`/api/auth/oauth/${p.name}`}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                {p.displayName}
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          S'inscrire gratuitement
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
