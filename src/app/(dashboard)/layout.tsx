"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { inicioPara, puedeVerRuta } from "@/lib/permisos";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // El menu solo oculta secciones: sin esto, escribir la direccion a mano
  // abria igual una pantalla que el rol no tiene permitida.
  const permitida = !!user && puedeVerRuta(user.role, pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user && !permitida) {
      router.replace(inicioPara(user.role));
    }
  }, [isLoading, isAuthenticated, user, permitida, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !permitida) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-3 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
