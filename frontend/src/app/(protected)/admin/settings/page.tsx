"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SiteSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { Mail, Megaphone, Timer, ImageIcon, X } from "lucide-react";
import { useRef } from "react";

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
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const [smtpMsg, setSmtpMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/admin/settings/logo", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      const { logoUrl } = await res.json();
      setForm(f => ({ ...f, logoUrl }));
      setLogoMsg("Logo mis à jour");
    } catch (e: any) { setLogoMsg(e.message); }
    finally { setLogoUploading(false); setTimeout(() => setLogoMsg(""), 3000); }
  };

  const deleteLogo = async () => {
    try {
      await fetch("/api/admin/settings/logo", { method: "DELETE", credentials: "include" });
      setForm(f => ({ ...f, logoUrl: undefined }));
      setLogoMsg("Logo supprimé");
    } catch (e: any) { setLogoMsg(e.message); }
    finally { setTimeout(() => setLogoMsg(""), 3000); }
  };

  const testSmtp = async () => {
    setSmtpMsg(null);
    try {
      const r = await api.admin.testSmtp();
      setSmtpMsg({ ok: r.ok, text: r.message ?? r.error ?? "?" });
    } catch (e: any) {
      setSmtpMsg({ ok: false, text: e.message });
    }
    setTimeout(() => setSmtpMsg(null), 5000);
  };

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
    <div className="space-y-5">
      <PageHeader
        title="Paramètres"
        description="Configuration globale de l'application"
        actions={
          <>
            {smtpMsg && (
              <span className={`text-xs font-medium ${smtpMsg.ok ? "text-green-600" : "text-red-600"}`}>
                {smtpMsg.ok ? "✓" : "✗"} {smtpMsg.text}
              </span>
            )}
            {saved && <span className="text-xs text-green-600 font-medium">✓ Sauvegardé</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
            <Button size="sm" variant="outline" onClick={testSmtp}>
              <Mail className="h-3.5 w-3.5 mr-1.5" /> Tester SMTP
            </Button>
            <Button size="sm" onClick={save} loading={saving}>Enregistrer</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Logo */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Logo du site</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                  : <ImageIcon className="h-7 w-7 text-slate-300" />
                }
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-slate-500">PNG, JPG, SVG — max 2 Mo. Utilisé comme favicon et dans la navbar.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" loading={logoUploading} onClick={() => logoRef.current?.click()}>
                    {form.logoUrl ? "Remplacer" : "Choisir un logo"}
                  </Button>
                  {form.logoUrl && (
                    <Button size="sm" variant="danger" onClick={deleteLogo}>
                      <X className="h-3.5 w-3.5 mr-1" /> Supprimer
                    </Button>
                  )}
                </div>
                {logoMsg && <p className="text-xs text-green-600">{logoMsg}</p>}
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
          </div>
        </div>

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
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </Field>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
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

        {/* Annonce globale */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annonce globale</p>
          </div>
          <div className="px-5">
            <Row label="Activer l'annonce" description="Afficher un banner pour tous les utilisateurs">
              <Toggle checked={form.announcementEnabled ?? false} onChange={(v) => setForm((f) => ({ ...f, announcementEnabled: v }))} />
            </Row>
            <Field label="Message">
              <input
                type="text"
                value={form.announcementText ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, announcementText: e.target.value }))}
                placeholder="Maintenance prévue le…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>
            <Field label="Type">
              <select
                value={form.announcementType ?? "info"}
                onChange={(e) => setForm((f) => ({ ...f, announcementType: e.target.value as any }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="info">Info (bleu)</option>
                <option value="warning">Avertissement (amber)</option>
                <option value="success">Succès (vert)</option>
                <option value="error">Erreur (rouge)</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Délai d'inactivité */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
            <Timer className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Délai d'inactivité</p>
          </div>
          <div className="px-5">
            <Row label="Timeout (minutes)" description="Déconnexion automatique. 0 = désactivé.">
              <input
                type="number"
                min={0}
                max={480}
                value={form.inactivityTimeout ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, inactivityTimeout: parseInt(e.target.value) || 0 }))}
                className="w-24 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              />
            </Row>
          </div>
        </div>

      </div>
    </div>
  );
}
