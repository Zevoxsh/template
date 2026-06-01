import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-slate-100 px-6 h-14 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="font-semibold text-slate-900 tracking-tight">MyApp</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">
            Connexion
          </Link>
          <Link href="/register" className="text-sm bg-slate-900 text-white px-4 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            Créer un compte
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <span className="inline-block text-xs font-medium tracking-widest text-indigo-600 uppercase mb-6">
            Template full-stack
          </span>
          <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-5">
            Lancez votre projet<br />sans partir de zéro
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-lg mx-auto">
            Auth complète, gestion des rôles, panneau admin — tout est prêt. Concentrez-vous sur ce qui compte.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/register" className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Commencer
            </Link>
            <Link href="/login" className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
