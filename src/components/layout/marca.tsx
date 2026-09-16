import { tenant } from "@/lib/tenant";

/**
 * El logo de la instancia. Sin logo cargado cae en el nombre escrito, que es
 * como se veía el sistema antes de que existieran los logos, así una instancia
 * que no define NEXT_PUBLIC_LOGO no cambia en nada.
 */
export function Marca({ alto = 28 }: { alto?: number }) {
  if (!tenant.logo) {
    return (
      <span className="text-lg font-bold text-primary">{tenant.name}</span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tenant.logo}
      alt={tenant.name}
      style={{ height: alto }}
      className="w-auto max-w-full object-contain"
    />
  );
}
