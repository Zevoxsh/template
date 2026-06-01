"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/context/auth-context";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user?.role !== "ADMIN") return null;

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <AdminSidebar />
      <main className="flex-1 bg-slate-50 px-8 py-7 overflow-auto min-w-0">{children}</main>
    </div>
  );
}
