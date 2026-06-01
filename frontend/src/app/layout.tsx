import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { SiteProvider } from "@/context/site-context";
import { ThemeProvider } from "@/context/theme-context";
import { DynamicFavicon } from "@/components/dynamic-favicon";

export const metadata: Metadata = {
  title: "MyApp",
  description: "Full-stack web application template",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">
        <ThemeProvider>
          <SiteProvider>
            <DynamicFavicon />
            <AuthProvider>{children}</AuthProvider>
          </SiteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
