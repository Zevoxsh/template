"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, UserX, UserCheck, Trash2, ChevronLeft, ChevronRight, Plus, Download, CheckSquare, Square, Shield, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { User, PaginatedUsers } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDate } from "@/lib/utils";

const ROLE_CHIP: Record<string, string> = {
  USER: "bg-slate-100 text-slate-600",
  MODERATOR: "bg-amber-50 text-amber-700",
  ADMIN: "bg-violet-50 text-violet-700",
};

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Bulk
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "USER", password: "" });
  const [createMsg, setCreateMsg] = useState("");
  const [banModal, setBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteModal, setDeleteModal] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      if (filterStatus === "banned") params.banned = true;
      if (filterStatus === "active") params.banned = false;
      setData(await api.admin.listUsers(params));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, search, filterRole, filterStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filterRole, filterStatus]);

  const handleCreate = async () => {
    try {
      const res = await api.admin.createUser({ name: createForm.name, email: createForm.email, role: createForm.role, password: createForm.password || undefined });
      setCreateMsg(res.passwordSet ? "Compte créé avec succès." : "Compte créé — email de setup envoyé.");
      load();
      setTimeout(() => { setCreateOpen(false); setCreateMsg(""); setCreateForm({ name: "", email: "", role: "USER", password: "" }); }, 1800);
    } catch (e: any) { setCreateMsg(e.message); }
  };

  const handleBan = async (u: User) => {
    try { await api.admin.updateUser(u.id, { banned: true, bannedReason: banReason || undefined }); setBanModal(null); setBanReason(""); load(); }
    catch (e: any) { setError(e.message); }
  };
  const handleUnban = async (u: User) => { try { await api.admin.updateUser(u.id, { banned: false }); load(); } catch (e: any) { setError(e.message); } };
  const handleDelete = async (u: User) => { try { await api.admin.deleteUser(u.id); setDeleteModal(null); load(); } catch (e: any) { setError(e.message); } };
  const handleRole = async (u: User, role: string) => { try { await api.admin.updateUser(u.id, { role }); load(); } catch (e: any) { setError(e.message); } };

  const exportCsv = async () => {
    try {
      const blob = await api.admin.exportUsersCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `users-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setError(e.message); }
  };

  const users = data?.users ?? [];
  const allSelected = users.length > 0 && users.every(u => selected.has(u.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(users.map(u => u.id)));
  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const doBulk = async (action: string, extra?: object) => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      const r = await api.admin.bulkAction(action, [...selected], extra);
      setBulkMsg(r.message);
      setTimeout(() => setBulkMsg(""), 3000);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBulkLoading(false); }
  };

  return (
    <div className="space-y-0">
      <PageHeader
        title="Utilisateurs"
        description={`${data?.total ?? 0} compte(s) au total`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Créer un utilisateur
            </Button>
          </>
        }
      />

      {error && <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            <option value="">Tous les rôles</option>
            <option value="USER">USER</option>
            <option value="MODERATOR">MODERATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="banned">Bannis</option>
          </select>
        </div>

        {/* Bulk action toolbar */}
        {selected.size > 0 && (
          <div className="px-4 py-2.5 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-indigo-700">{selected.size} sélectionné(s)</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" loading={bulkLoading} onClick={() => doBulk("ban")}>
                <UserX className="h-3.5 w-3.5 mr-1" /> Bannir
              </Button>
              <Button size="sm" variant="outline" loading={bulkLoading} onClick={() => doBulk("unban")}>
                <UserCheck className="h-3.5 w-3.5 mr-1" /> Débannir
              </Button>
              <Button size="sm" variant="outline" loading={bulkLoading} onClick={() => doBulk("verify-email")}>
                <MailCheck className="h-3.5 w-3.5 mr-1" /> Vérifier email
              </Button>
              <select onChange={e => e.target.value && doBulk("set-role", { role: e.target.value })} defaultValue=""
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="" disabled>Changer rôle…</option>
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <Button size="sm" variant="danger" loading={bulkLoading} onClick={() => confirm(`Supprimer ${selected.size} comptes ?`) && doBulk("delete")}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
              </Button>
            </div>
            {bulkMsg && <span className="text-xs text-green-600 font-medium">{bulkMsg}</span>}
            <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-slate-400 hover:text-slate-600">✕ Annuler</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-left">
                <th className="px-3 py-2.5 w-10">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-slate-600">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Rôle</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Inscription</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">Chargement…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">Aucun utilisateur trouvé</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50/60 transition-colors ${selected.has(u.id) ? "bg-indigo-50/30" : ""}`}>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleOne(u.id)} className="text-slate-400 hover:text-indigo-600">
                      {selected.has(u.id) ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:text-indigo-600 transition-colors">
                      <UserAvatar name={u.name} email={u.email} avatarUrl={u.avatarUrl} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => handleRole(u, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="USER">USER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.banned
                      ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">Banni</span>
                      : !u.emailVerified
                      ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Non vérifié</span>
                      : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Actif</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">{u.createdAt ? formatDate(u.createdAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.banned
                        ? <button onClick={() => handleUnban(u)} title="Débannir" className="text-slate-400 hover:text-green-600 transition-colors"><UserCheck className="h-4 w-4" /></button>
                        : <button onClick={() => setBanModal(u)} title="Bannir" className="text-slate-400 hover:text-amber-600 transition-colors"><UserX className="h-4 w-4" /></button>
                      }
                      <button onClick={() => setDeleteModal(u)} title="Supprimer" className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">Page {page} sur {data.totalPages} — {data.total} résultats</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Dialog open={createOpen} onClose={() => { setCreateOpen(false); setCreateMsg(""); }} title="Créer un utilisateur">
        <div className="space-y-4">
          {createMsg && <div className={`text-sm rounded-lg px-3 py-2 ${createMsg.includes("succès") || createMsg.includes("envoyé") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{createMsg}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Rôle</label>
              <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="USER">USER</option><option value="MODERATOR">MODERATOR</option><option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <Input label="Email" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <Input label="Mot de passe (optionnel)" type="password" placeholder="Laisser vide → email de configuration envoyé" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
            <p className="text-xs text-slate-400">Si vide, l'utilisateur recevra un email pour configurer son mot de passe.</p>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleCreate}>Créer le compte</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!banModal} onClose={() => setBanModal(null)} title={`Bannir ${banModal?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">L'utilisateur ne pourra plus se connecter.</p>
          <Input label="Raison (optionnel)" placeholder="Violation des CGU…" value={banReason} onChange={e => setBanReason(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setBanModal(null)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={() => banModal && handleBan(banModal)}>Bannir</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Supprimer l'utilisateur">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Supprimer <strong className="text-slate-800">{deleteModal?.name}</strong> ? Action irréversible.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteModal(null)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={() => deleteModal && handleDelete(deleteModal)}>Supprimer</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
