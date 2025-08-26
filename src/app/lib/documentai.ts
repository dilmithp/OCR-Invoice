import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { InvoiceData, LineItem } from './types';

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

        // Extract all text for debugging
        console.log('Full document text:', document.text?.substring(0, 500));

        // Extract entities with more details
        const entities = document.entities || [];
        console.log('Found entities:', entities.map(e => ({ type: e.type, text: e.mentionText })));

        const invoiceData: InvoiceData = {
            supplier: extractEntity(entities, 'supplier_name'),
            total: extractEntity(entities, 'total_amount'),
            date: extractEntity(entities, 'invoice_date'),
            invoiceNumber: extractEntity(entities, 'invoice_id'),
            lineItems: extractDetailedLineItems(entities, document.text || ''),
            confidence: document.pages?.[0]?.pageAnchor?.confidence || 0,
            rawText: document.text, // Add raw text for debugging
        };

        console.log('Extracted invoice data:', JSON.stringify(invoiceData, null, 2));
        return invoiceData;
    } catch (error) {
        console.error('Document AI processing error:', error);
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

    console.log(`Found ${lineItemEntities.length} line items`);

    const lineItems = lineItemEntities.map((item: any, index: number): LineItem => {
        console.log(`Processing line item ${index + 1}:`, item);

        const properties = item.properties || [];
        const lineItem: LineItem = {
            description: findPropertyValue(properties, 'line_item/description'),
            quantity: findPropertyValue(properties, 'line_item/quantity'),
            unitPrice: findPropertyValue(properties, 'line_item/unit_price'),
            amount: findPropertyValue(properties, 'line_item/amount'),

            // Additional fields that might be available
            productCode: findPropertyValue(properties, 'line_item/product_code'),

            // Get the full text of the line item if individual properties aren't available
            rawText: item.mentionText || extractTextFromTextAnchor(item.textAnchor, documentText),
        };

        // If we don't have structured data, try to parse from raw text
        if (!lineItem.description && lineItem.rawText) {
            const parsed = parseLineItemFromText(lineItem.rawText);
            Object.assign(lineItem, parsed);
        }

        // Add intelligent categorization
        lineItem.category = categorizeItem(lineItem.description || lineItem.rawText || '');

        console.log(`Extracted line item ${index + 1}:`, lineItem);
        return lineItem;
    }).filter(item => item.description || item.rawText);

    return lineItems;
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

function parseLineItemFromText(text: string): Partial<LineItem> {
    // Try to extract structured data from unstructured text
    // This is a basic parser - you can enhance it based on your invoice formats

    const result: Partial<LineItem> = {};

    // Look for quantity patterns (number at start or after description)
    const qtyMatch = text.match(/^\s*(\d+(?:\.\d+)?)\s+(.+)/);
    if (qtyMatch) {
        result.quantity = qtyMatch[1];
        text = qtyMatch[2]; // Remove quantity from text
    }

    // Look for price patterns ($ followed by number, usually at the end)
    const priceMatch = text.match(/\$?(\d+(?:[.,]\d{2})?)\s*$/);
    if (priceMatch) {
        result.amount = priceMatch[1];
        text = text.replace(priceMatch[0], '').trim(); // Remove price from text
    }

    // Look for unit price (smaller number before the total)
    const unitPriceMatch = text.match(/\$?(\d+(?:[.,]\d{2})?)\s*\$?(\d+(?:[.,]\d{2})?)\s*$/);
    if (unitPriceMatch) {
        result.unitPrice = unitPriceMatch[1];
        result.amount = unitPriceMatch[2];
        text = text.replace(unitPriceMatch[0], '').trim();
    }

    // Whatever remains is likely the description
    if (text) {
        result.description = text;
    }

    return result;
}

function categorizeItem(description: string): string {
    if (!description) return 'other';

    const desc = description.toLowerCase();

    // Food & Groceries
    if (desc.match(/\b(food|bread|milk|egg|chicken|beef|rice|pasta|fruit|vegetable|grocery|meal|lunch|dinner|breakfast|coffee|tea|juice|water|soda|snack|candy)\b/)) {
        return 'food';
    }

    // Cleaning Supplies
    if (desc.match(/\b(clean|detergent|soap|bleach|disinfect|sanitiz|paper\s*towel|toilet\s*paper|tissue|sponge|mop|vacuum|brush|wipe)\b/)) {
        return 'cleaning';
    }

    // Office Supplies
    if (desc.match(/\b(pen|pencil|paper|notebook|stapler|clip|folder|binder|printer|ink|toner|computer|desk|chair|office)\b/)) {
        return 'office';
    }

    // Transportation
    if (desc.match(/\b(gas|fuel|car|vehicle|transport|taxi|uber|bus|train|parking|toll|repair|maintenance|oil|tire)\b/)) {
        return 'transportation';
    }

    // Healthcare
    if (desc.match(/\b(medical|medicine|doctor|hospital|pharmacy|pill|tablet|health|dental|vision|insurance|treatment)\b/)) {
        return 'healthcare';
    }

    // Entertainment
    if (desc.match(/\b(movie|theater|game|sport|entertainment|music|book|magazine|streaming|netflix|spotify)\b/)) {
        return 'entertainment';
    }

    return 'other';
}
