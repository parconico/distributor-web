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

  // Carpeta de /public con los íconos de esta instancia: favicon, el de iOS y
  // los de la app instalable. Cada cliente tiene la suya, así una marca nunca
  // pisa la de otra.
  brandPath: process.env.NEXT_PUBLIC_BRAND_PATH || "/brand/default",

  // Logo horizontal para el menú y el login. Vacío deja el nombre en texto,
  // que es como se veía antes de que existieran los logos.
  logo: process.env.NEXT_PUBLIC_LOGO || "",

  // Pinta la barra de estado del teléfono en la app instalada.
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR || "#1a1a2e",
};

export function moduleEnabled(id: string): boolean {
  if (tenant.modules === "all") return true;
  return tenant.modules
    .split(",")
    .map((m) => m.trim())
    .includes(id);
}
