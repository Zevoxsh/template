"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthContext } from "@/context/auth-context";
import { CheckCircle, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 0, label: "Bienvenue" },
  { id: 1, label: "Sécurité" },
  { id: 2, label: "Prêt !" },
];

export function OnboardingModal() {
  const { user, refresh } = useAuthContext();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!user || user.onboardingDone) return null;

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.user.completeOnboarding();
      await refresh();
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress */}
        <div className="flex border-b border-slate-100">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                i === step
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : i < step
                  ? "text-slate-400 border-b-2 border-slate-200"
                  : "text-slate-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Bienvenue, {user.name} !
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Votre compte est prêt. Suivez ces quelques étapes pour bien démarrer et configurer votre espace.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Sécurisez votre compte</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Nous vous recommandons d&apos;activer la double authentification (2FA) pour protéger votre compte.
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Configurer la 2FA depuis mon profil →
              </Link>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Vous êtes prêt !</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Votre compte est configuré. Vous pouvez maintenant profiter de toutes les fonctionnalités disponibles.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              className={`text-sm text-slate-400 hover:text-slate-600 transition-colors ${step === 0 ? "invisible" : ""}`}
            >
              ← Précédent
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {loading ? "Chargement…" : "Commencer"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
