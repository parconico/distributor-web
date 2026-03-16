"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get } from "@/lib/api-client";
import { Cliente } from "@/types";
import { toast } from "@/hooks/use-toast";
import { ClienteForm } from "@/components/forms/cliente-form";
import { Loader2 } from "lucide-react";

export default function EditarClientePage() {
  const params = useParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const data = await get<Cliente>(`/clientes/${params.id}`);
        setCliente(data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el cliente",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCliente();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cliente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ClienteForm cliente={cliente} />
    </div>
  );
}
