import { tenant } from "@/lib/tenant";

// El manifest era un archivo estático en /public, así que el nombre con el que
// la app se instala en el teléfono quedaba escrito a mano. Ahora se arma en el
// build a partir de la config de la instancia.
//
// Queda servido en la misma URL de siempre, /manifest.json, para no romper las
// apps que ya están instaladas.
export function GET() {
  const manifest = {
    name: `${tenant.name} - Sistema de Gestión`,
    short_name: tenant.name,
    description: tenant.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1a1a2e",
    lang: "es-AR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
