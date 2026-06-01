"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Une erreur est survenue</h1>
        <p className="text-slate-500 text-sm mb-4 leading-relaxed">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>

        {process.env.NODE_ENV === "development" && error.stack && (
          <pre className="text-left text-xs bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6 overflow-auto max-h-40 text-slate-600">
            {error.stack}
          </pre>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
