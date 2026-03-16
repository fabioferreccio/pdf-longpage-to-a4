export interface TextElement {
    x: number;
    y: number;
    w: number;
    text: string;
}

export interface PageData {
    Width: number;
    Height: number;
    Texts: TextElement[];
}

export interface Segment {
    yTop: number;
    yBottom: number;
    hasContent: boolean;
}

export class PdfAnalyzer {
    private readonly unitToPoint = 16;
    private readonly a4HeightPoints = 841.89;
    private readonly a4HeightUnits = this.a4HeightPoints / this.unitToPoint; // ~52.62

    constructor(private pageData: PageData) {}

    /**
     * Group text elements into horizontal lines based on Y coordinate similarity.
     */
    public getLines(): { y: number; texts: TextElement[] }[] {
        const sortedTexts = [...this.pageData.Texts].sort((a, b) => a.y - b.y);
        const lines: { y: number; texts: TextElement[] }[] = [];

        if (sortedTexts.length === 0) return lines;

        let currentLine = { y: (sortedTexts[0] as TextElement).y, texts: [sortedTexts[0] as TextElement] };
        lines.push(currentLine);

        for (let i = 1; i < sortedTexts.length; i++) {
            const text = sortedTexts[i] as TextElement;
            if (Math.abs(text.y - currentLine.y) < 0.2) { // Increased threshold slightly
                currentLine.texts.push(text);
            } else {
                currentLine = { y: text.y, texts: [text] };
                lines.push(currentLine);
            }
        }

        return lines;
    }

    /**
     * Identifies segments of the page to be converted into A4 pages.
     */
    public getSegments(): Segment[] {
        const lines = this.getLines();
        const segments: Segment[] = [];
        const totalHeight = this.pageData.Height;
        
        let currentTop = 0;

        while (currentTop < totalHeight - 1) {
            let nextBoundary = currentTop + this.a4HeightUnits;
            if (nextBoundary > totalHeight) nextBoundary = totalHeight;

            // Find gaps near the boundary
            const lookBehind = 8;
            const lookAhead = 4;
            const potentialLines = lines.filter(l => 
                l.y > nextBoundary - lookBehind && l.y < nextBoundary + lookAhead
            );

            let splitY = nextBoundary;
            let maxGap = 0;

            if (potentialLines.length >= 2) {
                for (let i = 0; i < potentialLines.length - 1; i++) {
                    const l1 = potentialLines[i];
                    const l2 = potentialLines[i + 1];
                    if (!l1 || !l2) continue;

                    const gap = l2.y - l1.y;
                    const midpoint = l1.y + (gap/2);
                    
                    // Prioritize gaps that are closer to the boundary effectively
                    if (gap > maxGap && l1.y < nextBoundary) {
                        maxGap = gap;
                        splitY = midpoint;
                    }
                }
            } else if (potentialLines.length === 1 && potentialLines[0]) {
                splitY = potentialLines[0].y < nextBoundary ? potentialLines[0].y + 0.5 : potentialLines[0].y - 0.5;
            }

            // Ensure we don't exceed A4 height
            if (splitY - currentTop > this.a4HeightUnits) {
                splitY = currentTop + this.a4HeightUnits;
            }

            // Check if this segment has any content
            const segmentHasContent = lines.some(l => l.y >= currentTop && l.y < splitY);

            segments.push({
                yTop: currentTop * this.unitToPoint,
                yBottom: splitY * this.unitToPoint,
                hasContent: segmentHasContent
            });

            currentTop = splitY;
            if (currentTop >= totalHeight) break;
        }

        return segments;
    }
}
