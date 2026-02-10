/**
 * Triggers a browser file download with the given text content.
 *
 * @param content  - The text content to download.
 * @param filename - The suggested filename for the download.
 * @param mimeType - The MIME type of the blob (defaults to "text/plain").
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain",
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
