"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";

const ROLES = ["ADMIN", "MODERATOR", "USER"] as const;
const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrateur", MODERATOR: "Modérateur", USER: "Utilisateur" };
const ROLE_COLOR: Record<string, string> = {
  ADMIN: "border-indigo-200 bg-indigo-50",
  MODERATOR: "border-amber-200 bg-amber-50",
  USER: "border-slate-200 bg-slate-50",
};
const PERM_GROUPS: Record<string, string[]> = {
  "Utilisateurs":  ["users.view", "users.edit", "users.delete", "users.ban"],
  "Rôles":         ["roles.manage"],
  "Paramètres":    ["settings.view", "settings.edit"],
  "Contenu":       ["content.view", "content.create", "content.edit", "content.delete"],
};
const PERM_LABEL: Record<string, string> = {
  "users.view": "Voir", "users.edit": "Modifier", "users.delete": "Supprimer", "users.ban": "Bannir",
  "roles.manage": "Gérer les rôles",
  "settings.view": "Voir", "settings.edit": "Modifier",
  "content.view": "Voir", "content.create": "Créer", "content.edit": "Modifier", "content.delete": "Supprimer",
};

export default function AdminRolesPage() {
  const [perms, setPerms] = useState<Record<string, string[]>>({});
  const [available, setAvailable] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.admin.getRoles().then(({ permissions, available }) => {
      setPerms(permissions);
      setAvailable(available);
    });
  }, []);

  const toggle = (role: string, perm: string) => {
    setPerms((prev) => {
      const current = prev[role] ?? [];
      return {
        ...prev,
        [role]: current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm],
      };
    });
  };

  const save = async (role: string) => {
    setSaving(role);
    try {
      await api.admin.updateRolePermissions(role, perms[role] ?? []);
      setMsg(`Permissions "${ROLE_LABEL[role]}" sauvegardées.`);
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) { setMsg(e.message); }
    finally { setSaving(null); }
  };

  const reset = async () => {
    try {
      await api.admin.resetPermissions();
      const { permissions } = await api.admin.getRoles();
      setPerms(permissions);
      setMsg("Permissions réinitialisées aux valeurs par défaut.");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rôles & Permissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configurez les accès pour chaque rôle</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Réinitialiser
        </Button>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {msg}
        </div>
      )}

      <div className="grid gap-4">
        {ROLES.map((role) => (
          <div key={role} className={`rounded-xl border shadow-sm overflow-hidden ${ROLE_COLOR[role]}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{ROLE_LABEL[role]}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(perms[role] ?? []).length} permission(s) active(s)</p>
              </div>
              <Button size="sm" loading={saving === role} onClick={() => save(role)}>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Sauvegarder
              </Button>
            </div>

            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 bg-white">
              {Object.entries(PERM_GROUPS).map(([group, groupPerms]) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{group}</p>
                  <div className="space-y-1.5">
                    {groupPerms.filter((p) => available.includes(p)).map((perm) => (
                      <label key={perm} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={(perms[role] ?? []).includes(perm)}
                          onChange={() => toggle(role, perm)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                          {PERM_LABEL[perm] ?? perm}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
