"use client";

import Link from "next/link";
import { useSite } from "@/context/site-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { siteName } = useSite();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="px-6 h-14 flex items-center border-b border-slate-100 bg-white">
        <Link href="/" className="font-semibold text-slate-900 tracking-tight text-sm">
          {siteName}
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
