import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { PwaMode } from "@/components/shared/pwa-mode";
import { tenant } from "@/lib/tenant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${tenant.name} - Sistema de Gestión`,
  description: tenant.description,
  manifest: "/manifest.json",
  applicationName: tenant.name,
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    // Lo que iOS necesita para abrir la app a pantalla completa desde el icono
    // en vez de mostrarla dentro de Safari.
    capable: true,
    title: tenant.name,
    // "default" deja que iOS reserve la barra de estado. Con black-translucent
    // el contenido pasa por debajo del reloj y del notch, y el encabezado de la
    // app queda tapado salvo que se maqueten los safe-area insets.
    statusBarStyle: "default",
  },
  formatDetection: {
    // Sin esto iOS convierte numeros de comprobante y CUIT en links de telefono.
    telephone: false,
  },
  other: {
    // Next emite el estandarizado "mobile-web-app-capable". Desde iOS 16.4
    // alcanza con el manifest, pero en versiones anteriores Safari solo mira
    // este tag propio de Apple para abrir la app fuera del navegador.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <PwaMode />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
