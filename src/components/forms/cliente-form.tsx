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
import { CondicionIva, ListaPrecio, Cliente, ContribuyenteArca } from "@/types";
import { formatCondicionIva, formatListaPrecio } from "@/lib/formatters";
import { validateCuit, formatCuit } from "@/lib/cuit-validator";
import { post, patch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { AxiosError } from "axios";

const clienteSchema = z
  .object({
    razonSocial: z.string().min(1, "La razón social es obligatoria"),
    tipoDocumento: z.string().optional().default("CUIT"),
    numeroDocumento: z.string().optional().default(""),
    condicionIva: z.nativeEnum(CondicionIva, {
      required_error: "La condición de IVA es obligatoria",
    }),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email("El email es inválido").optional().or(z.literal("")),
    listaPrecio: z.nativeEnum(ListaPrecio, {
      required_error: "La lista de precios es obligatoria",
    }),
    limiteCredito: z.coerce
      .number({ invalid_type_error: "Debe ser un número" })
      .min(0, "El límite de crédito no puede ser negativo"),
  })
;

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClientePrefill {
  razonSocial?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  condicionIva?: CondicionIva;
  direccion?: string;
}

interface ClienteFormProps {
  cliente?: Cliente;
  prefill?: ClientePrefill;
}

export function ClienteForm({ cliente, prefill }: ClienteFormProps) {
  const router = useRouter();
  const isEditing = !!cliente;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      razonSocial: prefill?.razonSocial ?? cliente?.razonSocial ?? "",
      tipoDocumento: prefill?.tipoDocumento ?? cliente?.tipoDocumento ?? "CUIT",
      numeroDocumento: prefill?.numeroDocumento ?? cliente?.numeroDocumento ?? "",
      condicionIva: prefill?.condicionIva ?? cliente?.condicionIva ?? undefined,
      direccion: prefill?.direccion ?? cliente?.direccion ?? "",
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      listaPrecio: cliente?.listaPrecio ?? undefined,
      limiteCredito: cliente?.limiteCredito ?? 0,
    },
  });

  const tipoDocumento = watch("tipoDocumento");
  const numeroDocumento = watch("numeroDocumento");
  const condicionIvaValue = watch("condicionIva");
  const listaPrecioValue = watch("listaPrecio");

  const [isSearchingArca, setIsSearchingArca] = useState(false);
  const lastSearchedDoc = useRef("");

  const applyArcaResult = useCallback(
    (result: ContribuyenteArca) => {
      setValue("razonSocial", result.razonSocial, { shouldValidate: true });

      if (result.condicionIva in CondicionIva) {
        setValue("condicionIva", result.condicionIva as CondicionIva, {
          shouldValidate: true,
        });
      }

      if (result.cuit) {
        setValue("tipoDocumento", "CUIT", { shouldValidate: true });
        setValue("numeroDocumento", formatCuit(result.cuit), {
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
    async (doc: string, tipo: string) => {
      if (lastSearchedDoc.current === doc) return;
      lastSearchedDoc.current = doc;

      setIsSearchingArca(true);
      try {
        const result = await post<ContribuyenteArca>(
          "/arca/consultar-contribuyente",
          { documento: doc, tipoDocumento: tipo }
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

  // Auto-search: when user finishes typing a valid CUIT or a DNI
  useEffect(() => {
    if (isEditing || prefill) return;

    const clean = numeroDocumento?.replace(/\D/g, "") ?? "";

    if (tipoDocumento === "CUIT" && clean.length === 11 && validateCuit(clean)) {
      const timer = setTimeout(() => buscarArca(clean, "CUIT"), 400);
      return () => clearTimeout(timer);
    }

    if (tipoDocumento === "DNI" && clean.length >= 7 && clean.length <= 8) {
      const timer = setTimeout(() => buscarArca(clean, "DNI"), 600);
      return () => clearTimeout(timer);
    }
  }, [numeroDocumento, tipoDocumento, isEditing, prefill, buscarArca]);

  const handleBuscarArca = async () => {
    const doc = numeroDocumento?.replace(/\D/g, "");
    if (!doc || doc.length < 7) {
      toast({
        title: "Documento inválido",
        description: "Ingrese un número de documento válido antes de buscar",
        variant: "destructive",
      });
      return;
    }
    lastSearchedDoc.current = "";
    buscarArca(doc, tipoDocumento);
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const payload = {
        ...data,
        numeroDocumento:
          data.tipoDocumento === "CUIT"
            ? data.numeroDocumento.replace(/\D/g, "")
            : data.numeroDocumento,
        email: data.email || undefined,
        direccion: data.direccion || undefined,
        telefono: data.telefono || undefined,
      };

      if (isEditing) {
        await patch(`/clientes/${cliente.id}`, payload);
        toast({ title: "Cliente actualizado correctamente" });
      } else {
        await post("/clientes", payload);
        toast({ title: "Cliente creado correctamente" });
      }
      router.push("/clientes");
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
        <CardTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
              <Select
                value={tipoDocumento}
                onValueChange={(val) =>
                  setValue("tipoDocumento", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUIT">CUIT</SelectItem>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CUIL">CUIL</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipoDocumento && (
                <p className="text-sm text-destructive">
                  {errors.tipoDocumento.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroDocumento">Número de Documento</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  {tipoDocumento === "CUIT" || tipoDocumento === "CUIL" ? (
                    <CuitInput
                      value={numeroDocumento}
                      onChange={(val) =>
                        setValue("numeroDocumento", val, {
                          shouldValidate: true,
                        })
                      }
                      error={errors.numeroDocumento?.message}
                    />
                  ) : (
                    <>
                      <Input
                        id="numeroDocumento"
                        {...register("numeroDocumento")}
                        placeholder="Número de documento"
                      />
                      {errors.numeroDocumento && (
                        <p className="text-sm text-destructive">
                          {errors.numeroDocumento.message}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleBuscarArca}
                  disabled={isSearchingArca || !numeroDocumento}
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
                placeholder="Razón social del cliente"
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
              <Label htmlFor="listaPrecio">Lista de Precios *</Label>
              <Select
                value={listaPrecioValue}
                onValueChange={(val) =>
                  setValue("listaPrecio", val as ListaPrecio, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lista" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ListaPrecio).map((lp) => (
                    <SelectItem key={lp} value={lp}>
                      {formatListaPrecio(lp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.listaPrecio && (
                <p className="text-sm text-destructive">
                  {errors.listaPrecio.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="limiteCredito">Límite de Crédito *</Label>
              <Input
                id="limiteCredito"
                type="number"
                step="0.01"
                min="0"
                {...register("limiteCredito")}
                placeholder="0.00"
              />
              {errors.limiteCredito && (
                <p className="text-sm text-destructive">
                  {errors.limiteCredito.message}
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                {...register("direccion")}
                placeholder="Dirección del cliente"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/clientes")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
