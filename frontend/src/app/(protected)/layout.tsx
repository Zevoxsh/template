import { Navbar } from "@/components/layout/navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-5 py-8">
        {children}
      </main>
    </div>
  );
}
