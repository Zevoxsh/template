"use client";

import { useEffect, useState } from "react";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { InactivityWarning } from "@/components/inactivity-warning";

export function InactivityWrapper({ children }: { children: React.ReactNode }) {
  const [timeout, setTimeoutMinutes] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => setTimeoutMinutes(d.inactivityTimeout ?? 0))
      .catch(() => {});
  }, []);

  const { showWarning, secondsLeft, resetTimer } = useInactivityTimer(timeout);

  return (
    <>
      {children}
      <InactivityWarning
        showWarning={showWarning}
        secondsLeft={secondsLeft}
        onStay={resetTimer}
      />
    </>
  );
}
