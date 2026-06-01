import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8 select-none">
          <div className="text-[120px] font-black text-slate-100 leading-none tracking-tighter">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <div className="w-8 h-1 bg-white rounded-full" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page introuvable</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
