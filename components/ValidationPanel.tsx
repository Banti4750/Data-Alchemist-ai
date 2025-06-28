import { useMemo, useState } from 'react';
//@ts-ignore
import { ValidationResult } from '@/lib/types/validators';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Wand2, ChevronDown, ChevronUp } from 'lucide-react';

interface ValidationPanelProps {
    errors: Record<string, string[]>;
    onFixSuggestion: (entityId: string, fix: string) => void;
    className?: string;
}

export const ValidationPanel = ({ errors, onFixSuggestion, className }: ValidationPanelProps) => {
    const errorCount = useMemo(() => Object.keys(errors).length, [errors]);
    const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

    const getFixSuggestions = (entityId: string, error: string): string[] => {
        // Return the error message itself as the suggestion
        // The AI will analyze this error and generate a fix
        return [error];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-sm border ${className}`}
        >
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Validation Results</h3>
                    <div className="flex items-center gap-2">
                        {errorCount === 0 ? (
                            <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                Valid
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-5 h-5" />
                                {errorCount} {errorCount === 1 ? 'issue' : 'issues'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {errorCount === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4"
                        >
                            <CheckCircle className="w-8 h-8" />
                        </motion.div>
                        <h4 className="text-lg font-medium text-green-600 mb-2">
                            All data is valid!
                        </h4>
                        <p className="text-gray-500">
                            Your configuration is ready to be exported.
                        </p>
                    </motion.div>
                ) : (
                    <div className="divide-y">
                        {Object.entries(errors).map(([entityId, entityErrors]) => (
                            <motion.div
                                key={entityId}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-4"
                            >
                                <button
                                    onClick={() => setExpandedEntity(expandedEntity === entityId ? null : entityId)}
                                    className="w-full flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <span className="font-medium">{entityId}</span>
                                        <span className="text-sm text-gray-500">
                                            {entityErrors.length} {entityErrors.length === 1 ? 'error' : 'errors'}
                                        </span>
                                    </div>
                                    {expandedEntity === entityId ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {expandedEntity === entityId && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <ul className="mt-4 space-y-3">
                                                {entityErrors.map((error, i) => (
                                                    <motion.li
                                                        key={i}
                                                        initial={{ x: -20, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="flex items-start gap-2 text-sm text-gray-700"
                                                    >
                                                        <span className="mt-1">
                                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                                        </span>
                                                        <div className="flex-1">
                                                            <p>{error}</p>
                                                            {getFixSuggestions(entityId, error).length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {getFixSuggestions(entityId, error).map((fix, j) => (
                                                                        <motion.button
                                                                            key={j}
                                                                            whileHover={{ scale: 1.02 }}
                                                                            whileTap={{ scale: 0.98 }}
                                                                            onClick={() => onFixSuggestion(entityId, fix)}
                                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                                                                        >
                                                                            <Wand2 className="w-3 h-3" />
                                                                            {fix}
                                                                        </motion.button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const getFixSuggestions = (entityId: string, error: string): string[] => {
    // Provide user-friendly fix suggestions based on error type
    if (error.includes('PriorityLevel must be between 1-5')) {
        return ['Set priority to 3 (medium)'];
    }
    if (error.includes('Duration must be at least 1')) {
        return ['Set duration to 1'];
    }
    if (error.includes('MaxLoadPerPhase must be at least 1')) {
        return ['Set max load to 1'];
    }
    if (error.includes('RequestedTaskID') && error.includes('not found')) {
        return ['Remove invalid task ID'];
    }
    if (error.includes('No worker has required skill')) {
        return ['Add skill to a worker'];
    }
    
    // Default suggestion for other errors
    return ['Fix this issue'];
};