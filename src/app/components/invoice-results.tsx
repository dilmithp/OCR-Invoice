'use client';

import React from 'react';
import { InvoiceData } from '@/app/lib/types';

interface InvoiceResultsProps {
    data: InvoiceData;
    processingTime?: number;
}

export default function InvoiceResults({ data, processingTime }: InvoiceResultsProps) {
    const getCategoryColor = (category: string | undefined) => {
        const colors = {
            food: 'bg-green-100 text-green-800',
            cleaning: 'bg-blue-100 text-blue-800',
            office: 'bg-purple-100 text-purple-800',
            transportation: 'bg-yellow-100 text-yellow-800',
            healthcare: 'bg-red-100 text-red-800',
            entertainment: 'bg-pink-100 text-pink-800',
            utilities: 'bg-cyan-100 text-cyan-800',
            personal_care: 'bg-indigo-100 text-indigo-800',
            other: 'bg-gray-100 text-gray-800',
        };
        return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
        <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
            {/* Header with AI Enhancement Badge */}
            <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Invoice Processing Results</h2>
                    {data.aiEnhanced && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              🤖 AI Enhanced
            </span>
                    )}
                </div>
                {processingTime && (
                    <p className="text-sm text-gray-500 mt-1">
                        Processed in {processingTime}ms
                    </p>
                )}
            </div>

            {/* Summary Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Supplier</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {data.supplier || 'Not found'}
                            </p>
                            {data.invoiceType && (
                                <p className="text-xs text-gray-500">{data.invoiceType}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {data.date || 'Not found'}
                            </p>
                            {data.paymentTerms && (
                                <p className="text-xs text-gray-500">{data.paymentTerms}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {data.currency && data.total ? `${data.currency} ${data.total}` : data.total || 'Not found'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Invoice #</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {data.invoiceNumber || 'Not found'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Line Items Table */}
            {data.lineItems.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Line Items ({data.lineItems.length})
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    AI Confidence
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {data.lineItems.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="max-w-xs">
                                            <div className="font-medium">
                                                {item.cleanDescription || item.description || (
                                                    <span className="text-gray-400 italic">No description</span>
                                                )}
                                            </div>
                                            {item.cleanDescription && item.description && item.cleanDescription !== item.description && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Original: {item.description}
                                                </div>
                                            )}
                                            {item.subcategory && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {item.subcategory}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.quantity || <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.unitPrice ? `$${item.unitPrice}` : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {item.amount ? `$${item.amount}` : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.category ? (
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                          <span className="mr-1">{getCategoryIcon(item.category)}</span>
                                                {item.category}
                        </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">Uncategorized</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.aiConfidence !== undefined ? (
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                    <div
                                                        className="bg-green-600 h-2 rounded-full"
                                                        style={{ width: `${item.aiConfidence}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs">{item.aiConfidence}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    {/* Enhanced table cell for category with AI indicator */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.category ? (
                                            <div className="flex items-center">
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
        <span className="mr-1">{getCategoryIcon(item.category)}</span>
          {item.category}
          {item.aiCategorized && (
              <span className="ml-1 text-xs">🤖</span>
          )}
      </span>
                                                {item.subcategory && (
                                                    <span className="ml-2 text-xs text-gray-500">
          {item.subcategory}
        </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">Uncategorized</span>
                                        )}
                                    </td>

                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Enhanced Category Summary */}
            {data.lineItems.length > 0 && (
                <div className="mt-8 pt-4 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(
                            data.lineItems.reduce((acc, item) => {
                                const category = item.category || 'other';
                                acc[category] = (acc[category] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>)
                        ).map(([category, count]) => (
                            <div key={category} className="flex items-center">
                                <span className="mr-2">{getCategoryIcon(category)}</span>
                                <span className="text-sm">
                  <span className="font-medium capitalize">{category.replace('_', ' ')}</span>: {count} items
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Confidence Scores */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.confidence && (
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500">Document AI Confidence:</span>
                            <div className="ml-3 flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(data.confidence * 100)}%` }}
                                />
                            </div>
                            <span className="ml-2 text-sm font-semibold text-gray-900">
                {(data.confidence * 100).toFixed(1)}%
              </span>
                        </div>
                    )}

                    {data.lineItems.some(item => item.aiConfidence !== undefined) && (
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500">Avg AI Confidence:</span>
                            <div className="ml-3 flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${data.lineItems.reduce((sum, item) => sum + (item.aiConfidence || 0), 0) / data.lineItems.length}%` }}
                                />
                            </div>
                            <span className="ml-2 text-sm font-semibold text-gray-900">
                {(data.lineItems.reduce((sum, item) => sum + (item.aiConfidence || 0), 0) / data.lineItems.length).toFixed(1)}%
              </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
