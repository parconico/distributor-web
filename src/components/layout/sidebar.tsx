"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Warehouse,
  BookOpen,
  FileText,
  ClipboardList,
  BarChart3,
  UserCog,
  ChevronLeft,
  ChevronRight,
  SearchCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: Role[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    label: "Proveedores",
    href: "/proveedores",
    icon: Truck,
    allowedRoles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    label: "Compras",
    href: "/compras",
    icon: ShoppingCart,
    allowedRoles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    label: "Productos",
    href: "/productos",
    icon: Package,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    label: "Precios",
    href: "/precios",
    icon: DollarSign,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    label: "Ventas",
    href: "/ventas",
    icon: ShoppingCart,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    label: "Remitos",
    href: "/remitos",
    icon: ClipboardList,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    label: "Stock",
    href: "/stock",
    icon: Warehouse,
    allowedRoles: [Role.ADMIN, Role.DEPOSITO],
  },
  {
    label: "Cuentas Corrientes",
    href: "/cuentas-corrientes",
    icon: BookOpen,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    label: "Consultar ARCA",
    href: "/consultar-contribuyente",
    icon: SearchCheck,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    label: "Facturación",
    href: "/facturacion",
    icon: FileText,
    allowedRoles: [Role.ADMIN, Role.CONTADOR],
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    allowedRoles: [Role.ADMIN, Role.CONTADOR],
  },
  {
    label: "Usuarios",
    href: "/usuarios",
    icon: UserCog,
    allowedRoles: [Role.ADMIN],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-primary">Distribuidora</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
