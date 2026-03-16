"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CuitInput } from "@/components/shared/cuit-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CondicionIva, Proveedor, ContribuyenteArca } from "@/types";
import { formatCondicionIva } from "@/lib/formatters";
import { validateCuit } from "@/lib/cuit-validator";
import { post, patch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { AxiosError } from "axios";

const proveedorSchema = z.object({
  razonSocial: z.string().min(1, "La razón social es obligatoria"),
  cuit: z.string().refine(
    (val) => validateCuit(val.replace(/\D/g, "")),
    "El CUIT es inválido"
  ),
  condicionIva: z.nativeEnum(CondicionIva, {
    required_error: "La condición de IVA es obligatoria",
  }),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("El email es inválido").optional().or(z.literal("")),
  contacto: z.string().optional(),
});

type ProveedorFormData = z.infer<typeof proveedorSchema>;

interface ProveedorPrefill {
  razonSocial?: string;
  cuit?: string;
  condicionIva?: CondicionIva;
  direccion?: string;
}

interface ProveedorFormProps {
  proveedor?: Proveedor;
  prefill?: ProveedorPrefill;
}

export function ProveedorForm({ proveedor, prefill }: ProveedorFormProps) {
  const router = useRouter();
  const isEditing = !!proveedor;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      razonSocial: prefill?.razonSocial ?? proveedor?.razonSocial ?? "",
      cuit: prefill?.cuit ?? proveedor?.cuit ?? "",
      condicionIva: prefill?.condicionIva ?? proveedor?.condicionIva ?? undefined,
      direccion: prefill?.direccion ?? proveedor?.direccion ?? "",
      telefono: proveedor?.telefono ?? "",
      email: proveedor?.email ?? "",
      contacto: proveedor?.contacto ?? "",
    },
  });

  const cuitValue = watch("cuit");
  const condicionIvaValue = watch("condicionIva");

  const [isSearchingArca, setIsSearchingArca] = useState(false);
  const lastSearchedCuit = useRef("");

  const applyArcaResult = useCallback(
    (result: ContribuyenteArca) => {
      setValue("razonSocial", result.razonSocial, { shouldValidate: true });

      if (result.condicionIva in CondicionIva) {
        setValue("condicionIva", result.condicionIva as CondicionIva, {
          shouldValidate: true,
        });
      }

      const direccionParts = [
        result.direccion,
        result.localidad,
        result.provincia,
        result.codigoPostal ? `CP ${result.codigoPostal}` : null,
      ].filter(Boolean);

      if (direccionParts.length > 0) {
        setValue("direccion", direccionParts.join(", "), {
          shouldValidate: true,
        });
      }
    },
    [setValue]
  );

  const buscarArca = useCallback(
    async (cuit: string) => {
      if (lastSearchedCuit.current === cuit) return;
      lastSearchedCuit.current = cuit;

      setIsSearchingArca(true);
      try {
        const result = await post<ContribuyenteArca>(
          "/arca/consultar-contribuyente",
          { documento: cuit, tipoDocumento: "CUIT" }
        );
        applyArcaResult(result);
        toast({ title: "Datos obtenidos de ARCA" });
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        toast({
          title: "Error al consultar ARCA",
          description:
            axiosError.response?.data?.message ??
            "No se pudo obtener información del contribuyente",
          variant: "destructive",
        });
      } finally {
        setIsSearchingArca(false);
      }
    },
    [applyArcaResult]
  );

  // Auto-search when a valid 11-digit CUIT is entered
  useEffect(() => {
    if (isEditing || prefill) return;

    const clean = cuitValue?.replace(/\D/g, "") ?? "";
    if (clean.length === 11 && validateCuit(clean)) {
      const timer = setTimeout(() => buscarArca(clean), 400);
      return () => clearTimeout(timer);
    }
  }, [cuitValue, isEditing, prefill, buscarArca]);

  const handleBuscarArca = async () => {
    const cuitClean = cuitValue?.replace(/\D/g, "");
    if (!cuitClean || cuitClean.length < 7) {
      toast({
        title: "CUIT inválido",
        description: "Ingrese un CUIT válido antes de buscar",
        variant: "destructive",
      });
      return;
    }
    lastSearchedCuit.current = "";
    buscarArca(cuitClean);
  };

  const onSubmit = async (data: ProveedorFormData) => {
    try {
      const payload = {
        ...data,
        cuit: data.cuit.replace(/\D/g, ""),
        email: data.email || undefined,
        direccion: data.direccion || undefined,
        telefono: data.telefono || undefined,
        contacto: data.contacto || undefined,
      };

      if (isEditing) {
        await patch(`/proveedores/${proveedor.id}`, payload);
        toast({ title: "Proveedor actualizado correctamente" });
      } else {
        await post("/proveedores", payload);
        toast({ title: "Proveedor creado correctamente" });
      }
      router.push("/proveedores");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CuitInput
                    value={cuitValue}
                    onChange={(val) =>
                      setValue("cuit", val, { shouldValidate: true })
                    }
                    error={errors.cuit?.message}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleBuscarArca}
                  disabled={isSearchingArca || !cuitValue}
                  title="Buscar en ARCA"
                  className="shrink-0"
                >
                  {isSearchingArca ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {isSearchingArca && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando en ARCA...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social *</Label>
              <Input
                id="razonSocial"
                {...register("razonSocial")}
                placeholder="Razón social del proveedor"
              />
              {errors.razonSocial && (
                <p className="text-sm text-destructive">
                  {errors.razonSocial.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicionIva">Condición IVA *</Label>
              <Select
                value={condicionIvaValue}
                onValueChange={(val) =>
                  setValue("condicionIva", val as CondicionIva, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CondicionIva).map((ci) => (
                    <SelectItem key={ci} value={ci}>
                      {formatCondicionIva(ci)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.condicionIva && (
                <p className="text-sm text-destructive">
                  {errors.condicionIva.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@ejemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...register("telefono")}
                placeholder="Teléfono de contacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacto">Persona de contacto</Label>
              <Input
                id="contacto"
                {...register("contacto")}
                placeholder="Nombre del contacto"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                {...register("direccion")}
                placeholder="Dirección del proveedor"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/proveedores")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
