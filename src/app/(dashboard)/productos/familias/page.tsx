"use client";

import { useEffect, useState } from "react";
import { get, post, patch, del } from "@/lib/api-client";
import { Familia, Subfamilia } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { AxiosError } from "axios";

export default function FamiliasPage() {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFamilias, setExpandedFamilias] = useState<Set<string>>(
    new Set()
  );

  // New familia state
  const [showNewFamilia, setShowNewFamilia] = useState(false);
  const [newFamiliaName, setNewFamiliaName] = useState("");
  const [isCreatingFamilia, setIsCreatingFamilia] = useState(false);

  // Edit familia state
  const [editingFamiliaId, setEditingFamiliaId] = useState<string | null>(null);
  const [editingFamiliaName, setEditingFamiliaName] = useState("");

  // New subfamilia state
  const [addingSubfamiliaTo, setAddingSubfamiliaTo] = useState<string | null>(
    null
  );
  const [newSubfamiliaName, setNewSubfamiliaName] = useState("");
  const [isCreatingSubfamilia, setIsCreatingSubfamilia] = useState(false);

  // Edit subfamilia state
  const [editingSubfamiliaId, setEditingSubfamiliaId] = useState<string | null>(
    null
  );
  const [editingSubfamiliaName, setEditingSubfamiliaName] = useState("");

  const fetchFamilias = async () => {
    try {
      const data = await get<Familia[]>("/familias");
      setFamilias(data);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las familias",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilias();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedFamilias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Familia CRUD
  const handleCreateFamilia = async () => {
    if (!newFamiliaName.trim()) return;
    setIsCreatingFamilia(true);
    try {
      await post("/familias", { nombre: newFamiliaName.trim() });
      toast({ title: "Familia creada correctamente" });
      setNewFamiliaName("");
      setShowNewFamilia(false);
      fetchFamilias();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ?? "No se pudo crear la familia",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFamilia(false);
    }
  };

  const handleUpdateFamilia = async (id: string) => {
    if (!editingFamiliaName.trim()) return;
    try {
      await patch(`/familias/${id}`, { nombre: editingFamiliaName.trim() });
      toast({ title: "Familia actualizada correctamente" });
      setEditingFamiliaId(null);
      fetchFamilias();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo actualizar la familia",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFamilia = async (id: string) => {
    try {
      await del(`/familias/${id}`);
      toast({ title: "Familia eliminada correctamente" });
      fetchFamilias();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo eliminar la familia",
        variant: "destructive",
      });
    }
  };

  // Subfamilia CRUD
  const handleCreateSubfamilia = async (familiaId: string) => {
    if (!newSubfamiliaName.trim()) return;
    setIsCreatingSubfamilia(true);
    try {
      await post("/subfamilias", {
        nombre: newSubfamiliaName.trim(),
        familiaId,
      });
      toast({ title: "Subfamilia creada correctamente" });
      setNewSubfamiliaName("");
      setAddingSubfamiliaTo(null);
      fetchFamilias();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo crear la subfamilia",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSubfamilia(false);
    }
  };

  const handleUpdateSubfamilia = async (id: string) => {
    if (!editingSubfamiliaName.trim()) return;
    try {
      await patch(`/subfamilias/${id}`, {
        nombre: editingSubfamiliaName.trim(),
      });
      toast({ title: "Subfamilia actualizada correctamente" });
      setEditingSubfamiliaId(null);
      fetchFamilias();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo actualizar la subfamilia",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubfamilia = async (id: string) => {
    try {
      await del(`/subfamilias/${id}`);
      toast({ title: "Subfamilia eliminada correctamente" });
      fetchFamilias();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo eliminar la subfamilia",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Familias y Subfamilias</h1>
        <Button onClick={() => setShowNewFamilia(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Familia
        </Button>
      </div>

      {showNewFamilia && (
        <Card>
          <CardContent className="flex items-center gap-2 pt-6">
            <Input
              placeholder="Nombre de la familia"
              value={newFamiliaName}
              onChange={(e) => setNewFamiliaName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFamilia();
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateFamilia}
              disabled={isCreatingFamilia}
            >
              {isCreatingFamilia ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewFamilia(false);
                setNewFamiliaName("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {familias.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No hay familias creadas
          </p>
        )}
        {familias.map((familia) => (
          <Card key={familia.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(familia.id)}
                  >
                    {expandedFamilias.has(familia.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {editingFamiliaId === familia.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingFamiliaName}
                        onChange={(e) => setEditingFamiliaName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleUpdateFamilia(familia.id);
                        }}
                        className="h-8 w-60"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateFamilia(familia.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingFamiliaId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <CardTitle className="text-base">
                      {familia.nombre}
                    </CardTitle>
                  )}
                </div>

                {editingFamiliaId !== familia.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddingSubfamiliaTo(familia.id);
                        setExpandedFamilias((prev) =>
                          new Set(prev).add(familia.id)
                        );
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFamiliaId(familia.id);
                        setEditingFamiliaName(familia.nombre);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Eliminar familia
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Está seguro de que desea eliminar la familia{" "}
                            {familia.nombre}? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteFamilia(familia.id)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>

            {expandedFamilias.has(familia.id) && (
              <CardContent className="pt-0">
                <div className="ml-8 space-y-2">
                  {familia.subfamilias?.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      {editingSubfamiliaId === sub.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingSubfamiliaName}
                            onChange={(e) =>
                              setEditingSubfamiliaName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleUpdateSubfamilia(sub.id);
                            }}
                            className="h-8 w-60"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateSubfamilia(sub.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSubfamiliaId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm">{sub.nombre}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSubfamiliaId(sub.id);
                                setEditingSubfamiliaName(sub.nombre);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Eliminar subfamilia
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Está seguro de que desea eliminar la
                                    subfamilia {sub.nombre}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteSubfamilia(sub.id)
                                    }
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {(!familia.subfamilias ||
                    familia.subfamilias.length === 0) &&
                    addingSubfamiliaTo !== familia.id && (
                      <p className="text-sm text-muted-foreground py-2">
                        Sin subfamilias
                      </p>
                    )}

                  {addingSubfamiliaTo === familia.id && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nombre de la subfamilia"
                        value={newSubfamiliaName}
                        onChange={(e) => setNewSubfamiliaName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleCreateSubfamilia(familia.id);
                        }}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCreateSubfamilia(familia.id)}
                        disabled={isCreatingSubfamilia}
                      >
                        {isCreatingSubfamilia ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAddingSubfamiliaTo(null);
                          setNewSubfamiliaName("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
