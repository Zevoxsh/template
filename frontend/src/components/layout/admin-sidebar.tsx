"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, Settings, KeyRound, ChevronLeft, ScrollText, ShieldAlert, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Général",
    links: [
      { href: "/admin",             label: "Vue d'ensemble",     icon: LayoutDashboard, exact: true },
      { href: "/admin/users",       label: "Utilisateurs",       icon: Users,           exact: false },
      { href: "/admin/roles",       label: "Rôles & Permissions",icon: ShieldCheck,     exact: false },
    ],
  },
  {
    label: "Configuration",
    links: [
      { href: "/admin/auth-config",      label: "Authentification",   icon: KeyRound,    exact: false },
      { href: "/admin/email-templates",  label: "Email templates",    icon: Mail,        exact: false },
      { href: "/admin/settings",         label: "Paramètres",         icon: Settings,    exact: false },
    ],
  },
  {
    label: "Sécurité",
    links: [
      { href: "/admin/audit-logs", label: "Journal d'activité",  icon: ScrollText,  exact: false },
      { href: "/admin/security",   label: "Sécurité",            icon: ShieldAlert, exact: false },
    ],
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-52 h-full border-r border-slate-200 bg-white flex flex-col">
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">Admin</p>
      </div>

      <nav className="flex-1 px-2 space-y-4 overflow-y-auto py-2">
        {groups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">{group.label}</p>
            <div className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-2 pb-4 pt-2 border-t border-slate-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
          Retour à l'app
        </Link>
      </div>
    </aside>
  );
}
