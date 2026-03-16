"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get } from "@/lib/api-client";
import { Proveedor } from "@/types";
import { toast } from "@/hooks/use-toast";
import { ProveedorForm } from "@/components/forms/proveedor-form";
import { Loader2 } from "lucide-react";

export default function EditarProveedorPage() {
  const params = useParams();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProveedor = async () => {
      try {
        const data = await get<Proveedor>(`/proveedores/${params.id}`);
        setProveedor(data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el proveedor",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProveedor();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Proveedor no encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ProveedorForm proveedor={proveedor} />
    </div>
  );
}
