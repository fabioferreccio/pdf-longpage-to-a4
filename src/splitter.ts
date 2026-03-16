import { PDFDocument, PageSizes } from 'pdf-lib';
import type { Segment } from './analyzer';

export class PdfSplitter {
    private readonly margin = 30; // 30 points margin

    constructor(private srcDoc: PDFDocument) {}

    /**
     * Splits the source document into A4 pages with margins.
     * segmentsMap: key is page index, value is array of Segment.
     */
    public async split(segmentsMap: Map<number, Segment[]>): Promise<PDFDocument> {
        const outDoc = await PDFDocument.create();
        const srcPages = this.srcDoc.getPages();

        for (let i = 0; i < srcPages.length; i++) {
            const page = srcPages[i];
            if (!page) continue;
            const { width: srcWidth, height: srcHeight } = page.getSize();
            const segments = segmentsMap.get(i) || [];

            for (const segment of segments) {
                if (!segment.hasContent) continue;

                const segmentHeight = segment.yBottom - segment.yTop;
                if (segmentHeight <= 0) continue;

                // Create a standard A4 page
                const newPage = outDoc.addPage(PageSizes.A4);
                const { width: a4Width, height: a4Height } = newPage.getSize();

                // Embed the source page as an XObject
                const embeddedPage = await outDoc.embedPage(page, {
                    left: 0,
                    right: srcWidth,
                    bottom: srcHeight - segment.yBottom,
                    top: srcHeight - segment.yTop,
                });

                // Calculate scale to fit within margins
                const availableWidth = a4Width - (2 * this.margin);
                const availableHeight = a4Height - (2 * this.margin);
                
                const scaleX = availableWidth / srcWidth;
                const scaleY = availableHeight / segmentHeight;
                const scale = Math.min(scaleX, scaleY, 1); // Don't upscale, just downscale if needed

                // Center the segment on the A4 page
                const drawWidth = srcWidth * scale;
                const drawHeight = segmentHeight * scale;
                
                const x = (a4Width - drawWidth) / 2;
                const y = (a4Height - drawHeight) / 2;

                newPage.drawPage(embeddedPage, {
                    x,
                    y,
                    width: drawWidth,
                    height: drawHeight,
                });
            }
        }

        return outDoc;
    }
}
