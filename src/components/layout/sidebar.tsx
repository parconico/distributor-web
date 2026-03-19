"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: Role[];
}

const defaultNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    id: "proveedores",
    label: "Proveedores",
    href: "/proveedores",
    icon: Truck,
    allowedRoles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    id: "compras",
    label: "Compras",
    href: "/compras",
    icon: ShoppingCart,
    allowedRoles: [Role.ADMIN, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    id: "clientes",
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    id: "productos",
    label: "Productos",
    href: "/productos",
    icon: Package,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    id: "precios",
    label: "Precios",
    href: "/precios",
    icon: DollarSign,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    id: "ventas",
    label: "Ventas",
    href: "/ventas",
    icon: ShoppingCart,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    id: "remitos",
    label: "Remitos",
    href: "/remitos",
    icon: ClipboardList,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.DEPOSITO, Role.CONTADOR],
  },
  {
    id: "stock",
    label: "Stock",
    href: "/stock",
    icon: Warehouse,
    allowedRoles: [Role.ADMIN, Role.DEPOSITO],
  },
  {
    id: "cuentas-corrientes",
    label: "Cuentas Corrientes",
    href: "/cuentas-corrientes",
    icon: BookOpen,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    id: "consultar-contribuyente",
    label: "Consultar ARCA",
    href: "/consultar-contribuyente",
    icon: SearchCheck,
    allowedRoles: [Role.ADMIN, Role.VENDEDOR, Role.CONTADOR],
  },
  {
    id: "facturacion",
    label: "Facturación",
    href: "/facturacion",
    icon: FileText,
    allowedRoles: [Role.ADMIN, Role.CONTADOR],
  },
  {
    id: "reportes",
    label: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    allowedRoles: [Role.ADMIN, Role.CONTADOR],
  },
  {
    id: "usuarios",
    label: "Usuarios",
    href: "/usuarios",
    icon: UserCog,
    allowedRoles: [Role.ADMIN],
  },
];

const STORAGE_KEY = "sidebar-nav-order";

function getSavedOrder(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveOrder(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // silent
  }
}

function applyOrder(items: NavItem[], savedOrder: string[] | null): NavItem[] {
  if (!savedOrder) return items;
  const map = new Map(items.map((item) => [item.id, item]));
  const ordered: NavItem[] = [];
  for (const id of savedOrder) {
    const item = map.get(id);
    if (item) {
      ordered.push(item);
      map.delete(id);
    }
  }
  // Append any new items not in saved order
  for (const item of map.values()) {
    ordered.push(item);
  }
  return ordered;
}

function SortableNavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center rounded-md transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      {!collapsed && (
        <button
          className="flex shrink-0 cursor-grab items-center px-1 opacity-0 group-hover:opacity-50 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <Link
        href={item.href}
        className={cn(
          "flex flex-1 items-center gap-3 py-2 pr-3 text-sm font-medium",
          collapsed ? "justify-center px-2" : "pl-1",
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [orderedItems, setOrderedItems] = useState<NavItem[]>(defaultNavItems);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const savedOrder = getSavedOrder();
    setOrderedItems(applyOrder(defaultNavItems, savedOrder));
  }, []);

  const filteredItems = orderedItems.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setOrderedItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        const updated = arrayMove(prev, oldIndex, newIndex);
        saveOrder(updated.map((i) => i.id));
        return updated;
      });
    },
    [],
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
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <SortableNavLink
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  collapsed={collapsed}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </nav>
    </aside>
  );
}
