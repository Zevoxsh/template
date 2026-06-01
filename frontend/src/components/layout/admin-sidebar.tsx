"use client";

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, exact: false },
  { href: "/admin/roles", label: "Rôles & Permissions", icon: ShieldCheck, exact: false },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 bg-slate-900 min-h-screen flex flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Administration</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-indigo-600 text-white font-medium"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'app
        </Link>
      </div>
    </aside>
  );
}
