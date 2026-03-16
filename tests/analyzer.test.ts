import { PdfAnalyzer } from '../src/analyzer';
import type { PageData } from '../src/analyzer';

describe('PdfAnalyzer', () => {
    const mockPage: PageData = {
        Width: 37.24,
        Height: 120, // Enough for 2+ A4 pages
        Texts: [
            { x: 2, y: 5, w: 10, text: 'Title' },
            { x: 2, y: 10, w: 10, text: 'Subtitle' },
            { x: 2, y: 51, w: 10, text: 'Near end of first page' },
            { x: 2, y: 54, w: 10, text: 'Start of second page' },
            { x: 2, y: 100, w: 10, text: 'Near end of second page' },
            { x: 2, y: 108, w: 10, text: 'Start of third page' },
        ]
    };

    it('should group texts into lines', () => {
        const analyzer = new PdfAnalyzer(mockPage);
        const lines = analyzer.getLines();
        expect(lines.length).toBe(6);
        expect(lines[0]?.texts[0]?.text).toBe('Title');
    });

    it('should find segments near A4 boundaries', () => {
        const analyzer = new PdfAnalyzer(mockPage);
        const segments = analyzer.getSegments();
        
        // A4 boundary is ~52.6.
        // First segment should end around 52.5
        expect(segments[0]?.yBottom).toBeCloseTo(52.5 * 16);
        expect(segments[0]?.hasContent).toBe(true);

        // Second segment should start from where first ended and end around 104 * 16
        expect(segments[1]?.yTop).toBeCloseTo(52.5 * 16);
        expect(segments[1]?.yBottom).toBeCloseTo(104 * 16);
        expect(segments[1]?.hasContent).toBe(true);

        // Third segment might be blank if we added one (but our mock has content at 108)
        expect(segments[2]?.hasContent).toBe(true);
    });

    it('should identify blank segments correctly', () => {
        const pageWithGap: PageData = {
            Width: 37.24,
            Height: 200,
            Texts: [
                { x: 2, y: 5, w: 10, text: 'Start' },
                { x: 2, y: 180, w: 10, text: 'End' },
            ]
        };
        const analyzer = new PdfAnalyzer(pageWithGap);
        const segments = analyzer.getSegments();
        
        // Segment 1 (0 to ~52.6): has content
        expect(segments[0]?.hasContent).toBe(true);
        // Segment 2 (~52.6 to ~105.2): blank
        expect(segments[1]?.hasContent).toBe(false);
    });
});
