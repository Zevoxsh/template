"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Check, AlertCircle } from "lucide-react";

const TEMPLATES: { key: string; label: string; vars: string[] }[] = [
  { key: "verification", label: "Vérification d'email", vars: ["{{name}}", "{{url}}"] },
  { key: "password-reset", label: "Réinitialisation de mot de passe", vars: ["{{name}}", "{{url}}"] },
  { key: "two-factor", label: "Code 2FA (email)", vars: ["{{code}}"] },
  { key: "welcome", label: "Email de bienvenue", vars: ["{{name}}", "{{siteName}}"] },
];

type Tpl = { subject: string; body: string };

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Record<string, Tpl>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.admin.getSettings().then(({ settings }) => {
      setTemplates((settings.emailTemplates as Record<string, Tpl>) ?? {});
    });
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    try {
      const { settings } = await api.admin.updateSettings({ emailTemplates: { ...templates, [key]: templates[key] ?? { subject: "", body: "" } } });
      setTemplates((settings.emailTemplates as Record<string, Tpl>) ?? {});
      setMsg({ key, ok: true, text: "Template sauvegardé" });
    } catch (e: any) { setMsg({ key, ok: false, text: e.message }); }
    finally { setSaving(null); setTimeout(() => setMsg(null), 3000); }
  };

  const update = (key: string, field: "subject" | "body", value: string) => {
    setTemplates(prev => ({ ...prev, [key]: { ...(prev[key] ?? { subject: "", body: "" }), [field]: value } }));
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Templates d'emails" description="Personnalisez les emails envoyés aux utilisateurs. Laisser vide = template par défaut." />

      <div className="space-y-3">
        {TEMPLATES.map(t => {
          const tpl = templates[t.key] ?? { subject: "", body: "" };
          const isOpen = open === t.key;
          return (
            <div key={t.key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : t.key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tpl.subject ? `Sujet: ${tpl.subject.slice(0, 50)}…` : "Template par défaut"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tpl.subject && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Personnalisé</span>}
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-slate-500 mr-1 self-center">Variables :</p>
                    {t.vars.map(v => (
                      <code key={v} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{v}</code>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Sujet</label>
                    <input type="text" value={tpl.subject} onChange={e => update(t.key, "subject", e.target.value)}
                      placeholder="Laisser vide pour utiliser le sujet par défaut"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Corps (HTML)</label>
                    <textarea value={tpl.body} onChange={e => update(t.key, "body", e.target.value)} rows={8}
                      placeholder="Laisser vide pour utiliser le template par défaut. Supporte le HTML."
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                  </div>

                  <div className="flex items-center justify-between">
                    {msg?.key === t.key && (
                      <div className={`flex items-center gap-2 text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>
                        {msg.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {msg.text}
                      </div>
                    )}
                    <div className="flex gap-2 ml-auto">
                      {tpl.subject || tpl.body ? (
                        <Button variant="outline" size="sm" onClick={() => { update(t.key, "subject", ""); update(t.key, "body", ""); }}>
                          Réinitialiser
                        </Button>
                      ) : null}
                      <Button size="sm" loading={saving === t.key} onClick={() => save(t.key)}>
                        Sauvegarder
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
