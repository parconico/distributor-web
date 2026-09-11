"use client";

import { useEffect } from "react";

/**
 * Marca el documento cuando la app corre instalada y bloquea el zoom ahí.
 *
 * Solo aplica en modo standalone: dentro del navegador el zoom sigue
 * disponible, que es donde alguien puede necesitarlo para leer.
 *
 * No alcanza con maximum-scale en el viewport: iOS lo ignora a propósito desde
 * la versión 10. Lo que sí frena el pinch en Safari es cancelar sus eventos
 * propios de gesto.
 */
export function PwaMode() {
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
