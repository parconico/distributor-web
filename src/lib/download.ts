export async function downloadFile(url: string, filename: string) {
  const response = await fetch(`http://localhost:3001${url}`, {
    credentials: 'include',
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
