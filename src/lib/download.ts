import apiClient from "./api-client";
import { toast } from "@/hooks/use-toast";

/**
 * Baja un archivo de la API y lo entrega al navegador.
 *
 * Usa un link con `download` en vez de window.open: dentro de la app instalada
 * no hay pestaña que abrir, asi que abrir una URL de blob no hacia nada.
 */
export async function downloadFile(url: string, filename: string) {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" });
  const downloadUrl = window.URL.createObjectURL(response.data);
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
  try {
    await downloadFile(url, filename);
  } catch {
    toast({
      title: "Error",
      description: "No se pudo descargar el PDF",
      variant: "destructive",
    });
  }
}
