"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/auth-context";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || user?.role !== "ADMIN") return null;

  return (
    <div className="flex flex-1 relative overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`
          fixed top-14 bottom-0 left-0 z-30 transition-transform duration-200
          lg:relative lg:top-auto lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-800">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-slate-700">Administration</span>
          </div>
          <div className="px-6 py-6 max-w-5xl">{children}</div>
        </main>
    </div>
  );
}
