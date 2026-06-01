"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, ChevronDown, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/context/auth-context";
import { useSite } from "@/context/site-context";

async function gravatarUrl(email: string): Promise<string> {
  const encoded = new TextEncoder().encode(email.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `https://www.gravatar.com/avatar/${hex}?s=56&d=mp`;
}

export function Navbar() {
  const { user, logout } = useAuthContext();
  const { siteName } = useSite();
  const router = useRouter();
  const pathname = usePathname();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gravatar, setGravatar] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (user?.email) gravatarUrl(user.email).then(setGravatar);
  }, [user?.id]);

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const initials = user?.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarSrc = user?.avatarUrl ?? gravatar;

  const isAdmin = pathname.startsWith("/admin");

  const navLinks = isAdmin ? [] : [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/profile", label: "Profil" },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-5 flex items-center justify-between relative z-10">
      {/* Logo */}
      <Link href="/dashboard" className="font-semibold text-slate-900 text-sm tracking-tight shrink-0 mr-6">
        {siteName}
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === href
                ? "bg-slate-100 text-slate-900 font-medium"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {/* Desktop user menu */}
        <div className="hidden md:block relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen((o) => !o)}
            className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
          >
            <span className="h-7 w-7 rounded-full overflow-hidden bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
              {avatarSrc ? <img src={avatarSrc} alt="" className="h-full w-full object-cover" /> : initials}
            </span>
            <span className="font-medium max-w-[120px] truncate">{user?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>
              <Link href="/profile" onClick={() => setDropOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <User className="h-3.5 w-3.5 text-slate-400" /> Mon profil
              </Link>
              <div className="border-t border-slate-100 mt-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="h-3.5 w-3.5" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-lg md:hidden z-50 py-2">
          <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              {label}
            </Link>
          ))}
          <div className="border-t border-slate-100 mt-1">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
