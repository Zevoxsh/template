"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, Settings, ChevronDown, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/context/auth-context";

export function Navbar() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-6">
      <Link href="/dashboard" className="font-semibold text-slate-900 text-sm tracking-tight shrink-0">
        MyApp
      </Link>

      <nav className="flex items-center gap-1 flex-1">
        <NavLink href="/dashboard" active={pathname === "/dashboard"}>Tableau de bord</NavLink>
        <NavLink href="/profile" active={pathname === "/profile"}>Profil</NavLink>
        {user?.role === "ADMIN" && (
          <NavLink href="/admin" active={pathname.startsWith("/admin")}>
            <Shield className="h-3.5 w-3.5 mr-1 inline" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors"
        >
          <span className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
            {initials}
          </span>
          <span className="hidden sm:block font-medium">{user?.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <DropItem icon={<User className="h-4 w-4" />} href="/profile" label="Mon profil" onClick={() => setOpen(false)} />
            {user?.role === "ADMIN" && (
              <DropItem icon={<Shield className="h-4 w-4" />} href="/admin" label="Administration" onClick={() => setOpen(false)} />
            )}
            <div className="border-t border-slate-100 mt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center ${
        active
          ? "bg-slate-100 text-slate-900 font-medium"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}

function DropItem({ icon, href, label, onClick }: { icon: React.ReactNode; href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  );
}
