"use client";

import { useEffect } from "react";

/**
 * Piezas de la PWA que necesitan ejecutarse en el cliente.
 *
 * 1. Registra el service worker. Corre siempre, también en el navegador:
 *    Android solo ofrece instalar la app si hay uno registrado.
 * 2. Bloquea el zoom, pero únicamente con la app ya instalada. Dentro del
 *    navegador el zoom sigue disponible, que es donde alguien puede
 *    necesitarlo para leer. No alcanza con maximum-scale en el viewport: iOS
 *    lo ignora a propósito desde la versión 10, y lo que sí frena el pinch en
 *    Safari es cancelar sus eventos propios de gesto.
 */
export function PwaMode() {
  useEffect(() => {
    // Android solo ofrece instalar la app si hay un service worker registrado,
    // asi que esto corre siempre, tambien fuera del modo standalone.
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Que falle el registro no puede romper la app: solo pierde la
      // instalabilidad en Android.
    });
  }, []);

  useEffect(() => {
    const enStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS viejo no soporta la media query y expone esto en su lugar.
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (!enStandalone) return;

    document.documentElement.classList.add("pwa");

    const cancelar = (e: Event) => e.preventDefault();
    // Eventos de gesto de Safari: sin esto el pinch sigue haciendo zoom.
    document.addEventListener("gesturestart", cancelar, { passive: false });
    document.addEventListener("gesturechange", cancelar, { passive: false });
    document.addEventListener("gestureend", cancelar, { passive: false });

    return () => {
      document.documentElement.classList.remove("pwa");
      document.removeEventListener("gesturestart", cancelar);
      document.removeEventListener("gesturechange", cancelar);
      document.removeEventListener("gestureend", cancelar);
    };
  }, []);

  return null;
}
