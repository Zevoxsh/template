"use client";

import { useEffect } from "react";
import { useSite } from "@/context/site-context";

export function DynamicFavicon() {
  const { logoUrl } = useSite();

  useEffect(() => {
    if (!logoUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  }, [logoUrl]);

  return null;
}
