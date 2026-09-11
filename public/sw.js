// Service worker minimo: existe para que Chrome considere la app instalable en
// Android, que a diferencia de iOS lo exige.
//
// Deliberadamente NO cachea JS, CSS ni llamadas a la API: todo eso pasa directo
// a la red. Cachear los assets de Next dejaria la app sirviendo una version
// vieja despues de cada deploy, que es un problema mucho peor que no tener
// modo offline. Lo unico que guardamos es la pantalla de "sin conexion", que
// Chrome necesita para dar por cumplido el requisito de responder offline.

const VERSION = "v1";
const CACHE = `distribuidora-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      // Sin esto el service worker nuevo espera a que se cierren todas las
      // pestañas, y un arreglo urgente podria tardar dias en aplicarse.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo interceptamos la navegacion. El resto (assets, API) va a la red tal
  // cual, sin pasar por el cache.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      const offline = await cache.match(OFFLINE_URL);
      return (
        offline ||
        new Response("Sin conexión", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }),
  );
});
