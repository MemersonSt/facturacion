import type { Metadata } from "next";
import { AppMuiProvider } from "@/components/providers/app-mui-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "DOVI VELAS",
  description: "Boutique de velas y flores - Sistema de Gestión",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AppMuiProvider>{children}</AppMuiProvider>
      </body>
    </html>
  );
}
