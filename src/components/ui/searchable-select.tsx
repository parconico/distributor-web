"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  // Opciones con el mismo grupo seguidas se muestran bajo un mismo titulo
  group?: string;
}

interface SearchableSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SearchableOption[];
  search: string;
  onSearchChange: (search: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  // Resultados que coinciden pero no se trajeron. Se avisa para que se afine
  // la busqueda en vez de pensar que el registro no existe.
  ocultas?: number;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector con buscador para catalogos que se consultan a la API.
 *
 * Reemplaza al patron de meter un Input dentro de un Select de Radix. El
 * Select se cierra cada vez que la ventana cambia de tamaño, y en Android
 * abrir el teclado achica la ventana: el buscador desaparecia apenas se
 * tocaba y el teclado se volvia a esconder. El Popover no escucha el resize.
 */
export function SearchableSelect({
  value,
  onValueChange,
  options,
  search,
  onSearchChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  ocultas = 0,
  isLoading = false,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Recuerda el texto de cada opcion vista. Si la busqueda cambia y la opcion
  // elegida ya no esta en la lista, el boton sigue mostrando su nombre.
  const labels = React.useRef(new Map<string, string>());
  for (const o of options) labels.current.set(o.value, o.label);
  const selectedLabel = value ? labels.current.get(value) : undefined;

  React.useEffect(() => {
    setHighlighted(0);
  }, [options]);

  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${highlighted}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const elegir = (v: string) => {
    onValueChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = options[highlighted];
      if (o) elegir(o.value);
    }
  };

  return (
    // modal: dentro de un Dialog, el bloqueo de scroll del Dialog impedia
    // desplazar la lista. Siendo modal, el Popover pasa a ser la capa de arriba.
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal>
      <PopoverPrimitive.Trigger
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span
          className={cn(
            "line-clamp-1 text-left",
            !selectedLabel && "text-muted-foreground"
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[12rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="p-1">
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div
            ref={listRef}
            role="listbox"
            className="max-h-[min(18rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain"
          >
            {options.map((o, i) => {
              const nuevoGrupo = o.group && o.group !== options[i - 1]?.group;
              return (
                <React.Fragment key={o.value}>
                  {nuevoGrupo && (
                    <div className="py-1.5 pl-8 pr-2 text-sm font-semibold">
                      {o.group}
                    </div>
                  )}
                  <div
                    role="option"
                    aria-selected={o.value === value}
                    data-index={i}
                    onMouseMove={() => setHighlighted(i)}
                    onClick={() => elegir(o.value)}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm",
                      i === highlighted && "bg-accent text-accent-foreground"
                    )}
                  >
                    {o.value === value && (
                      <Check className="absolute left-2 h-4 w-4" />
                    )}
                    {o.label}
                  </div>
                </React.Fragment>
              );
            })}
            {options.length === 0 && (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                {isLoading ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Sin resultados"
                )}
              </p>
            )}
            {ocultas > 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                +{ocultas} más. Afiná la búsqueda.
              </p>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
