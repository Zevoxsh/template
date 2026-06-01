"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuditLog } from "@/types";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-green-50 text-green-700",
  ADMIN_UPDATE_USER: "bg-amber-50 text-amber-700",
  ADMIN_BULK_BAN: "bg-red-50 text-red-700",
  ADMIN_BULK_DELETE: "bg-red-50 text-red-700",
  ADMIN_UNBLOCK_IP: "bg-blue-50 text-blue-700",
  ADMIN_BROADCAST_NOTIFICATION: "bg-violet-50 text-violet-700",
};
const getColor = (a: string) => ACTION_COLORS[a] ?? (a.startsWith("ADMIN_BULK") ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600");

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.admin.getAuditLogs({ page, action: filterAction || undefined })
      .then(d => { setLogs(d.logs); setTotal(d.total); setTotalPages(d.totalPages); })
      .finally(() => setLoading(false));
  }, [page, filterAction]);

  useEffect(() => { setPage(1); }, [filterAction]);

  return (
    <div className="space-y-5">
      <PageHeader title="Journal d'activité" description={`${total} événement(s) enregistré(s)`} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" placeholder="Filtrer par action…" value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-left">
                {["Date", "Acteur", "Action", "Cible", "IP"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">Chargement…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">Aucun événement</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 truncate max-w-[160px]">{l.actorEmail ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getColor(l.action))}>{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[160px]">
                    {l.targetName ? <span>{l.targetType && <span className="text-slate-400 mr-1">{l.targetType}</span>}{l.targetName}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{l.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">Page {page} sur {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
