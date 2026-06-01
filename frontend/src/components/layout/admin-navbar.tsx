"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthContext } from "@/context/auth-context";

export function AdminNavbar() {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const initials = user?.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
      <span className="font-semibold text-slate-900 text-sm tracking-tight">MyApp</span>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
            {initials}
          </span>
          <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
