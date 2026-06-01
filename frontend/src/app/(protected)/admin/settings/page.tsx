"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SiteSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.getSettings().then(({ settings }) => {
      setSettings(settings);
      setForm(settings);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { settings: updated } = await api.admin.updateSettings(form);
      setSettings(updated);
      setMessage({ type: "success", text: "Paramètres enregistrés !" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-gray-400">Chargement…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du site</h1>
        <p className="text-gray-500 mt-1">Configuration globale de l'application</p>
      </div>

      {message && <Alert variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>}

      <Card>
        <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nom du site"
            value={form.siteName ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.siteDescription ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, siteDescription: e.target.value }))}
              rows={3}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Options</CardTitle></CardHeader>
        <CardContent>
          <Toggle
            label="Inscriptions ouvertes"
            description="Permettre aux nouveaux utilisateurs de s'inscrire"
            checked={form.registrationEnabled ?? true}
            onChange={(v) => setForm((f) => ({ ...f, registrationEnabled: v }))}
          />
          <Toggle
            label="Vérification email obligatoire"
            description="Les nouveaux comptes doivent vérifier leur email avant de se connecter"
            checked={form.requireEmailVerification ?? true}
            onChange={(v) => setForm((f) => ({ ...f, requireEmailVerification: v }))}
          />
          <Toggle
            label="Mode maintenance"
            description="Désactiver l'accès à l'application pour les non-admins"
            checked={form.maintenanceMode ?? false}
            onChange={(v) => setForm((f) => ({ ...f, maintenanceMode: v }))}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>Enregistrer les paramètres</Button>
      </div>
    </div>
  );
}
