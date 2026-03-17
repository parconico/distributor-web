"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { get } from "@/lib/api-client";
import { Comprobante } from "@/types";
import {
  formatCurrency,
  formatTipoComprobante,
  formatPuntoVentaNumero,
} from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import apiClient from "@/lib/api-client";

const alicuotaLabels: Record<number, string> = {
  3: "0%",
  4: "10.5%",
  5: "21%",
  6: "27%",
  8: "5%",
  9: "2.5%",
};

export default function ComprobanteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [comprobante, setComprobante] = useState<Comprobante | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComprobante = async () => {
      try {
        const data = await get<Comprobante>(`/arca/comprobantes/${params.id}`);
        setComprobante(data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el comprobante",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchComprobante();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!comprobante) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Comprobante no encontrado</p>
      </div>
    );
  }

  const resultadoBadge = () => {
    if (comprobante.resultado === "A") {
      return (
        <Badge className="bg-green-600 hover:bg-green-600/80 text-white border-transparent">
          Aprobado
        </Badge>
      );
    }
    if (comprobante.resultado === "R") {
      return <Badge variant="destructive">Rechazado</Badge>;
    }
    return <Badge variant="outline">{comprobante.resultado ?? "-"}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {formatTipoComprobante(comprobante.tipoComprobante)}{" "}
            {formatPuntoVentaNumero(comprobante.puntoVenta, comprobante.numero)}
          </h1>
          {resultadoBadge()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const res = await apiClient.get(`/arca/comprobantes/${params.id}/pdf`, { responseType: 'blob' });
              const url = URL.createObjectURL(res.data as Blob);
              window.open(url);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          <Button variant="outline" onClick={() => router.push("/facturacion")}>
            Volver
          </Button>
        </div>
      </div>

      {/* Detalle del comprobante */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">
                {formatTipoComprobante(comprobante.tipoComprobante)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Numero</p>
              <p className="font-medium">
                {formatPuntoVentaNumero(
                  comprobante.puntoVenta,
                  comprobante.numero
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {new Date(comprobante.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CAE</p>
              <p className="font-medium">{comprobante.cae ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Fecha Vencimiento CAE
              </p>
              <p className="font-medium">
                {comprobante.caeFechaVenc
                  ? new Date(comprobante.caeFechaVenc).toLocaleDateString(
                      "es-AR"
                    )
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resultado</p>
              <div className="mt-1">{resultadoBadge()}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Venta asociada</p>
              <Link
                href={`/ventas/${comprobante.ventaId}`}
                className="text-primary hover:underline font-medium"
              >
                Ver venta
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Importes */}
      <Card>
        <CardHeader>
          <CardTitle>Importes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neto:</span>
              <span className="font-medium">
                {formatCurrency(comprobante.importeNeto)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA:</span>
              <span className="font-medium">
                {formatCurrency(comprobante.importeIva)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">
                {formatCurrency(comprobante.importeTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose IVA */}
      {comprobante.ivas && comprobante.ivas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose de IVA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alicuota</TableHead>
                    <TableHead>Base Imponible</TableHead>
                    <TableHead>Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprobante.ivas.map((iva) => (
                    <TableRow key={iva.id}>
                      <TableCell>
                        {alicuotaLabels[iva.alicuotaId] ??
                          `Codigo ${iva.alicuotaId}`}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(iva.baseImponible)}
                      </TableCell>
                      <TableCell>{formatCurrency(iva.importe)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
