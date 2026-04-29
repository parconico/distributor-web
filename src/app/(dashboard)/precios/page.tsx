"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { get, post } from "@/lib/api-client";
import { Familia, ListaPrecio, PrecioProducto } from "@/types";
import { formatCurrency, formatListaPrecio } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, Upload } from "lucide-react";
import { AxiosError } from "axios";
import { downloadFile } from "@/lib/download";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PrecioConProducto extends PrecioProducto {
  producto?: {
    id: string;
    codigo: string;
    nombre: string;
  };
}

export default function PreciosPage() {
  const [activeTab, setActiveTab] = useState<ListaPrecio>(ListaPrecio.LISTA_1);
  const [precios, setPrecios] = useState<PrecioConProducto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>(
    {}
  );

  // Bulk update state
  const [porcentaje, setPorcentaje] = useState("");
  const [familiaFilter, setFamiliaFilter] = useState("");
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  // Export/import state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPrecios = useCallback(async (lista: ListaPrecio) => {
    setIsLoading(true);
    try {
      const response = await get<{ data: PrecioConProducto[] }>(`/precios/lista/${lista}`);
      const data = response.data;
      setPrecios(data);
      const initialPrices: Record<string, string> = {};
      data.forEach((p) => {
        initialPrices[p.productoId] = String(p.precioNeto);
      });
      setEditingPrices(initialPrices);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los precios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrecios(activeTab);
  }, [activeTab, fetchPrecios]);

  useEffect(() => {
    const loadFamilias = async () => {
      try {
        const response = await get<{ data: Familia[] }>("/familias");
        setFamilias(response.data);
      } catch {
        // silently fail - familias are optional for the filter
      }
    };
    loadFamilias();
  }, []);

  const handlePriceBlur = async (productoId: string) => {
    const newPrice = parseFloat(editingPrices[productoId]);
    if (isNaN(newPrice) || newPrice < 0) return;

    const currentPrecio = precios.find((p) => p.productoId === productoId);
    if (currentPrecio && currentPrecio.precioNeto === newPrice) return;

    try {
      await post("/precios", {
        productoId,
        listaPrecio: activeTab,
        precioNeto: newPrice,
      });
      toast({ title: "Precio actualizado" });
      fetchPrecios(activeTab);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo actualizar el precio",
        variant: "destructive",
      });
    }
  };

  const handleBulkUpdate = async () => {
    const pct = parseFloat(porcentaje);
    if (isNaN(pct)) {
      toast({
        title: "Error",
        description: "Ingrese un porcentaje válido",
        variant: "destructive",
      });
      return;
    }
    setIsUpdatingBulk(true);
    try {
      const payload: {
        listaPrecio: ListaPrecio;
        porcentaje: number;
        familiaId?: string;
      } = {
        listaPrecio: activeTab,
        porcentaje: pct,
      };
      if (familiaFilter && familiaFilter !== "_all") {
        payload.familiaId = familiaFilter;
      }
      await post("/precios/bulk-update", payload);
      toast({ title: "Precios actualizados correctamente" });
      setPorcentaje("");
      setFamiliaFilter("");
      fetchPrecios(activeTab);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo realizar la actualización masiva",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingBulk(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadFile("/precios/export", "lista-precios.xlsx");
    } catch {
      toast({ title: "Error al descargar", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/precios/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al importar");
      setImportResult(data);
      toast({ title: `${data.updated} precios actualizados` });
      fetchPrecios(activeTab);
    } catch (error) {
      toast({
        title: "Error al importar",
        description: error instanceof Error ? error.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Precios</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar Excel
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) { setImportFile(null); setImportResult(null); } }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Lista de Precios</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Subí el Excel con las columnas <strong>CODIGO</strong>, <strong>LISTA_1</strong>, <strong>LISTA_2</strong>, <strong>LISTA_3</strong>. Podés descargar la lista actual como base.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex items-center gap-3">
                  <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                    Seleccionar archivo
                  </Button>
                  {importFile && <span className="text-sm text-muted-foreground">{importFile.name}</span>}
                </div>
                {importResult && (
                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <p className="font-medium text-green-600">{importResult.updated} precios actualizados</p>
                    {importResult.errors.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-medium text-destructive">{importResult.errors.length} errores:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                          {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={!importFile || isImporting}>
                    {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Importar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actualización Masiva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Porcentaje (%)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej: 10 para +10%"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="space-y-2">
              <Label>Familia (opcional)</Label>
              <Select
                value={familiaFilter}
                onValueChange={setFamiliaFilter}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas las familias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas las familias</SelectItem>
                  {familias.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBulkUpdate} disabled={isUpdatingBulk}>
              {isUpdatingBulk && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as ListaPrecio)}
      >
        <TabsList>
          {Object.values(ListaPrecio).map((lp) => (
            <TabsTrigger key={lp} value={lp}>
              {formatListaPrecio(lp)}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.values(ListaPrecio).map((lp) => (
          <TabsContent key={lp} value={lp}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Precio Neto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {precios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Sin precios para esta lista
                        </TableCell>
                      </TableRow>
                    ) : (
                      precios.map((precio) => (
                        <TableRow key={precio.productoId}>
                          <TableCell>
                            {precio.producto?.codigo ?? "-"}
                          </TableCell>
                          <TableCell>
                            {precio.producto?.nombre ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingPrices[precio.productoId] ?? ""}
                              onChange={(e) =>
                                setEditingPrices((prev) => ({
                                  ...prev,
                                  [precio.productoId]: e.target.value,
                                }))
                              }
                              onBlur={() =>
                                handlePriceBlur(precio.productoId)
                              }
                              className="w-32"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
