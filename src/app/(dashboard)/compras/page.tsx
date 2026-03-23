"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import apiClient from "@/lib/api-client";
import { Compra, Proveedor, PaginatedResponse, EstadoCompra, Role } from "@/types";
import { formatCurrency, formatEstadoCompra, estadoCompraVariant } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  Loader2,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AxiosError } from "axios";

interface CompraImportResult {
  compraId: string;
  compraNumero: number;
  itemsCreados: number;
  itemsOmitidos: number;
  total: number;
  errores: string[];
}

export default function ComprasPage() {
  const router = useRouter();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [filteredCompras, setFilteredCompras] = useState<Compra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetIndex, setSheetIndex] = useState("0");
  const [proveedorId, setProveedorId] = useState("");
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<CompraImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProveedores = async () => {
    try {
      const response = await get<PaginatedResponse<Proveedor>>(
        "/proveedores?page=1&limit=100"
      );
      setProveedores(response.data);
    } catch {
      // silent
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (proveedorId) formData.append("proveedorId", proveedorId);
      formData.append("sheetIndex", sheetIndex);

      const response = await apiClient.post<CompraImportResult>(
        "/compras/import",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setImportResult(response.data);
      fetchCompras();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error al importar",
        description:
          axiosError.response?.data?.message ?? "No se pudo procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImportDialog = () => {
    setSelectedFile(null);
    setImportResult(null);
    setSheetIndex("0");
    setProveedorId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchCompras = async () => {
    try {
      const response = await get<PaginatedResponse<Compra>>(
        "/compras?page=1&limit=100"
      );
      setCompras(response.data);
      setFilteredCompras(response.data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las compras",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
    fetchProveedores();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await del(`/compras/${id}`);
      toast({ title: "Compra eliminada correctamente" });
      fetchCompras();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar la compra",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (estadoFilter === "all") {
      setFilteredCompras(compras);
    } else {
      setFilteredCompras(compras.filter((c) => c.estado === estadoFilter));
    }
  }, [estadoFilter, compras]);

  const columns: ColumnDef<Compra>[] = [
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("es-AR"),
    },
    {
      accessorKey: "numero",
      header: "Número",
    },
    {
      id: "proveedor",
      header: "Proveedor",
      cell: ({ row }) => row.original.proveedor?.razonSocial ?? "-",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={estadoCompraVariant(row.original.estado)}>
          {formatEstadoCompra(row.original.estado)}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const compra = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/compras/${compra.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {compra.estado === EstadoCompra.BORRADOR && (
              <RoleGate allowedRoles={[Role.ADMIN, Role.DEPOSITO]}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar compra</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Está seguro de que desea eliminar la compra #{compra.numero}?
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(compra.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </RoleGate>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Compras</h1>
        <div className="flex flex-wrap items-center gap-2">
          <RoleGate allowedRoles={[Role.ADMIN]}>
            <Button
              variant="outline"
              onClick={() => {
                resetImportDialog();
                setImportOpen(true);
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
            </Button>
          </RoleGate>
          <RoleGate allowedRoles={[Role.ADMIN, Role.DEPOSITO]}>
            <Button asChild>
              <Link href="/compras/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Compra
              </Link>
            </Button>
          </RoleGate>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.values(EstadoCompra).map((estado) => (
              <SelectItem key={estado} value={estado}>
                {formatEstadoCompra(estado)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filteredCompras}
        searchKey="numero"
        searchPlaceholder="Buscar compras..."
      />

      {/* Import Dialog */}
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!isImporting) {
            setImportOpen(open);
            if (!open) resetImportDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar compra desde Excel</DialogTitle>
            <DialogDescription>
              Suba un archivo .xlsx con las columnas: CODIGO, NOMBRE, STOCK
              (cantidad), Valor con IVA. Se creará una compra en estado borrador
              con los productos encontrados.
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Select value={proveedorId} onValueChange={setProveedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.razonSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compra-file">Archivo Excel (.xlsx)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="compra-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />
                    {selectedFile.name} (
                    {(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Número de hoja</Label>
                <Select value={sheetIndex} onValueChange={setSheetIndex}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Hoja 1</SelectItem>
                    <SelectItem value="1">Hoja 2</SelectItem>
                    <SelectItem value="2">Hoja 3</SelectItem>
                    <SelectItem value="3">Hoja 4</SelectItem>
                    <SelectItem value="4">Hoja 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Importación completada</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Compra N°</p>
                  <p className="text-xl font-bold">
                    #{importResult.compraNumero}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(importResult.total)}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Items creados</p>
                  <p className="text-xl font-bold">
                    {importResult.itemsCreados}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Items omitidos</p>
                  <p className="text-xl font-bold">
                    {importResult.itemsOmitidos}
                  </p>
                </div>
              </div>

              {importResult.errores.length > 0 && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    {importResult.errores.length} advertencia(s)
                  </p>
                  <div className="max-h-32 overflow-y-auto rounded-md border p-2 text-xs">
                    {importResult.errores.map((err, i) => (
                      <p key={i} className="text-muted-foreground">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!importResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setImportOpen(false)}
                  disabled={isImporting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isImporting ? "Importando..." : "Importar"}
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push(`/compras/${importResult.compraId}`);
                  }}
                >
                  Ver compra
                </Button>
                <Button onClick={() => setImportOpen(false)}>Cerrar</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
