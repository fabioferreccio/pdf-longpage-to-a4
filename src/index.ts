import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
const PDFParser = require('pdf2json');
import { PdfAnalyzer } from './analyzer';
import type { PageData, Segment } from './analyzer';
import { PdfSplitter } from './splitter';

async function parsePdfData(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => resolve(pdfData));
        pdfParser.loadPDF(filePath);
    });
}

async function main() {
    const inputPath = process.argv[2] || 'input.pdf';
    const outputPath = process.argv[3] || 'output.pdf';

    if (!fs.existsSync(inputPath)) {
        console.error(`Input file not found: ${inputPath}`);
        process.exit(1);
    }

    console.log(`Analyzing ${inputPath}...`);
    
    try {
        // 1. Extract structural data
        const rawData = await parsePdfData(inputPath);
        
        // 2. Load PDF with pdf-lib
        const existingPdfBytes = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        
        const segmentsMap = new Map<number, Segment[]>();
        
        // 3. Analyze each page
        rawData.Pages.forEach((pageData: any, index: number) => {
            const texts = pageData.Texts.map((t: any) => {
                let decodedText = '';
                try {
                    decodedText = t.R && t.R[0] ? decodeURIComponent(t.R[0].T) : '';
                } catch (e) {
                    decodedText = t.R && t.R[0] ? t.R[0].T : '';
                }
                return {
                    x: t.x,
                    y: t.y,
                    w: t.w,
                    text: decodedText
                };
            });
            
            const analyzer = new PdfAnalyzer({
                Width: pageData.Width,
                Height: pageData.Height,
                Texts: texts
            });
            
            const segments = analyzer.getSegments();
            const contentSegments = segments.filter(s => s.hasContent);
            segmentsMap.set(index, segments);
            console.log(`Page ${index + 1}: Found ${segments.length} segments (${contentSegments.length} with content).`);
        });

        // 4. Split and Generate
        console.log('Generating A4 formatted PDF with margins and blank page removal...');
        const splitter = new PdfSplitter(pdfDoc);
        const outputDoc = await splitter.split(segmentsMap);
        
        const outputPdfBytes = await outputDoc.save();
        fs.writeFileSync(outputPath, outputPdfBytes);
        
        console.log(`Successfully generated ${outputPath}`);
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

main();
