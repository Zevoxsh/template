"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, UserX, UserCheck, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { User, PaginatedUsers } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

const ROLE_BADGE: Record<string, "info" | "warning" | "danger"> = {
  USER: "info", MODERATOR: "warning", ADMIN: "danger",
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
      const res = await api.admin.listUsers({ page, limit: 20, search: search || undefined });
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const handleBan = async (user: User) => {
    try {
      await api.admin.updateUser(user.id, { banned: true, bannedReason: banReason || undefined });
      setBanModal(null);
      setBanReason("");
      load();
    } catch (e: any) { setError(e.message); }
  };

  const handleUnban = async (user: User) => {
    try {
      await api.admin.updateUser(user.id, { banned: false });
      load();
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (user: User) => {
    try {
      await api.admin.deleteUser(user.id);
      setDeleteModal(null);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const handleRoleChange = async (user: User, role: string) => {
    try {
      await api.admin.updateUser(user.id, { role });
      load();
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-gray-500 mt-1">{data?.total ?? 0} utilisateur(s) au total</p>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Inscription</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Chargement…</td></tr>
                ) : data?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          <Link href={`/admin/users/${user.id}`} className="hover:text-indigo-600">{user.name}</Link>
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="USER">USER</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.banned && <Badge variant="danger">Banni</Badge>}
                        {!user.emailVerified && <Badge variant="warning">Non vérifié</Badge>}
                        {!user.banned && user.emailVerified && <Badge variant="success">Actif</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.createdAt ? formatDate(user.createdAt) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.banned ? (
                          <button onClick={() => handleUnban(user)} title="Débannir" className="text-green-600 hover:text-green-700 transition-colors">
                            <UserCheck className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => setBanModal(user)} title="Bannir" className="text-yellow-600 hover:text-yellow-700 transition-colors">
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => setDeleteModal(user)} title="Supprimer" className="text-red-600 hover:text-red-700 transition-colors">
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} sur {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!banModal} onClose={() => setBanModal(null)} title={`Bannir ${banModal?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">L'utilisateur ne pourra plus se connecter.</p>
          <Input
            label="Raison (optionnel)"
            placeholder="Violation des CGU…"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setBanModal(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => banModal && handleBan(banModal)}>Bannir</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Supprimer l'utilisateur">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Êtes-vous sûr de vouloir supprimer <strong>{deleteModal?.name}</strong> ? Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => deleteModal && handleDelete(deleteModal)}>Supprimer</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
