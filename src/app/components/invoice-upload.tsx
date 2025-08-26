'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface InvoiceUploadProps {
    onUpload: (file: File) => void;
    isProcessing: boolean;
}

export default function InvoiceUpload({ onUpload, isProcessing }: InvoiceUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setSelectedFile(file);
            onUpload(file);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/pdf': ['.pdf'],
        },
        maxSize: 10 * 1024 * 1024,
        multiple: false,
        disabled: isProcessing,
    });

    return (
        <div className="w-full max-w-lg mx-auto">
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive
                    ? 'border-blue-400 bg-blue-50 scale-105'
                    : 'border-gray-300 hover:border-gray-400'
                }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />

                <div className="mt-4">
                    {isDragActive ? (
                        <p className="text-blue-600 font-medium">Drop the invoice here...</p>
                    ) : (
                        <div>
                            <p className="text-gray-600">
                                Drag & drop an invoice here, or{' '}
                                <span className="text-blue-600 font-semibold hover:text-blue-700">
                  click to browse
                </span>
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Supports JPEG, PNG, and PDF files up to 10MB
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center">
                        <DocumentIcon className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-sm text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        {isProcessing && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-3"></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
