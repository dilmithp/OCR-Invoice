import { NextRequest, NextResponse } from 'next/server';
import { processInvoiceWithDocumentAI } from '@/app/lib/documentai';
import type { ProcessingResult } from '@/app/lib/types';

export async function POST(request: NextRequest) {
    try {
        const startTime = Date.now();

        const data = await request.formData();
        const file = data.get('file') as File;

        if (!file) {
            return NextResponse.json<ProcessingResult>(
                { success: false, error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json<ProcessingResult>(
                { success: false, error: 'Invalid file type. Please upload JPEG, PNG, or PDF.' },
                { status: 400 }
            );
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json<ProcessingResult>(
                { success: false, error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);

        const invoiceData = await processInvoiceWithDocumentAI(buffer, file.type);
        const processingTime = Date.now() - startTime;

        const result: ProcessingResult = {
            success: true,
            data: invoiceData,
            processingTime,
        };

        console.log(`Successfully processed invoice in ${processingTime}ms`);
        return NextResponse.json(result);

    } catch (error) {
        console.error('Invoice processing error:', error);

        return NextResponse.json<ProcessingResult>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Invoice processing API is running',
        timestamp: new Date().toISOString(),
    });
}
