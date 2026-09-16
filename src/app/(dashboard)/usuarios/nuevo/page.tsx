"use client";

import { UsuarioForm } from "@/components/forms/usuario-form";

export default function NuevoUsuarioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nuevo Usuario</h1>
      <UsuarioForm />
    </div>
  );
}
