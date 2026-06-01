"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

const ROLE_BADGE: Record<string, "info" | "warning" | "danger"> = {
  USER: "info", MODERATOR: "warning", ADMIN: "danger",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getUser(id).then(({ user }) => setUser(user)).finally(() => setLoading(false));
  }, [id]);

  const update = async (data: Partial<User & { bannedReason?: string }>) => {
    try {
      const { user: updated } = await api.admin.updateUser(id, data);
      setUser(updated);
      setMessage({ type: "success", text: "Mis à jour avec succès" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }
  };

  if (loading) return <p className="text-gray-400">Chargement…</p>;
  if (!user) return <Alert variant="error">Utilisateur introuvable</Alert>;

  return (
    <div className="max-w-2xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>

      {message && <Alert variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>}

      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Row label="ID" value={user.id} />
          <Row label="Email" value={user.email} />
          <Row label="Rôle">
            <Badge variant={ROLE_BADGE[user.role] ?? "default"}>{user.role}</Badge>
          </Row>
          <Row label="Email vérifié">
            {user.emailVerified ? <Badge variant="success">Oui</Badge> : <Badge variant="warning">Non</Badge>}
          </Row>
          <Row label="Banni">
            {user.banned ? <Badge variant="danger">Oui — {user.bannedReason ?? "sans raison"}</Badge> : <Badge variant="success">Non</Badge>}
          </Row>
          {user.createdAt && <Row label="Inscription" value={formatDate(user.createdAt)} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => update({ role: "USER" })}>→ USER</Button>
          <Button variant="outline" size="sm" onClick={() => update({ role: "MODERATOR" })}>→ MODERATOR</Button>
          <Button variant="outline" size="sm" onClick={() => update({ role: "ADMIN" })}>→ ADMIN</Button>
          <Button variant="secondary" size="sm" onClick={() => update({ emailVerified: true })}>Vérifier email</Button>
          {user.banned ? (
            <Button variant="secondary" size="sm" onClick={() => update({ banned: false })}>Débannir</Button>
          ) : (
            <Button variant="danger" size="sm" onClick={() => update({ banned: true })}>Bannir</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value ?? children}</span>
    </div>
  );
}
