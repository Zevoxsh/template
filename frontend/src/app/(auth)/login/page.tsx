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
import { ShieldCheck, Smartphone, Mail, RotateCcw } from "lucide-react";

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

  // 2FA state
  const [twoFaStep, setTwoFaStep] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers").then((r) => r.json()).then((d) => setOauthProviders(d.oauth ?? [])).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const res = await api.auth.login(data);
      if (res.twoFactorRequired && res.challengeToken) {
        setChallengeToken(res.challengeToken);
        setMethod(res.method ?? null);
        setTwoFaStep(true);
        if (res.method === "email") {
          await sendEmailOtp(res.challengeToken);
        }
        return;
      }
      await refresh();
      router.push(searchParams.get("next") ?? "/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Email ou mot de passe incorrect");
    }
  };

  const sendEmailOtp = async (token?: string) => {
    const t = token ?? challengeToken;
    try {
      await api.auth.twoFactor.sendEmailOtp(t);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim()) return;
    setOtpLoading(true);
    setError("");
    try {
      await api.auth.twoFactor.verifyChallenge(challengeToken, otpCode.replace(/\s/g, ""));
      await refresh();
      router.push(searchParams.get("next") ?? "/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Code invalide");
    } finally {
      setOtpLoading(false);
    }
  };

  if (twoFaStep) {
    return (
      <div>
        <div className="mb-7 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vérification en deux étapes</h1>
            <p className="text-sm text-slate-500 mt-1">
              {method === "totp"
                ? "Saisissez le code de votre application d'authentification."
                : method === "email"
                ? emailSent ? "Un code a été envoyé à votre adresse email." : "Envoi du code en cours…"
                : "Saisissez votre code de vérification."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            {method === "totp"
              ? <Smartphone className="h-5 w-5 text-slate-400 shrink-0" />
              : <Mail className="h-5 w-5 text-slate-400 shrink-0" />}
            <span className="text-sm text-slate-600">
              {method === "totp" ? "Application d'authentification" : "Code par email"}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Code de vérification</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={method === "totp" ? "000 000" : "000000"}
              maxLength={10}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && verifyOtp()}
              className="w-full text-center text-2xl font-mono tracking-widest border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button className="w-full" onClick={verifyOtp} loading={otpLoading}>
            Vérifier
          </Button>

          {method === "email" && (
            <button
              onClick={() => { setEmailSent(false); sendEmailOtp(); }}
              className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Renvoyer le code
            </button>
          )}

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-2">Code de secours ?</p>
            <input
              type="text"
              placeholder="XXXXXXXX (code de secours)"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              className="w-full text-center text-sm font-mono border border-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-500"
            />
          </div>

          <button
            onClick={() => { setTwoFaStep(false); setOtpCode(""); setError(""); }}
            className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
        <p className="text-sm text-slate-500 mt-1">Ravi de vous revoir.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        <Input id="email" label="Email" type="email" autoComplete="email"
          placeholder="vous@exemple.com" error={errors.email?.message} {...register("email")} />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Mot de passe</label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700">Oublié ?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password"
            placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>Se connecter</Button>
      </form>

      {oauthProviders.length > 0 && (
        <div className="mt-5">
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">ou continuer avec</span></div>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(oauthProviders.length, 3)}, 1fr)` }}>
            {oauthProviders.map((p) => (
              <a key={p.name} href={`/api/auth/oauth/${p.name}`}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                {p.displayName}
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">S'inscrire gratuitement</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
