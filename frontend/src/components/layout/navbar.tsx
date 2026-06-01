"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Shield, LayoutDashboard } from "lucide-react";
import { useAuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
        MyApp
      </Link>

      <div className="flex items-center gap-4">
        {user?.role === "ADMIN" && (
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
        <Link href="/profile" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
          <User className="h-4 w-4" />
          {user?.name}
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
