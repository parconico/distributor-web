"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { get } from "@/lib/api-client";
import { DashboardKpis, EstadoVenta } from "@/types";
import { formatCurrency, formatEstadoVenta, estadoVentaVariant } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowDownUp,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const data = await get<DashboardKpis>("/dashboard/kpis");
        setKpis(data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los indicadores del dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchKpis();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de distribución
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Ventas Hoy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis?.ventasHoy.total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis?.ventasHoy.count ?? 0} venta(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ventas del Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis?.ventasMes.total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis?.ventasMes.count ?? 0} venta(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Deuda Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
              </div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  (kpis?.deudaTotal ?? 0) > 0 ? "text-red-600" : ""
                }`}
              >
                {formatCurrency(kpis?.deudaTotal ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos Bajo Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Bajo Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-16" />
              </div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  (kpis?.productosBajoStock ?? 0) > 0 ? "text-red-600" : ""
                }`}
              >
                {kpis?.productosBajoStock ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compras vs Ventas del Mes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Compras vs Ventas del Mes</CardTitle>
          <ArrowDownUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Compras
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(kpis?.comprasVsVentas?.compras.total ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kpis?.comprasVsVentas?.compras.cantidad ?? 0} orden(es)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Ventas
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(kpis?.comprasVsVentas?.ventas.total ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kpis?.comprasVsVentas?.ventas.cantidad ?? 0} venta(s)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Margen Bruto</p>
                  <p
                    className={`text-2xl font-bold ${
                      (kpis?.comprasVsVentas?.margen.bruto ?? 0) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(kpis?.comprasVsVentas?.margen.bruto ?? 0)}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      (kpis?.comprasVsVentas?.margen.porcentaje ?? 0) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {kpis?.comprasVsVentas?.margen.porcentaje?.toFixed(1) ?? "0.0"}%
                  </p>
                </div>
              </div>
              {/* Visual bar comparison */}
              {(() => {
                const compras = kpis?.comprasVsVentas?.compras.total ?? 0;
                const ventas = kpis?.comprasVsVentas?.ventas.total ?? 0;
                const max = Math.max(compras, ventas, 1);
                return (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">Compras</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="bg-orange-500 h-3 rounded-full transition-all"
                          style={{ width: `${(compras / max) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">Ventas</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${(ventas / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Últimas Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis?.ultimasVentas && kpis.ultimasVentas.length > 0 ? (
                    kpis.ultimasVentas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-medium">
                          #{venta.numero}
                        </TableCell>
                        <TableCell>
                          {new Date(venta.createdAt).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          {venta.cliente?.razonSocial ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(venta.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoVentaVariant(venta.estado as EstadoVenta)}>
                            {formatEstadoVenta(venta.estado as EstadoVenta)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Sin ventas recientes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
