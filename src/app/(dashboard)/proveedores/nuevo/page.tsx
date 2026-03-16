"use client";

import { useSearchParams } from "next/navigation";
import { ProveedorForm } from "@/components/forms/proveedor-form";
import { CondicionIva } from "@/types";
import { formatCuit } from "@/lib/cuit-validator";

export default function NuevoProveedorPage() {
  const searchParams = useSearchParams();

  const prefill = searchParams.get("cuit")
    ? {
        razonSocial: searchParams.get("razonSocial") ?? undefined,
        cuit: formatCuit(searchParams.get("cuit") ?? ""),
        condicionIva: (searchParams.get("condicionIva") as CondicionIva) ?? undefined,
        direccion: searchParams.get("direccion") ?? undefined,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <ProveedorForm prefill={prefill} />
    </div>
  );
}
