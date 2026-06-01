"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, Settings, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin",          label: "Vue d'ensemble",     icon: LayoutDashboard, exact: true },
  { href: "/admin/users",    label: "Utilisateurs",        icon: Users,           exact: false },
  { href: "/admin/roles",    label: "Rôles & Permissions", icon: ShieldCheck,     exact: false },
  { href: "/admin/settings", label: "Paramètres",          icon: Settings,        exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 shrink-0 border-r border-slate-200 bg-white flex flex-col py-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
        Admin
      </p>

      <nav className="flex-1 px-2 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pt-2 border-t border-slate-100 mt-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Retour
        </Link>
      </div>
    </aside>
  );
}
