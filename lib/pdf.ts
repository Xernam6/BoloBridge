/**
 * Client-side PDF text extraction using pdf.js (pdfjs-dist).
 * Extracts all text content from a PDF file for the Reader game.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set up the pdf.js worker from CDN to avoid bundling issues
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Extract all text from a PDF File object.
 * Returns a single string with newlines between pages.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item) => 'str' in item && typeof (item as Record<string, unknown>).str === 'string')
      .map((item) => (item as unknown as { str: string }).str)
      .join(' ');
    if (pageText.trim()) {
      pages.push(pageText.trim());
    }
  }

  return pages.join('\n\n');
}
