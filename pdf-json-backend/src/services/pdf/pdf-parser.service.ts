import { createRequire } from 'module';
const esmRequire = createRequire(import.meta.url);
const pdfjs = esmRequire('pdfjs-dist/legacy/build/pdf.js');

export interface ParsedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
  items: ParsedTextItem[];
}

export interface ParsedPdf {
  pageCount: number;
  metadata: Record<string, any>;
  pages: ParsedPage[];
  fullText: string;
  isScannedSuspected: boolean;
}

export class PdfParserService {
  async parseBuffer(buffer: Buffer): Promise<ParsedPdf> {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const doc = await loadingTask.promise;
    const pageCount = doc.numPages;

    let metadata: Record<string, any> = {};
    try {
      const metaDataObj = await doc.getMetadata();
      metadata = metaDataObj?.info || {};
    } catch (e) {
      // metadata optional
    }

    const pages: ParsedPage[] = [];
    let fullText = '';
    let totalChars = 0;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      const items: ParsedTextItem[] = [];
      const lineMap = new Map<number, string[]>();

      for (const item of textContent.items) {
        if ('str' in item) {
          const x = item.transform[4];
          const y = item.transform[5];
          const width = item.width || 0;
          const height = item.height || 0;

          items.push({
            str: item.str,
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            width: Math.round(width * 100) / 100,
            height: Math.round(height * 100) / 100,
          });

          // Group by approximate line (y position bucketed to 3px)
          const bucketY = Math.round(y / 4) * 4;
          if (!lineMap.has(bucketY)) {
            lineMap.set(bucketY, []);
          }
          if (item.str.trim()) {
            lineMap.get(bucketY)!.push(item.str);
          }
        }
      }

      // Sort lines from top to bottom (higher Y in PDF coordinate space is higher up)
      const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
      const pageLines = sortedYs.map((y) => (lineMap.get(y) || []).join(' ')).filter(Boolean);
      const pageText = pageLines.join('\n');

      totalChars += pageText.trim().length;
      fullText += (pageNum > 1 ? '\n\n' : '') + `--- Page ${pageNum} ---\n` + pageText;

      pages.push({
        pageNumber: pageNum,
        text: pageText,
        items,
      });
    }

    // If an average page has less than 30 characters, suspect it might be scanned / image-based
    const avgCharsPerPage = totalChars / (pageCount || 1);
    const isScannedSuspected = avgCharsPerPage < 30;

    return {
      pageCount,
      metadata,
      pages,
      fullText,
      isScannedSuspected,
    };
  }
}

export const pdfParserService = new PdfParserService();
