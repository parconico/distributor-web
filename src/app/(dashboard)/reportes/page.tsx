"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart, FileText, Package, TrendingUp, BarChart3 } from "lucide-react";

const reportes = [
  {
    title: "Reporte de Ventas",
    description: "Resumen detallado de ventas por período, cliente y vendedor.",
    href: "/reportes/ventas",
    icon: ShoppingCart,
  },
  {
    title: "IVA Ventas",
    description: "Libro de IVA ventas agrupado por alícuota para presentaciones fiscales.",
    href: "/reportes/iva-ventas",
    icon: FileText,
  },
  {
    title: "Stock Valorizado",
    description: "Inventario actual valorizado a precios de Lista 1.",
    href: "/reportes/stock-valorizado",
    icon: Package,
  },
  {
    title: "Productos Más Vendidos",
    description: "Ranking de productos por cantidad vendida y monto en el período.",
    href: "/reportes/productos-mas-vendidos",
    icon: TrendingUp,
  },
  {
    title: "Compras vs Ventas",
    description: "Comparativa de ventas y compras con margen bruto y porcentaje.",
    href: "/reportes/compras-vs-ventas",
    icon: BarChart3,
  },
];

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">
          Seleccioná un reporte para generar
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportes.map((reporte) => (
          <Link key={reporte.href} href={reporte.href}>
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardHeader className="flex flex-row items-center gap-4">
                <reporte.icon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-lg">{reporte.title}</CardTitle>
                  <CardDescription>{reporte.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
