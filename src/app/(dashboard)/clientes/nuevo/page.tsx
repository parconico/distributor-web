"use client";

import { useSearchParams } from "next/navigation";
import { ClienteForm } from "@/components/forms/cliente-form";
import { CondicionIva } from "@/types";
import { formatCuit } from "@/lib/cuit-validator";

export default function NuevoClientePage() {
  const searchParams = useSearchParams();

  const prefill = searchParams.get("cuit")
    ? {
        razonSocial: searchParams.get("razonSocial") ?? undefined,
        tipoDocumento: "CUIT" as const,
        numeroDocumento: formatCuit(searchParams.get("cuit") ?? ""),
        condicionIva: (searchParams.get("condicionIva") as CondicionIva) ?? undefined,
        direccion: searchParams.get("direccion") ?? undefined,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <ClienteForm prefill={prefill} />
    </div>
  );
}
