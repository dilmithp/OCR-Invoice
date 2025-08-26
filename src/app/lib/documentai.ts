import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { InvoiceData, LineItem } from './types';
import { enhanceLineItemsWithAI, enhanceInvoiceDataWithAI } from './openai';

const client = new DocumentProcessorServiceClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
const location = process.env.GOOGLE_CLOUD_LOCATION!;
const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID!;

const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

export async function processInvoiceWithDocumentAI(
    fileBuffer: Buffer,
    mimeType: string
): Promise<InvoiceData> {
    try {
        const encodedFile = fileBuffer.toString('base64');

        const request = {
            name: processorName,
            rawDocument: {
                content: encodedFile,
                mimeType,
            },
        };

        console.log('Processing document with Document AI...');
        const [result] = await client.processDocument(request);
        const { document } = result;

        if (!document) {
            throw new Error('No document returned from Document AI');
        }

        const entities = document.entities || [];
        const documentText = document.text || '';

        console.log('Document AI extracted entities:', entities.length);

        // Initial extraction with Document AI
        let invoiceData: InvoiceData = {
            supplier: extractEntity(entities, 'supplier_name'),
            total: extractEntity(entities, 'total_amount'),
            date: extractEntity(entities, 'invoice_date'),
            invoiceNumber: extractEntity(entities, 'invoice_id'),
            lineItems: extractDetailedLineItems(entities, documentText),
            confidence: document.pages?.[0]?.pageAnchor?.confidence || 0,
            rawText: documentText,
        };

        console.log(`Extracted ${invoiceData.lineItems.length} line items from Document AI`);

        // Enhance with OpenAI if API key is available
        if (process.env.OPENAI_API_KEY) {
            console.log('Enhancing with OpenAI...');

            // Enhance line items with AI categorization
            invoiceData.lineItems = await enhanceLineItemsWithAI(invoiceData.lineItems);

            // Enhance overall invoice data
            invoiceData = await enhanceInvoiceDataWithAI(documentText, invoiceData);

            console.log('OpenAI enhancement completed');
        } else {
            console.log('OpenAI API key not found, skipping AI enhancement');
        }

        return invoiceData;
    } catch (error) {
        console.error('Document processing error:', error);
        throw new Error(`Failed to process document: ${error}`);
    }
}

function extractEntity(entities: any[] = [], entityType: string): string | null {
    const entity = entities.find((e: any) => e.type === entityType);
    if (!entity) return null;

    return entity.normalizedValue?.text || entity.mentionText || null;
}

function extractDetailedLineItems(entities: any[], documentText: string): LineItem[] {
    const lineItemEntities = entities.filter((e: any) => e.type === 'line_item');

    return lineItemEntities.map((item: any): LineItem => {
        const properties = item.properties || [];

        return {
            description: findPropertyValue(properties, 'line_item/description'),
            quantity: findPropertyValue(properties, 'line_item/quantity'),
            unitPrice: findPropertyValue(properties, 'line_item/unit_price'),
            amount: findPropertyValue(properties, 'line_item/amount'),
            productCode: findPropertyValue(properties, 'line_item/product_code'),
            rawText: item.mentionText || extractTextFromTextAnchor(item.textAnchor, documentText),
        };
    }).filter(item => item.description || item.rawText);
}

function findPropertyValue(properties: any[], propertyType: string): string | null {
    const prop = properties.find((p: any) => p.type === propertyType);
    return prop ? (prop.normalizedValue?.text || prop.mentionText) : null;
}

function extractTextFromTextAnchor(textAnchor: any, documentText: string): string {
    if (!textAnchor || !textAnchor.textSegments || !documentText) return '';

    try {
        const segments = textAnchor.textSegments;
        let extractedText = '';

        for (const segment of segments) {
            const startIndex = parseInt(segment.startIndex || '0');
            const endIndex = parseInt(segment.endIndex || documentText.length.toString());
            extractedText += documentText.substring(startIndex, endIndex);
        }

        return extractedText.trim();
    } catch (error) {
        console.error('Error extracting text from anchor:', error);
        return '';
    }
}
