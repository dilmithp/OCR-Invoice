'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface LineItem {
    description: string | null;
    quantity: string | null;
    unitPrice: string | null;
    amount: string | null;
    category?: string;
    subcategory?: string;
    cleanDescription?: string;
    aiConfidence?: number;
    aiCategorized?: boolean;
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
    currency?: string;
    aiEnhanced?: boolean;
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
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null);
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

            if (!res.ok || !json.success) {
                setError(json.error || 'Failed to process invoice.');
            } else {
                setResult(json);
            }
        } catch (e) {
            setError('Network error: Could not process the invoice.');
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
        maxSize: 10485760, // 10MB
        disabled: isProcessing,
    });

    const getCategoryColor = (category: string | undefined) => {
        const colors = {
            food: 'bg-green-100 text-green-800 border-green-200',
            cleaning: 'bg-blue-100 text-blue-800 border-blue-200',
            office: 'bg-purple-100 text-purple-800 border-purple-200',
            transportation: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            healthcare: 'bg-red-100 text-red-800 border-red-200',
            entertainment: 'bg-pink-100 text-pink-800 border-pink-200',
            utilities: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            personal_care: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            other: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getCategoryIcon = (category: string | undefined) => {
        const icons = {
            food: '🍎',
            cleaning: '🧽',
            office: '📎',
            transportation: '🚗',
            healthcare: '⚕️',
            entertainment: '🎬',
            utilities: '💡',
            personal_care: '🧴',
            other: '📦',
        };
        return icons[category as keyof typeof icons] || '📦';
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <header className="text-center mb-12">
                    <div className="mb-6">
                        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                            Invoice OCR Platform
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Transform handwritten and printed invoices into structured data with AI-powered categorization
                        </p>
                    </div>
                    <div className="flex justify-center space-x-8 text-sm text-gray-500">
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Google Cloud Document AI
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            OpenAI GPT-4 Categorization
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            Real-time Processing
                        </div>
                    </div>
                </header>

                {/* Upload Area */}
                <section className="mb-12">
                    <div
                        {...getRootProps()}
                        className={`
              relative border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer 
              transition-all duration-300 transform
              ${isDragActive
                            ? 'border-blue-400 bg-blue-50 scale-105 shadow-lg'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                        }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        <input {...getInputProps()} />

                        {isDragActive ? (
                            <div className="animate-pulse">
                                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-semibold text-blue-600">Drop your invoice here!</p>
                            </div>
                        ) : (
                            <div>
                                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                                    Upload Your Invoice
                                </h3>
                                <p className="text-lg text-gray-500 mb-4">
                                    Drag and drop your files here, or{' '}
                                    <span className="text-blue-600 font-semibold">click to browse</span>
                                </p>
                                <div className="flex justify-center space-x-6 text-sm text-gray-400">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    JPEG, PNG, PDF
                  </span>
                                    <span className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                    Max 10MB
                  </span>
                                    <span className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                    Handwritten Support
                  </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-6 max-w-2xl mx-auto">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h4 className="text-red-800 font-medium">Processing Error</h4>
                                        <p className="text-red-700 text-sm mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Loading State */}
                {isProcessing && (
                    <div className="mb-12">
                        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-500 mx-auto mb-4"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Processing Your Invoice
                            </h3>
                            <p className="text-gray-500">
                                Extracting data and categorizing items...
                            </p>
                            <div className="mt-4 flex justify-center space-x-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && result.success && result.data && !isProcessing && (
                    <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Results Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        Invoice Analysis Complete
                                    </h2>
                                    {result.processingTime && (
                                        <p className="text-blue-100">
                                            Processed in {result.processingTime}ms
                                        </p>
                                    )}
                                </div>
                                {result.data.aiEnhanced && (
                                    <div className="bg-white bg-opacity-20 rounded-full px-4 py-2">
                                        <span className="text-white font-medium">🤖 AI Enhanced</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-blue-600 font-semibold text-sm uppercase tracking-wide">Supplier</h4>
                                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800 truncate">
                                        {result.data.supplier || 'N/A'}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-green-600 font-semibold text-sm uppercase tracking-wide">Date</h4>
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {result.data.date || 'N/A'}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-purple-600 font-semibold text-sm uppercase tracking-wide">Invoice #</h4>
                                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {result.data.invoiceNumber || 'N/A'}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-yellow-600 font-semibold text-sm uppercase tracking-wide">Total Amount</h4>
                                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {result.data.currency && result.data.total
                                            ? `${result.data.currency} ${result.data.total}`
                                            : result.data.total || 'N/A'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Line Items */}
                            <section className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Line Items ({result.data.lineItems.length})
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                        Scroll horizontally to see all columns →
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl overflow-hidden border">
                                    <div className="overflow-x-auto max-h-96">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Qty
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Unit Price
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    AI Confidence
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                            {result.data.lineItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {item.cleanDescription || item.description || 'N/A'}
                                                            </p>
                                                            {item.subcategory && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {item.subcategory}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {item.quantity || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {item.unitPrice ? `${item.unitPrice}` : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                        {item.amount ? `${item.amount}` : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.category ? (
                                                            <div className="flex items-center">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                                    <span className="mr-1">{getCategoryIcon(item.category)}</span>
                                      {item.category.replace('_', ' ')}
                                      {item.aiCategorized && (
                                          <span className="ml-1">🤖</span>
                                      )}
                                  </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">Uncategorized</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.aiConfidence !== undefined ? (
                                                            <div className="flex items-center">
                                                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-16">
                                                                    <div
                                                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                                        style={{ width: `${item.aiConfidence}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-600">
                                    {item.aiConfidence}%
                                  </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>

                            {/* Category Summary */}
                            <section className="mb-8">
                                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                                    Category Distribution
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(
                                        result.data.lineItems.reduce((acc, item) => {
                                            const category = item.category || 'other';
                                            acc[category] = (acc[category] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)
                                    ).map(([category, count]) => (
                                        <div
                                            key={category}
                                            className={`flex items-center px-4 py-2 rounded-full border ${getCategoryColor(category)}`}
                                        >
                                            <span className="mr-2">{getCategoryIcon(category)}</span>
                                            <span className="font-medium capitalize">
                        {category.replace('_', ' ')}: {count}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Debug Section */}
                            {result.data.rawText && (
                                <details className="border border-gray-200 rounded-lg">
                                    <summary className="cursor-pointer p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg">
                    <span className="font-semibold text-gray-700">
                      🔍 Show Raw Extracted Text (Debug)
                    </span>
                                    </summary>
                                    <div className="p-4 bg-gray-800 text-green-400 text-sm font-mono rounded-b-lg">
                    <pre className="whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {result.data.rawText}
                    </pre>
                                    </div>
                                </details>
                            )}
                        </div>
                    </article>
                )}

                {/* Footer */}
                <footer className="mt-16 text-center text-gray-500 text-sm">
                    <p>
                        System By SynthiaSync
                    </p>
                </footer>
            </div>
        </main>
    );
}
