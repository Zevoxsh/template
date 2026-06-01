"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SiteSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8 py-4 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-8 py-3.5 border-b border-slate-100 last:border-0">
      <label className="text-sm font-medium text-slate-700 shrink-0 w-32">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin.getSettings().then(({ settings }) => setForm(settings));
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { settings } = await api.admin.updateSettings(form);
      setForm(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader
        title="Paramètres"
        description="Configuration globale de l'application"
        actions={
          <>
            {saved && <span className="text-xs text-green-600 font-medium">✓ Sauvegardé</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
            <Button size="sm" onClick={save} loading={saving}>Enregistrer</Button>
          </>
        }
      />

      {/* Site info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Informations du site</p>
        </div>
        <div className="px-5">
          <Field label="Nom du site">
            <input
              type="text"
              value={form.siteName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.siteDescription ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, siteDescription: e.target.value }))}
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </Field>
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Options</p>
        </div>
        <div className="px-5">
          <Row label="Inscriptions ouvertes" description="Autoriser les nouveaux comptes">
            <Toggle checked={form.registrationEnabled ?? true} onChange={(v) => setForm((f) => ({ ...f, registrationEnabled: v }))} />
          </Row>
          <Row label="Vérification email" description="Email obligatoire avant connexion">
            <Toggle checked={form.requireEmailVerification ?? true} onChange={(v) => setForm((f) => ({ ...f, requireEmailVerification: v }))} />
          </Row>
          <Row label="Mode maintenance" description="Bloquer l'accès aux non-admins">
            <Toggle checked={form.maintenanceMode ?? false} onChange={(v) => setForm((f) => ({ ...f, maintenanceMode: v }))} />
          </Row>
        </div>
      </div>
    </div>
  );
}
