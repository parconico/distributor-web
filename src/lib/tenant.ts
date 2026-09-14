// Todo lo que cambia entre un cliente y otro sale de acá, nunca del código.
// Las variables NEXT_PUBLIC_ se resuelven durante el build, así que cada
// instancia las define en su propio proyecto de Vercel.
//
// Los valores por defecto son exactamente los textos que estaban escritos a
// mano antes. Una instancia que no define nada se ve igual que siempre.

export const tenant = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Distribuidora",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Sistema de gestión para distribuidora",
  // Ids del menú separados por coma. "all" deja ver todos los módulos.
  modules: process.env.NEXT_PUBLIC_MODULES || "all",
};

export function moduleEnabled(id: string): boolean {
  if (tenant.modules === "all") return true;
  return tenant.modules
    .split(",")
    .map((m) => m.trim())
    .includes(id);
}
