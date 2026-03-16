"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api-client";
import { ContribuyenteArca, CondicionIva } from "@/types";
import { formatCondicionIva } from "@/lib/formatters";
import { formatCuit } from "@/lib/cuit-validator";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Search,
  User,
  Building2,
  MapPin,
  FileCheck,
  Briefcase,
  UserPlus,
  Truck,
} from "lucide-react";
import { AxiosError } from "axios";

function detectTipoDocumento(doc: string): string {
  const clean = doc.replace(/\D/g, "");
  if (clean.length === 11) return "CUIT";
  if (clean.length >= 7 && clean.length <= 8) return "DNI";
  return "CUIT";
}

function formatCondicionIvaLabel(condicion: string): string {
  if (condicion in CondicionIva) {
    return formatCondicionIva(condicion as CondicionIva);
  }
  return condicion.replace(/_/g, " ");
}

export default function ConsultarContribuyentePage() {
  const router = useRouter();
  const [documento, setDocumento] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultado, setResultado] = useState<ContribuyenteArca | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    const clean = documento.replace(/\D/g, "");
    if (!clean || clean.length < 7) {
      toast({
        title: "Documento inválido",
        description: "Ingrese un CUIT (11 dígitos) o DNI (7-8 dígitos)",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setResultado(null);

    try {
      const tipoDocumento = detectTipoDocumento(clean);
      const result = await post<ContribuyenteArca>(
        "/arca/consultar-contribuyente",
        { documento: clean, tipoDocumento }
      );
      setResultado(result);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "No se encontraron resultados",
        description:
          axiosError.response?.data?.message ??
          "No se pudo obtener información del contribuyente",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [documento]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d-]/g, "");
    setDocumento(raw);
  };

  const handleCrearCliente = () => {
    if (!resultado) return;
    const params = new URLSearchParams({
      razonSocial: resultado.razonSocial,
      cuit: resultado.cuit,
      condicionIva: resultado.condicionIva,
      direccion: [
        resultado.direccion,
        resultado.localidad,
        resultado.provincia,
        resultado.codigoPostal ? `CP ${resultado.codigoPostal}` : "",
      ]
        .filter(Boolean)
        .join(", "),
    });
    router.push(`/clientes/nuevo?${params.toString()}`);
  };

  const handleCrearProveedor = () => {
    if (!resultado) return;
    const params = new URLSearchParams({
      razonSocial: resultado.razonSocial,
      cuit: resultado.cuit,
      condicionIva: resultado.condicionIva,
      direccion: [
        resultado.direccion,
        resultado.localidad,
        resultado.provincia,
        resultado.codigoPostal ? `CP ${resultado.codigoPostal}` : "",
      ]
        .filter(Boolean)
        .join(", "),
    });
    router.push(`/proveedores/nuevo?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Consultar Contribuyente</h1>
        <p className="text-muted-foreground mt-1">
          Ingresá un CUIT, CUIL o DNI para obtener los datos del contribuyente
          desde ARCA
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={documento}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ingresá CUIT, CUIL o DNI..."
                className="pl-10 h-12 text-lg"
                autoFocus
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !documento.replace(/\D/g, "")}
              className="h-12 px-6"
            >
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            CUIT/CUIL: 11 dígitos — DNI: 7-8 dígitos. Se detecta
            automáticamente.
          </p>
        </CardContent>
      </Card>

      {isSearching && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Consultando ARCA...</p>
        </div>
      )}

      {!isSearching && hasSearched && !resultado && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron datos para el documento ingresado
            </p>
          </CardContent>
        </Card>
      )}

      {resultado && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {resultado.tipoPersona === "JURIDICA" ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-xl">
                      {resultado.razonSocial}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      CUIT: {formatCuit(resultado.cuit)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      resultado.estadoClave === "ACTIVO"
                        ? "default"
                        : "destructive"
                    }
                    className={
                      resultado.estadoClave === "ACTIVO"
                        ? "bg-green-600 hover:bg-green-600/80 text-white border-transparent"
                        : ""
                    }
                  >
                    {resultado.estadoClave}
                  </Badge>
                  <Badge variant="outline">
                    {resultado.tipoPersona === "JURIDICA"
                      ? "Persona Jurídica"
                      : "Persona Física"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Datos Fiscales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Condición IVA
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {formatCondicionIvaLabel(resultado.condicionIva)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  CUIT
                </p>
                <p className="text-sm font-medium mt-0.5 font-mono">
                  {formatCuit(resultado.cuit)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Estado
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {resultado.estadoClave}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Domicilio Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resultado.direccion && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Dirección
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    {resultado.direccion}
                  </p>
                </div>
              )}
              {resultado.localidad && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Localidad
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {resultado.localidad}
                    </p>
                  </div>
                </>
              )}
              {resultado.provincia && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Provincia
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {resultado.provincia}
                    </p>
                  </div>
                </>
              )}
              {resultado.codigoPostal && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Código Postal
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {resultado.codigoPostal}
                    </p>
                  </div>
                </>
              )}
              {!resultado.direccion &&
                !resultado.localidad &&
                !resultado.provincia && (
                  <p className="text-sm text-muted-foreground">
                    Sin datos de domicilio
                  </p>
                )}
            </CardContent>
          </Card>

          {resultado.actividades.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Actividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resultado.actividades.map((act, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {act}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={handleCrearCliente}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear como Cliente
                </Button>
                <Button variant="outline" onClick={handleCrearProveedor}>
                  <Truck className="mr-2 h-4 w-4" />
                  Crear como Proveedor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
