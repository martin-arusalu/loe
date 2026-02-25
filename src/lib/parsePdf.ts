/**
 * Parses a PDF file (ArrayBuffer) and returns extracted plain text.
 * Uses PDF.js (pdfjs-dist) in the browser.
 */
export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Use the CDN worker to avoid bundler complications
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n");
}
