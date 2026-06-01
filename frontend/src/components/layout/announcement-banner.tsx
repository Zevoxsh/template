"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SESSION_KEY = "announcement_dismissed";

const TYPE_STYLES: Record<string, string> = {
  info:    "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-800",
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{
    enabled: boolean;
    text: string;
    type: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setDismissed(true);
      return;
    }
    fetch("/api/settings", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setAnnouncement({
            enabled: data.announcementEnabled ?? false,
            text: data.announcementText ?? "",
            type: data.announcementType ?? "info",
          });
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  };

  if (dismissed || !announcement?.enabled || !announcement.text) return null;

  const style = TYPE_STYLES[announcement.type] ?? TYPE_STYLES.info;

  return (
    <div className={`border-b px-4 py-2.5 flex items-center justify-between gap-4 text-sm ${style}`}>
      <span className="flex-1 text-center">{announcement.text}</span>
      <button onClick={dismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
