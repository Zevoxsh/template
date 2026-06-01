import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { SiteProvider } from "@/context/site-context";

export const metadata: Metadata = {
  title: "MyApp",
  description: "Full-stack web application template",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">
        <SiteProvider>
          <AuthProvider>{children}</AuthProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
