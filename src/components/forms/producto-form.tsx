"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Familia,
  Proveedor,
  Producto,
  UnidadMedida,
  PaginatedResponse,
} from "@/types";
import { get, post, patch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

const UNIDAD_MEDIDA_LABELS: Record<UnidadMedida, string> = {
  [UnidadMedida.UNIDAD]: "Unidad",
  [UnidadMedida.KILOGRAMO]: "Kilogramo",
  [UnidadMedida.LITRO]: "Litro",
  [UnidadMedida.METRO]: "Metro",
  [UnidadMedida.CAJA]: "Caja",
  [UnidadMedida.PACK]: "Pack",
};

const ALICUOTA_IVA_OPTIONS = [0, 2.5, 5, 10.5, 21, 27];

const productoSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  subfamiliaId: z.string().min(1, "La subfamilia es obligatoria"),
  proveedorId: z.string().optional(),
  unidadMedida: z.nativeEnum(UnidadMedida, {
    required_error: "La unidad de medida es obligatoria",
  }),
  alicuotaIva: z.coerce.number({ required_error: "La alícuota es obligatoria" }),
  stockActual: z.coerce
    .number({ invalid_type_error: "Debe ser un número" })
    .min(0, "El stock actual no puede ser negativo"),
  stockMinimo: z.coerce
    .number({ invalid_type_error: "Debe ser un número" })
    .min(0, "El stock mínimo no puede ser negativo"),
});

type ProductoFormData = z.infer<typeof productoSchema>;

interface ProductoFormProps {
  producto?: Producto;
}

export function ProductoForm({ producto }: ProductoFormProps) {
  const router = useRouter();
  const isEditing = !!producto;
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: producto?.codigo ?? "",
      nombre: producto?.nombre ?? "",
      descripcion: producto?.descripcion ?? "",
      subfamiliaId: producto?.subfamiliaId ?? "",
      proveedorId: producto?.proveedorId ?? "",
      unidadMedida: producto?.unidadMedida ?? undefined,
      alicuotaIva: producto?.alicuotaIva ?? 21,
      stockActual: producto?.stockActual ?? 0,
      stockMinimo: producto?.stockMinimo ?? 0,
    },
  });

  const subfamiliaIdValue = watch("subfamiliaId");
  const proveedorIdValue = watch("proveedorId");
  const unidadMedidaValue = watch("unidadMedida");
  const alicuotaIvaValue = watch("alicuotaIva");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [familiasRes, proveedoresRes] = await Promise.all([
          get<PaginatedResponse<Familia>>("/familias?page=1&limit=100"),
          get<PaginatedResponse<Proveedor>>("/proveedores?page=1&limit=100"),
        ]);
        setFamilias(familiasRes.data);
        setProveedores(proveedoresRes.data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del formulario",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: ProductoFormData) => {
    try {
      const payload = {
        ...data,
        descripcion: data.descripcion || undefined,
        proveedorId: data.proveedorId || undefined,
      };

      if (isEditing) {
        await patch(`/productos/${producto.id}`, payload);
        toast({ title: "Producto actualizado correctamente" });
      } else {
        await post("/productos", payload);
        toast({ title: "Producto creado correctamente" });
      }
      router.push("/productos");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Editar Producto" : "Nuevo Producto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                {...register("codigo")}
                placeholder="Código del producto"
              />
              {errors.codigo && (
                <p className="text-sm text-destructive">
                  {errors.codigo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                {...register("nombre")}
                placeholder="Nombre del producto"
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subfamiliaId">Subfamilia *</Label>
              <Select
                value={subfamiliaIdValue}
                onValueChange={(val) =>
                  setValue("subfamiliaId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subfamilia" />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((familia) => (
                    <SelectGroup key={familia.id}>
                      <SelectLabel>{familia.nombre}</SelectLabel>
                      {familia.subfamilias?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {familia.nombre} &gt; {sub.nombre}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {errors.subfamiliaId && (
                <p className="text-sm text-destructive">
                  {errors.subfamiliaId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedorId">Proveedor</Label>
              <Select
                value={proveedorIdValue}
                onValueChange={(val) =>
                  setValue("proveedorId", val === "_none" ? "" : val, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin proveedor</SelectItem>
                  {proveedores.map((prov) => (
                    <SelectItem key={prov.id} value={prov.id}>
                      {prov.razonSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidadMedida">Unidad de Medida *</Label>
              <Select
                value={unidadMedidaValue}
                onValueChange={(val) =>
                  setValue("unidadMedida", val as UnidadMedida, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UnidadMedida).map((um) => (
                    <SelectItem key={um} value={um}>
                      {UNIDAD_MEDIDA_LABELS[um]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unidadMedida && (
                <p className="text-sm text-destructive">
                  {errors.unidadMedida.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alicuotaIva">Alícuota IVA *</Label>
              <Select
                value={String(alicuotaIvaValue)}
                onValueChange={(val) =>
                  setValue("alicuotaIva", Number(val), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar alícuota" />
                </SelectTrigger>
                <SelectContent>
                  {ALICUOTA_IVA_OPTIONS.map((rate) => (
                    <SelectItem key={rate} value={String(rate)}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.alicuotaIva && (
                <p className="text-sm text-destructive">
                  {errors.alicuotaIva.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockActual">Stock Actual *</Label>
              <Input
                id="stockActual"
                type="number"
                min="0"
                step="0.001"
                {...register("stockActual")}
                placeholder="0"
              />
              {errors.stockActual && (
                <p className="text-sm text-destructive">
                  {errors.stockActual.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
              <Input
                id="stockMinimo"
                type="number"
                min="0"
                {...register("stockMinimo")}
                placeholder="0"
              />
              {errors.stockMinimo && (
                <p className="text-sm text-destructive">
                  {errors.stockMinimo.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                {...register("descripcion")}
                placeholder="Descripción del producto"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/productos")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
