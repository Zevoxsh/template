"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, Settings, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin",          label: "Vue d'ensemble",      icon: LayoutDashboard, exact: true },
  { href: "/admin/users",    label: "Utilisateurs",         icon: Users,           exact: false },
  { href: "/admin/roles",    label: "Rôles & Permissions",  icon: ShieldCheck,     exact: false },
  { href: "/admin/settings", label: "Paramètres",           icon: Settings,        exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-2">
          Administration
        </p>
      </div>

      <nav className="flex-1 px-2 pb-4 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                active
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-3 pt-2 border-t border-slate-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-slate-400" />
          Retour à l'app
        </Link>
      </div>
    </aside>
  );
}
