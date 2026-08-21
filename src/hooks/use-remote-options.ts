"use client";

import { useCallback, useEffect, useState } from "react";
import { get } from "@/lib/api-client";

interface RespuestaPaginada<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface Opciones {
  // Cuantas opciones traer por consulta. No es un tope del catalogo: es cuantas
  // se muestran a la vez mientras el usuario afina la busqueda.
  limit?: number;
  filtros?: Record<string, string | undefined>;
  enabled?: boolean;
}

/**
 * Opciones de un selector consultadas a la API a medida que se escribe.
 *
 * Reemplaza al patron de bajar el catalogo entero con "?limit=100" y filtrar en
 * memoria, que dejaba invisible todo lo que pasara de ese limite. Como el
 * filtrado ocurre en el servidor, alcanza cualquier registro por grande que sea
 * el catalogo.
 */
export function useRemoteOptions<T>(endpoint: string, opciones: Opciones = {}) {
  const { limit = 30, filtros, enabled = true } = opciones;

  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);

  const filtrosKey = JSON.stringify(filtros ?? {});

  const fetchOptions = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(limit),
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
      setOptions(res.data);
      setTotal(res.meta.total);
    } catch {
      // Un selector vacio ya comunica que no hay resultados; no interrumpimos
      // la carga del formulario con un toast por cada tecla.
      setOptions([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, limit, debouncedSearch, filtrosKey, enabled]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return {
    options,
    isLoading,
    search,
    setSearch,
    total,
    // Cuantas quedaron fuera de la tanda actual, para avisarle al usuario que
    // afine la busqueda en vez de dejarlo creyendo que no hay mas.
    ocultas: Math.max(0, total - options.length),
    refetch: fetchOptions,
  };
}
