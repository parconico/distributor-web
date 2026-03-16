"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get } from "@/lib/api-client";
import { Producto } from "@/types";
import { toast } from "@/hooks/use-toast";
import { ProductoForm } from "@/components/forms/producto-form";
import { Loader2 } from "lucide-react";

export default function EditarProductoPage() {
  const params = useParams();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const data = await get<Producto>(`/productos/${params.id}`);
        setProducto(data);
      } catch {
        toast({
          title: "Error",
          description: "No se pudo cargar el producto",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducto();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Producto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ProductoForm producto={producto} />
    </div>
  );
}
