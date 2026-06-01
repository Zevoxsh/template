import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">MyApp</h1>
        <p className="text-xl text-gray-500">
          Template full-stack Next.js + Express + PostgreSQL avec authentification et panneau admin.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            S'inscrire
          </Link>
        </div>
      </div>
    </main>
  );
}
