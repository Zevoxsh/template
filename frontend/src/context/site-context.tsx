"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SiteConfig {
  siteName: string;
  siteDescription: string;
}

const SiteContext = createContext<SiteConfig>({ siteName: "MyApp", siteDescription: "" });

export function SiteProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>({ siteName: "MyApp", siteDescription: "" });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setConfig(d))
      .catch(() => {});
  }, []);

  return <SiteContext.Provider value={config}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
