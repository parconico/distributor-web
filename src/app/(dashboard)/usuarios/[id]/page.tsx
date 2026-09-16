"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { get } from "@/lib/api-client";
import { User } from "@/types";
import { toast } from "@/hooks/use-toast";
import { UsuarioForm } from "@/components/forms/usuario-form";
import { Loader2 } from "lucide-react";

export default function EditarUsuarioPage() {
  const params = useParams();
  const router = useRouter();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setUsuario(await get<User>(`/users/${params.id}`));
      } catch {
        toast({
          title: "Error",
          description: "No se encontró el usuario",
          variant: "destructive",
        });
        router.push("/usuarios");
      } finally {
        setIsLoading(false);
      }
    };
    cargar();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar Usuario</h1>
      <UsuarioForm usuario={usuario} />
    </div>
  );
}
