"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function VerifyEmailPage() {
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Token manquant"); return; }
    api.auth.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => { setStatus("error"); setMessage(err.message); });
  }, [token]);

  return (
    <Card>
      <CardContent className="py-10 text-center space-y-3">
        {status === "loading" && <p className="text-gray-500">Vérification en cours…</p>}
        {status === "success" && (
          <>
            <p className="text-3xl">✅</p>
            <p className="font-semibold text-gray-900">Email vérifié !</p>
            <Link href="/login" className="block text-sm text-indigo-600 hover:text-indigo-700">
              Se connecter
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <Alert variant="error">{message || "Lien invalide ou expiré."}</Alert>
            <Link href="/forgot-password" className="block text-sm text-indigo-600 hover:text-indigo-700 mt-2">
              Renvoyer un email
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
