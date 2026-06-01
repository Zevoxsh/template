"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthContext } from "@/context/auth-context";
import { UserAvatar } from "@/components/ui/user-avatar";

export function AdminNavbar() {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = async () => { await logout(); router.push("/login"); };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
      <span className="font-semibold text-slate-900 text-sm tracking-tight">MyApp</span>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user && <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size="sm" />}
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
