"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RateLimitBlock } from "@/types";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldOff, Bell, Check, AlertCircle } from "lucide-react";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function SecurityPage() {
  const [blocks, setBlocks] = useState<RateLimitBlock[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [blockMsg, setBlockMsg] = useState("");

  const [notifForm, setNotifForm] = useState({ title: "", body: "", link: "", type: "info" });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.admin.getRateLimitBlocks().then(d => setBlocks(d.blocks)).catch(() => {});
  }, []);

  const unblock = async (id: string) => {
    setUnblocking(id);
    try {
      await api.admin.unblockIp(id);
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, unblockedAt: new Date().toISOString() } : b));
      setBlockMsg("IP débloquée.");
      setTimeout(() => setBlockMsg(""), 3000);
    } catch (e: any) { setBlockMsg(e.message); }
    finally { setUnblocking(null); }
  };

  const sendBroadcast = async () => {
    if (!notifForm.title || !notifForm.body) return;
    setNotifLoading(true);
    try {
      const r = await api.admin.broadcastNotification({ title: notifForm.title, body: notifForm.body, link: notifForm.link || undefined, type: notifForm.type });
      setNotifMsg({ ok: true, text: r.message });
      setNotifForm({ title: "", body: "", link: "", type: "info" });
    } catch (e: any) { setNotifMsg({ ok: false, text: e.message }); }
    finally { setNotifLoading(false); setTimeout(() => setNotifMsg(null), 4000); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Sécurité" description="IPs bloquées et notifications globales" />

      {/* Rate limits */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tentatives bloquées</p>
          </div>
          {blockMsg && <span className="text-xs text-green-600 font-medium">{blockMsg}</span>}
        </div>
        {blocks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Aucun blocage enregistré</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-left">
                  {["IP", "Route", "Tentatives", "Bloqué le", "Statut", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {blocks.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-sm font-mono text-slate-700">{b.ipAddress}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.route}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{b.attempts}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(b.blockedAt)}</td>
                    <td className="px-4 py-3">
                      {b.unblockedAt
                        ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Débloqué</span>
                        : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">Bloqué</span>}
                    </td>
                    <td className="px-4 py-3">
                      {!b.unblockedAt && (
                        <Button size="sm" variant="outline" loading={unblocking === b.id} onClick={() => unblock(b.id)}>
                          Débloquer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast notification */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Diffuser une notification</h2>
            <p className="text-sm text-slate-500 mt-0.5">Envoie une notification à tous les utilisateurs connectés</p>
          </div>
        </div>

        {notifMsg && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg mb-4 ${notifMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {notifMsg.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {notifMsg.text}
          </div>
        )}

        <div className="space-y-3 max-w-lg">
          <Input label="Titre" value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} placeholder="Maintenance planifiée" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Message</label>
            <textarea value={notifForm.body} onChange={e => setNotifForm(f => ({ ...f, body: e.target.value }))} rows={3} placeholder="Le site sera indisponible le…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <Input label="Lien (optionnel)" value={notifForm.link} onChange={e => setNotifForm(f => ({ ...f, link: e.target.value }))} placeholder="/dashboard" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Type</label>
            <select value={notifForm.type} onChange={e => setNotifForm(f => ({ ...f, type: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="info">Info</option>
              <option value="warning">Avertissement</option>
              <option value="success">Succès</option>
              <option value="error">Erreur</option>
            </select>
          </div>
          <Button onClick={sendBroadcast} loading={notifLoading} disabled={!notifForm.title || !notifForm.body}>
            <Bell className="h-4 w-4 mr-2" /> Diffuser à tous les utilisateurs
          </Button>
        </div>
      </div>
    </div>
  );
}
