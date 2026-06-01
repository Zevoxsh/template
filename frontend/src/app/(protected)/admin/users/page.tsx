"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, UserX, UserCheck, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { User, PaginatedUsers } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

const ROLE_CHIP: Record<string, string> = {
  USER: "bg-slate-100 text-slate-600",
  MODERATOR: "bg-amber-50 text-amber-700",
  ADMIN: "bg-indigo-50 text-indigo-700",
};

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [banModal, setBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.admin.listUsers({ page, limit: 20, search: search || undefined }));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const handleBan = async (u: User) => {
    try { await api.admin.updateUser(u.id, { banned: true, bannedReason: banReason || undefined }); setBanModal(null); setBanReason(""); load(); }
    catch (e: any) { setError(e.message); }
  };
  const handleUnban = async (u: User) => { try { await api.admin.updateUser(u.id, { banned: false }); load(); } catch (e: any) { setError(e.message); } };
  const handleDelete = async (u: User) => { try { await api.admin.deleteUser(u.id); setDeleteModal(null); load(); } catch (e: any) { setError(e.message); } };
  const handleRole = async (u: User, role: string) => { try { await api.admin.updateUser(u.id, { role }); load(); } catch (e: any) { setError(e.message); } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-xs text-slate-400 mt-0.5">{data?.total ?? 0} compte(s) au total</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Inscription</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">Chargement…</td></tr>
              ) : data?.users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/users/${u.id}`} className="hover:text-indigo-600 transition-colors">
                      <p className="text-sm font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRole(u, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="USER">USER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.banned ? (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">Banni</span>
                    ) : !u.emailVerified ? (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Non vérifié</span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Actif</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{u.createdAt ? formatDate(u.createdAt) : "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {u.banned ? (
                        <button onClick={() => handleUnban(u)} title="Débannir" className="text-slate-400 hover:text-green-600 transition-colors">
                          <UserCheck className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => setBanModal(u)} title="Bannir" className="text-slate-400 hover:text-amber-600 transition-colors">
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setDeleteModal(u)} title="Supprimer" className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">Page {page} sur {data.totalPages}</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!banModal} onClose={() => setBanModal(null)} title={`Bannir ${banModal?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">L'utilisateur ne pourra plus se connecter.</p>
          <Input label="Raison (optionnel)" placeholder="Violation des CGU…"
            value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setBanModal(null)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={() => banModal && handleBan(banModal)}>Bannir</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Supprimer l'utilisateur">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Supprimer <strong className="text-slate-800">{deleteModal?.name}</strong> ? Cette action est irréversible.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteModal(null)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={() => deleteModal && handleDelete(deleteModal)}>Supprimer</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
