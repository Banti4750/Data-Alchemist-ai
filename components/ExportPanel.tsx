import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle, Loader2 } from 'lucide-react';

interface ExportPanelProps {
    onExport: (files: string[]) => Promise<void>;
    className?: string;
}

interface ExportFile {
    name: string;
    label: string;
    checked: boolean;
}

export const ExportPanel = ({ onExport, className }: ExportPanelProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [files, setFiles] = useState<ExportFile[]>([
        { name: 'clients.csv', label: 'Client Data', checked: true },
        { name: 'workers.csv', label: 'Worker Data', checked: true },
        { name: 'tasks.csv', label: 'Task Data', checked: true },
        { name: 'rules.json', label: 'Allocation Rules', checked: true },
    ]);

    const handleExport = async () => {
        const selectedFiles = files.filter(f => f.checked).map(f => f.name);
        if (selectedFiles.length === 0) return;

        setIsExporting(true);
        try {
            await onExport(selectedFiles);
            setExportSuccess(true);
            setTimeout(() => {
                setIsModalOpen(false);
                setExportSuccess(false);
            }, 2000);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const toggleFile = (index: number) => {
        setFiles(files.map((file, i) => 
            i === index ? { ...file, checked: !file.checked } : file
        ));
    };

    return (
        <div className={className}>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
                <Download className="w-5 h-5" />
                Export Cleaned Data
            </motion.button>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4"
                        >
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Export Data</h3>
                                    <button
                                        onClick={() => !isExporting && setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 text-sm">
                                    Select the files you want to export:
                                </p>

                                <div className="space-y-3">
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={file.name}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={file.checked}
                                                    onChange={() => toggleFile(index)}
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    disabled={isExporting}
                                                />
                                                <div>
                                                    <div className="font-medium">{file.label}</div>
                                                    <div className="text-sm text-gray-500">{file.name}</div>
                                                </div>
                                            </label>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleExport}
                                    disabled={isExporting || files.every(f => !f.checked)}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Exporting...
                                        </>
                                    ) : exportSuccess ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Export Complete!
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Export Selected Files
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};