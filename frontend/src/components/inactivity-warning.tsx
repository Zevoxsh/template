"use client";

interface Props {
  showWarning: boolean;
  secondsLeft: number;
  onStay: () => void;
}

export function InactivityWarning({ showWarning, secondsLeft, onStay }: Props) {
  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-black text-amber-600">{secondsLeft}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Session inactive</h2>
        <p className="text-sm text-slate-500 mb-6">
          Vous allez être déconnecté dans <strong className="text-slate-800">{secondsLeft} seconde{secondsLeft !== 1 ? "s" : ""}</strong> en raison d&apos;inactivité.
        </p>
        <button
          onClick={onStay}
          className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Rester connecté
        </button>
      </div>
    </div>
  );
}
