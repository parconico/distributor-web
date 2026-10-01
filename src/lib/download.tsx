import apiClient from "./api-client";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Baja un archivo de la API y lo entrega al navegador.
 *
 * Usa un link con `download` en vez de window.open: dentro de la app instalada
 * no hay pestaña que abrir, asi que abrir una URL de blob no hacia nada.
 */
export async function downloadFile(url: string, filename: string) {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" });
  guardarBlob(response.data, filename);
}

function guardarBlob(blob: Blob, filename: string) {
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Igual que downloadFile pero avisando si falla. Los botones de PDF no tenian
 * manejo de error: si la descarga fallaba, no pasaba nada visible.
 */
export async function descargarPdf(url: string, filename: string) {
  let pdf: File;
  try {
    const response = await apiClient.get<Blob>(url, { responseType: "blob" });
    pdf = new File([response.data], filename, { type: "application/pdf" });
  } catch {
    toast({
      title: "Error",
      description: "No se pudo descargar el PDF",
      variant: "destructive",
    });
    return;
  }

  if (!puedeCompartir(pdf)) {
    guardarBlob(pdf, filename);
    return;
  }

  try {
    await compartir(pdf);
  } catch (error) {
    const nombre = (error as DOMException)?.name;
    // Cerro el menu de compartir sin elegir nada.
    if (nombre === "AbortError") return;
    // Safari solo deja abrir el menu inmediatamente despues de un toque, y
    // bajar el PDF puede tardar mas que eso. El archivo ya esta listo, asi que
    // un segundo toque lo comparte al instante.
    if (nombre === "NotAllowedError") {
      toast({
        title: "PDF listo",
        description: filename,
        // Mas que el aviso comun: hay que verlo y tocar Compartir.
        duration: 15000,
        action: (
          <ToastAction
            altText="Compartir el PDF"
            onClick={() => {
              compartir(pdf).catch(() => guardarBlob(pdf, filename));
            }}
          >
            Compartir
          </ToastAction>
        ),
      });
      return;
    }
    guardarBlob(pdf, filename);
  }
}

/**
 * En celulares y tablets el PDF se comparte como archivo con el menu del
 * sistema, que tambien ofrece imprimirlo y guardarlo. Con el link de descarga,
 * al compartirlo desde el visor se mandaba ademas la direccion "blob:" interna
 * del navegador, que no le sirve a nadie. En la computadora se sigue bajando.
 */
function puedeCompartir(archivo: File): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  const pantallaTactil = window.matchMedia("(pointer: coarse)").matches;
  return pantallaTactil && navigator.canShare({ files: [archivo] });
}

function compartir(archivo: File) {
  return navigator.share({ files: [archivo], title: archivo.name });
}
