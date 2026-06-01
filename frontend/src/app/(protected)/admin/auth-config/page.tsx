"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/page-header";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface OAuthProvider {
  id: string; name: string; displayName: string; enabled: boolean;
  clientId: string; clientSecret: string;
  authUrl: string; tokenUrl: string; userInfoUrl: string; scope: string;
  iconUrl?: string;
}
interface LdapConfig {
  enabled: boolean; host: string; port: number; bindDn: string;
  bindPassword: string; searchBase: string; searchFilter: string; useTls: boolean;
}

const PRESETS = ["google", "github", "discord", "microsoft"];
const PRESET_ICONS: Record<string, string> = {
  google: "G", github: "GH", discord: "D", microsoft: "M",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function StatusMsg({ msg }: { msg: { type: "success" | "error"; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`text-sm rounded-lg px-4 py-3 ${msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
      {msg.text}
    </div>
  );
}

export default function AuthConfigPage() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [ldap, setLdap] = useState<LdapConfig>({
    enabled: false, host: "", port: 389, bindDn: "", bindPassword: "",
    searchBase: "", searchFilter: "(uid={{username}})", useTls: false,
  });
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newProviderName, setNewProviderName] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await api.admin.getAuthConfig();
    setProviders(data.oauthProviders);
    if (data.ldap) setLdap(data.ldap);
  };

  const flash = (text: string, type: "success" | "error" = "success") => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const saveOAuth = async (p: OAuthProvider) => {
    try {
      await api.admin.saveOAuthProvider(p.name, p);
      flash(`${p.displayName} sauvegardé.`);
      load();
    } catch (e: any) { flash(e.message, "error"); }
  };

  const deleteOAuth = async (name: string) => {
    try { await api.admin.deleteOAuthProvider(name); load(); }
    catch (e: any) { flash(e.message, "error"); }
  };

  const saveLdap = async () => {
    try { await api.admin.saveLdap(ldap); flash("LDAP sauvegardé."); }
    catch (e: any) { flash(e.message, "error"); }
  };

  const addPreset = async (name: string) => {
    if (providers.find((p) => p.name === name)) return;
    await api.admin.saveOAuthProvider(name, { enabled: false });
    load();
    setOpenPanel(name);
  };

  const addCustom = async () => {
    const name = newProviderName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    await api.admin.saveOAuthProvider(name, { enabled: false, displayName: newProviderName.trim() });
    load();
    setNewProviderName("");
    setOpenPanel(name);
  };

  const updateProvider = (name: string, patch: Partial<OAuthProvider>) => {
    setProviders((prev) => prev.map((p) => p.name === name ? { ...p, ...patch } : p));
  };

  return (
    <div className="space-y-5 max-w-xl">
      <PageHeader title="Authentification" description="Configurez les méthodes de connexion disponibles" />

      <StatusMsg msg={msg} />

      {/* OAuth Providers */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SSO / OAuth2</p>
          <div className="flex items-center gap-2">
            {PRESETS.filter((p) => !providers.find((pr) => pr.name === p)).map((p) => (
              <button key={p} onClick={() => addPreset(p)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                + {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {providers.length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucun provider configuré. Ajoutez-en un ci-dessus.</p>
        )}

        {providers.map((p) => (
          <div key={p.name} className="border-b border-slate-100 last:border-0">
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
              onClick={() => setOpenPanel(openPanel === p.name ? null : p.name)}
            >
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                  {PRESET_ICONS[p.name] ?? p.name[0].toUpperCase()}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">{p.displayName}</p>
                  <p className="text-xs text-slate-400">{p.enabled ? "Activé" : "Désactivé"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={p.enabled} onChange={(v) => { updateProvider(p.name, { enabled: v }); saveOAuth({ ...p, enabled: v }); }} />
                {openPanel === p.name ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {openPanel === p.name && (
              <div className="px-5 pb-5 space-y-3 bg-slate-50/50 border-t border-slate-100">
                <div className="pt-4 grid grid-cols-2 gap-3">
                  <Input label="Client ID" value={p.clientId} onChange={(e) => updateProvider(p.name, { clientId: e.target.value })} />
                  <Input label="Client Secret" type="password" value={p.clientSecret} onChange={(e) => updateProvider(p.name, { clientSecret: e.target.value })} />
                  <Input label="Auth URL" value={p.authUrl} onChange={(e) => updateProvider(p.name, { authUrl: e.target.value })} />
                  <Input label="Token URL" value={p.tokenUrl} onChange={(e) => updateProvider(p.name, { tokenUrl: e.target.value })} />
                  <Input label="UserInfo URL" value={p.userInfoUrl} onChange={(e) => updateProvider(p.name, { userInfoUrl: e.target.value })} />
                  <Input label="Scope" value={p.scope} onChange={(e) => updateProvider(p.name, { scope: e.target.value })} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => deleteOAuth(p.name)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </button>
                  <Button size="sm" onClick={() => saveOAuth(p)}>Sauvegarder</Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Custom provider */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center gap-2 bg-slate-50/40">
          <input
            type="text"
            placeholder="Nom du provider custom…"
            value={newProviderName}
            onChange={(e) => setNewProviderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button size="sm" variant="outline" onClick={addCustom}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
      </section>

      {/* LDAP */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
          onClick={() => setOpenPanel(openPanel === "ldap" ? null : "ldap")}
        >
          <div className="flex items-center gap-3">
            <span className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">L</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">LDAP / Active Directory</p>
              <p className="text-xs text-slate-400">{ldap.enabled ? "Activé" : "Désactivé"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={ldap.enabled} onChange={(v) => setLdap((l) => ({ ...l, enabled: v }))} />
            {openPanel === "ldap" ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </button>

        {openPanel === "ldap" && (
          <div className="px-5 pb-5 space-y-3 bg-slate-50/50">
            <div className="pt-4 grid grid-cols-2 gap-3">
              <Input label="Hôte" value={ldap.host} onChange={(e) => setLdap((l) => ({ ...l, host: e.target.value }))} />
              <Input label="Port" type="number" value={ldap.port} onChange={(e) => setLdap((l) => ({ ...l, port: Number(e.target.value) }))} />
              <Input label="Bind DN" value={ldap.bindDn} onChange={(e) => setLdap((l) => ({ ...l, bindDn: e.target.value }))} />
              <Input label="Bind Password" type="password" value={ldap.bindPassword} onChange={(e) => setLdap((l) => ({ ...l, bindPassword: e.target.value }))} />
              <Input label="Search Base" value={ldap.searchBase} onChange={(e) => setLdap((l) => ({ ...l, searchBase: e.target.value }))} />
              <Input label="Search Filter" value={ldap.searchFilter} onChange={(e) => setLdap((l) => ({ ...l, searchFilter: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={ldap.useTls} onChange={(e) => setLdap((l) => ({ ...l, useTls: e.target.checked }))}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600" />
                Utiliser TLS (LDAPS)
              </label>
              <Button size="sm" onClick={saveLdap}>Sauvegarder</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
