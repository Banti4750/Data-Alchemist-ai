import { useCallback, useState } from 'react';
import { parseCSV, parseExcel } from '@/lib/utils/parsers';
import { EntityType } from '@/lib/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
    onDataParsed: (data: any[], entityType: EntityType) => void;
    entityType: EntityType;
    title?: string;
    className?: string;
}

type FileStatus = 'idle' | 'processing' | 'success' | 'error';

export const FileUpload = ({ onDataParsed, entityType, title, className }: FileUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileStatus, setFileStatus] = useState<FileStatus>('idle');
    const [fileName, setFileName] = useState<string>('');

    const handleFile = async (file: File) => {
        setFileName(file.name);
        setFileStatus('processing');
        try {
            let parsedData;
            if (file.name.endsWith('.csv')) {
                parsedData = await parseCSV(file);
            } else if (file.name.endsWith('.xlsx')) {
                parsedData = await parseExcel(file);
            } else {
                throw new Error('Unsupported file format');
            }
            onDataParsed(parsedData, entityType);
            setFileStatus('success');
        } catch (error) {
            console.error('Error parsing file:', error);
            setFileStatus('error');
        }
    };

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };

    const getStatusIcon = () => {
        switch (fileStatus) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-6 h-6 text-red-500" />;
            case 'processing':
                return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
            default:
                return <Upload className="w-8 h-8 text-gray-500" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`space-y-2 ${className}`}
        >
            {title && (
                <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium text-lg mb-2"
                >
                    {title}
                </motion.h3>
            )}
            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                }`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
            >
                <input
                    type="file"
                    id={`file-upload-${entityType}`}
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={onChange}
                />
                <label
                    htmlFor={`file-upload-${entityType}`}
                    className="cursor-pointer block"
                >
                    <motion.div
                        className="flex flex-col items-center justify-center gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {getStatusIcon()}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                                {isDragging
                                    ? '✨ Drop your file here'
                                    : fileName || 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Supports: CSV, XLSX
                            </p>
                        </div>
                        {fileStatus === 'error' && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-500"
                            >
                                Error processing file. Please try again.
                            </motion.p>
                        )}
                    </motion.div>
                </label>
            </motion.div>
        </motion.div>
    );
};