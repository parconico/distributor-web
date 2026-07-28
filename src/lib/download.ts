import apiClient from "./api-client";

export async function downloadFile(url: string, filename: string) {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" });
  const downloadUrl = window.URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
