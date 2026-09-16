"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Role, User } from "@/types";
import { formatRole, DESCRIPCION_ROL } from "@/lib/roles";
import { post, patch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

const usuarioSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  email: z.string().min(1, "El email es obligatorio").email("El email es inválido"),
  // Al editar se deja vacía para no cambiarla.
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || v.length >= 6, {
      message: "La contraseña necesita al menos 6 caracteres",
    }),
  role: z.nativeEnum(Role, { required_error: "El rol es obligatorio" }),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

export function UsuarioForm({ usuario }: { usuario?: User }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(usuario);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      firstName: usuario?.firstName ?? "",
      lastName: usuario?.lastName ?? "",
      email: usuario?.email ?? "",
      password: "",
      role: usuario?.role ?? Role.VENDEDOR,
    },
  });

  const role = watch("role");

  const onSubmit = async (data: UsuarioFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        // Sin contraseña nueva no se manda el campo: el backend la conserva.
        const cambios: Record<string, unknown> = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
        };
        if (data.password) cambios.password = data.password;
        await patch(`/users/${usuario!.id}`, cambios);
        toast({ title: "Usuario actualizado" });
      } else {
        if (!data.password) {
          toast({
            title: "Falta la contraseña",
            description: "Un usuario nuevo necesita una contraseña inicial.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        await post("/users", data);
        toast({ title: "Usuario creado" });
      }
      router.push("/usuarios");
      router.refresh();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo guardar el usuario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input id="firstName" {...register("firstName")} placeholder="Juan" />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input id="lastName" {...register("lastName")} placeholder="Pérez" />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                {...register("email")}
                placeholder="usuario@empresa.com"
              />
              <p className="text-xs text-muted-foreground">
                Con este email entra al sistema.
              </p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="password">
                {isEditing ? "Nueva contraseña" : "Contraseña *"}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                placeholder={isEditing ? "Dejar vacío para no cambiarla" : "Mínimo 6 caracteres"}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={role}
                onValueChange={(v) => setValue("role", v as Role)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Role).map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {DESCRIPCION_ROL[role]}
              </p>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/usuarios")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
