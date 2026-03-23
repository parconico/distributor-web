"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { get, del } from "@/lib/api-client";
import apiClient from "@/lib/api-client";
import { Producto, PaginatedResponse, Role } from "@/types";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/tables/data-table";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Pencil,
  Trash2,
  Plus,
  FolderTree,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AxiosError } from "axios";

const UNIDAD_MEDIDA_LABELS: Record<string, string> = {
  UNIDAD: "Unidad",
  KILOGRAMO: "Kilogramo",
  LITRO: "Litro",
  METRO: "Metro",
  CAJA: "Caja",
  PACK: "Pack",
};

interface ImportResult {
  familiasCreadas: number;
  subfamiliasCreadas: number;
  productosCreados: number;
  productosActualizados: number;
  preciosCargados: number;
  stockActualizado: number;
  errores: string[];
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetIndex, setSheetIndex] = useState("2");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProductos = async () => {
    try {
      const response = await get<PaginatedResponse<Producto>>(
        "/productos?page=1&limit=100"
      );
      setProductos(response.data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await del(`/productos/${id}`);
      toast({ title: "Producto eliminado correctamente" });
      fetchProductos();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sheetIndex", sheetIndex);

      const response = await apiClient.post<ImportResult>(
        "/productos/import",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setImportResult(response.data);
      fetchProductos();
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
    setSheetIndex("2");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const columns: ColumnDef<Producto>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      id: "subfamilia",
      header: "Subfamilia",
      cell: ({ row }) => {
        const sub = row.original.subfamilia;
        if (!sub) return "-";
        return sub.familia
          ? `${sub.familia.nombre} > ${sub.nombre}`
          : sub.nombre;
      },
    },
    {
      id: "proveedor",
      header: "Proveedor",
      cell: ({ row }) => row.original.proveedor?.razonSocial ?? "-",
    },
    {
      id: "unidadMedida",
      header: "Unidad",
      cell: ({ row }) =>
        UNIDAD_MEDIDA_LABELS[row.original.unidadMedida] ?? row.original.unidadMedida,
    },
    {
      id: "stockActual",
      header: "Stock Actual",
      cell: ({ row }) => {
        const producto = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{producto.stockActual}</span>
            {producto.stockActual < producto.stockMinimo && (
              <Badge variant="destructive">Bajo stock</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "alicuotaIva",
      header: "Alícuota IVA (%)",
      cell: ({ row }) => `${row.original.alicuotaIva}%`,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const producto = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/productos/${producto.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <RoleGate allowedRoles={[Role.ADMIN]}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de que desea eliminar {producto.nombre}?
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(producto.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </RoleGate>
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
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/productos/familias">
              <FolderTree className="mr-2 h-4 w-4" />
              Familias
            </Link>
          </Button>
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
            <Button asChild>
              <Link href="/productos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Link>
            </Button>
          </RoleGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={productos}
        searchKey="nombre"
        searchPlaceholder="Buscar productos..."
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
            <DialogTitle>Importar productos desde Excel</DialogTitle>
            <DialogDescription>
              Suba un archivo .xlsx con las columnas: CODIGO, FAMILIA, TIPO
              (subfamilia), NOMBRE, Valor con IVA, (vacío), LISTA 1, LISTA 2,
              LISTA 3. Se crearán automáticamente familias, subfamilias,
              productos y precios.
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="file">Archivo Excel (.xlsx)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
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
                <Label>Número de hoja (empezando desde 1)</Label>
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
                  <p className="text-muted-foreground">Familias creadas</p>
                  <p className="text-xl font-bold">
                    {importResult.familiasCreadas}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Subfamilias creadas</p>
                  <p className="text-xl font-bold">
                    {importResult.subfamiliasCreadas}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Productos creados</p>
                  <p className="text-xl font-bold">
                    {importResult.productosCreados}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Productos actualizados</p>
                  <p className="text-xl font-bold">
                    {importResult.productosActualizados}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Precios cargados</p>
                  <p className="text-xl font-bold">
                    {importResult.preciosCargados}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-muted-foreground">Stock actualizado</p>
                  <p className="text-xl font-bold">
                    {importResult.stockActualizado}
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
              <Button onClick={() => setImportOpen(false)}>Cerrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
