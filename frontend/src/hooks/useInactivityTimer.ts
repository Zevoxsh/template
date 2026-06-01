"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useInactivityTimer(inactivityTimeout: number) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const startLogoutCountdown = useCallback(() => {
    setShowWarning(true);
    setSecondsLeft(60);

    let secs = 60;
    warningTimerRef.current = setInterval(() => {
      secs -= 1;
      setSecondsLeft(secs);
      if (secs <= 0) {
        if (warningTimerRef.current) clearInterval(warningTimerRef.current);
      }
    }, 1000);

    logoutTimerRef.current = setTimeout(async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      } catch {}
      window.location.href = "/login";
    }, 60 * 1000);
  }, []);

  const resetTimer = useCallback(() => {
    if (!inactivityTimeout || inactivityTimeout === 0) return;

    clearAll();
    setShowWarning(false);

    timerRef.current = setTimeout(() => {
      startLogoutCountdown();
    }, inactivityTimeout * 60 * 1000);
  }, [inactivityTimeout, clearAll, startLogoutCountdown]);

  useEffect(() => {
    if (!inactivityTimeout || inactivityTimeout === 0) return;

    const events = ["mousemove", "keydown", "click", "scroll"];
    const handler = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearAll();
    };
  }, [inactivityTimeout, resetTimer, clearAll]);

  return { showWarning, secondsLeft, resetTimer };
}
