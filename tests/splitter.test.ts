import { PDFDocument, PageSizes } from 'pdf-lib';
import { PdfSplitter } from '../src/splitter';
import type { Segment } from '../src/analyzer';

describe('PdfSplitter', () => {
    it('should split a document into A4 pages with content centered', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([600, 2000]); // Tall page
        
        const splitter = new PdfSplitter(doc);
        const segmentsMap = new Map<number, Segment[]>();
        segmentsMap.set(0, [
            { yTop: 0, yBottom: 800, hasContent: true },
            { yTop: 800, yBottom: 1600, hasContent: true },
            { yTop: 1600, yBottom: 2000, hasContent: false }, // Should skip
        ]);

        const outDoc = await splitter.split(segmentsMap);
        const outPages = outDoc.getPages();

        expect(outPages.length).toBe(2);
        
        // Target is A4
        const a4 = PageSizes.A4;
        expect(outPages[0]?.getSize().width).toBeCloseTo(a4[0]);
        expect(outPages[0]?.getSize().height).toBeCloseTo(a4[1]);
        expect(outPages[1]?.getSize().width).toBeCloseTo(a4[0]);
        expect(outPages[1]?.getSize().height).toBeCloseTo(a4[1]);
    });
});
