'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface LineItem {
    description: string | null;
    quantity: string | null;
    unitPrice: string | null;
    amount: string | null;
    category?: string;
    rawText?: string;
}

interface InvoiceData {
    supplier: string | null;
    total: string | null;
    date: string | null;
    invoiceNumber: string | null;
    lineItems: LineItem[];
    confidence?: number;
    rawText?: string;
}

interface ProcessingResult {
    success: boolean;
    data?: InvoiceData;
    error?: string;
    processingTime?: number;
}

export default function Home() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ProcessingResult | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (isProcessing) return;
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/process-invoice', {
                method: 'POST',
                body: formData,
            });

            const json: ProcessingResult = await res.json();
            setResult(json);
        } catch (error) {
            setResult({ success: false, error: 'Failed to process invoice. Please try again.' });
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'application/pdf': ['.pdf'],
        },
        multiple: false,
        maxSize: 10 * 1024 * 1024, // 10MB
        disabled: isProcessing,
    });

    const getCategoryColor = (category: string | undefined) => {
        switch (category) {
            case 'food': return 'bg-green-100 text-green-800';
            case 'cleaning': return 'bg-blue-100 text-blue-800';
            case 'office': return 'bg-purple-100 text-purple-800';
            case 'transportation': return 'bg-yellow-100 text-yellow-800';
            case 'healthcare': return 'bg-red-100 text-red-800';
            case 'entertainment': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <main className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-6">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Invoice OCR Platform</h1>
                    <p className="text-lg text-gray-700">
                        Upload handwritten/printed invoices to extract itemized data
                    </p>
                    {/*<p className="text-sm mt-1 text-gray-400">Powered by Google Cloud Document AI</p>*/}
                </div>

                {/* File Upload Dropzone */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors duration-200 
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} 
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p className="text-blue-700 font-semibold">Drop files here ...</p>
                    ) : (
                        <p className="text-gray-600">
                            Drag and drop an invoice or click to select<br/>
                            Supported formats: JPG, PNG, PDF (Max 10MB)
                        </p>
                    )}
                </div>

                {/* Processing Spinner */}
                {isProcessing && (
                    <div className="flex flex-col items-center justify-center mt-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Processing your invoice...</p>
                    </div>
                )}

                {/* Results Section */}
                {result && !isProcessing && (
                    <section className="mt-10 bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
                        {result.success && result.data ? (
                            <>
                                <h2 className="text-2xl font-semibold mb-4">Processing Results</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                    <div>
                                        <h3 className="font-medium text-gray-700">Supplier</h3>
                                        <p className="text-lg font-semibold text-gray-900">{result.data.supplier || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700">Date</h3>
                                        <p className="text-lg font-semibold text-gray-900">{result.data.date || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700">Invoice Number</h3>
                                        <p className="text-lg font-semibold text-gray-900">{result.data.invoiceNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-700">Total</h3>
                                        <p className="text-lg font-semibold text-gray-900">{result.data.total || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Line Items Table */}
                                <h3 className="text-xl font-semibold mb-3">Line Items</h3>

                                <div className="overflow-auto max-h-96 border border-gray-200 rounded">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {result.data.lineItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">{item.description || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.unitPrice || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.amount || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                              {item.category || 'Uncategorized'}
                            </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Categories Summary */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold">Category Distribution</h3>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        {Object.entries(result.data.lineItems.reduce((acc, li) => {
                                            const cat = li.category || 'Uncategorized';
                                            acc[cat] = (acc[cat] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)).map(([cat, count]) => (
                                            <span key={cat} className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(cat)}`}>
                        {cat}: {count}
                      </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Processing Time */}
                                {result.processingTime && (
                                    <div className="mt-4 text-sm text-gray-500">
                                        Processing completed in {result.processingTime}ms
                                    </div>
                                )}

                                {/* Optional Raw Text Debug Section */}
                                {result.data.rawText && (
                                    <details className="mt-6 border rounded p-3 bg-gray-50">
                                        <summary className="cursor-pointer font-semibold">Show Raw Extracted Text</summary>
                                        <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-gray-600">
                      {result.data.rawText}
                    </pre>
                                    </details>
                                )}
                            </>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-red-800 mb-2">Processing Error</h3>
                                <p className="text-red-700">{result.error || 'Unknown error occurred'}</p>
                                <button
                                    onClick={() => setResult(null)}
                                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}
