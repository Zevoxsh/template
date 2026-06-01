"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SiteSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="pr-8">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.getSettings().then(({ settings }) => setForm(settings));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { settings } = await api.admin.updateSettings(form);
      setForm(settings);
      setMsg({ type: "success", text: "Paramètres enregistrés." });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configuration globale de l'application</p>
      </div>

      {msg && (
        <div className={`text-sm rounded-lg px-4 py-3 ${msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Informations du site</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Input label="Nom du site" value={form.siteName ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.siteDescription ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, siteDescription: e.target.value }))}
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Options</p>
        </div>
        <div className="px-6">
          <Toggle label="Inscriptions ouvertes" description="Autoriser les nouveaux comptes"
            checked={form.registrationEnabled ?? true}
            onChange={(v) => setForm((f) => ({ ...f, registrationEnabled: v }))} />
          <Toggle label="Vérification email obligatoire" description="Les comptes doivent vérifier leur email avant connexion"
            checked={form.requireEmailVerification ?? true}
            onChange={(v) => setForm((f) => ({ ...f, requireEmailVerification: v }))} />
          <Toggle label="Mode maintenance" description="Bloquer l'accès aux non-admins"
            checked={form.maintenanceMode ?? false}
            onChange={(v) => setForm((f) => ({ ...f, maintenanceMode: v }))} />
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>Enregistrer les paramètres</Button>
      </div>
    </div>
  );
}
