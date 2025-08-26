export interface LineItem {
    description: string | null;
    quantity: string | null;
    unitPrice: string | null;
    amount: string | null;
    productCode?: string | null;
    category?: string;
    subcategory?: string;
    rawText?: string; // For debugging and fallback
}

export interface InvoiceData {
    supplier: string | null;
    total: string | null;
    date: string | null;
    invoiceNumber: string | null;
    lineItems: LineItem[];
    confidence?: number;
    rawText?: string; // For debugging
}

export interface ProcessingResult {
    success: boolean;
    data?: InvoiceData;
    error?: string;
    processingTime?: number;
}
