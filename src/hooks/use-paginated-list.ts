"use client";

import { useCallback, useEffect, useState } from "react";
import { get } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

// Forma que devuelven los endpoints paginados de la API: el total va en "meta",
// no aplanado como el tipo PaginatedResponse de src/types.
interface RespuestaPaginada<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface Opciones {
  pageSize?: number;
  // Filtros extra que viajan en el query string. Cambiarlos vuelve a la pagina 1.
  filtros?: Record<string, string | undefined>;
  errorMessage?: string;
}

/**
 * Listado paginado y buscado del lado del servidor.
 *
 * Reemplaza al patron viejo de pedir "?page=1&limit=100" una sola vez y paginar
 * en el browser, que dejaba inalcanzable todo lo que pasara del limite.
 */
export function usePaginatedList<T>(endpoint: string, opciones: Opciones = {}) {
  const {
    pageSize = 20,
    filtros,
    errorMessage = "No se pudieron cargar los datos",
  } = opciones;

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Serializamos los filtros para poder compararlos por valor en las deps: si
  // el llamador arma el objeto inline, su identidad cambia en cada render.
  const filtrosKey = JSON.stringify(filtros ?? {});

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      for (const [k, v] of Object.entries(
        JSON.parse(filtrosKey) as Record<string, string | undefined>
      )) {
        if (v) params.set(k, v);
      }

      const res = await get<RespuestaPaginada<T>>(
        `${endpoint}?${params.toString()}`
      );
      setItems(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, page, pageSize, debouncedSearch, filtrosKey, errorMessage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Al tipear volvemos a la primera pagina: el resultado filtrado puede tener
  // menos paginas que el listado completo.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Cambiar un filtro tambien reinicia el paginado.
  useEffect(() => {
    setPage(1);
  }, [filtrosKey]);

  // Borrar el ultimo registro de la ultima pagina nos dejaria fuera de rango.
  useEffect(() => {
    if (!isLoading && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [isLoading, page, totalPages]);

  return {
    items,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
    refetch: fetchItems,
  };
}
