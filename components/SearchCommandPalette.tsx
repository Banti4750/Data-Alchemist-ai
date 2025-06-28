import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, X, Loader2 } from 'lucide-react';

interface SearchCommandPaletteProps {
    onSearch: (query: string) => Promise<void>;
    onClose: () => void;
    isOpen: boolean;
    className?: string;
}

const searchExamples = [
    {
        text: 'Show tasks with duration > 2',
        description: 'Find tasks that take longer than 2 hours',
    },
    {
        text: 'Clients requesting unavailable tasks',
        description: 'List clients with tasks that cannot be fulfilled',
    },
    {
        text: 'Workers without RequiredSkills',
        description: 'Find workers missing necessary skills',
    },
    {
        text: 'Tasks without assigned workers',
        description: 'Show unassigned tasks',
    },
    {
        text: 'High priority clients',
        description: 'List clients with priority level > 8',
    },
];

export const SearchCommandPalette = ({ onSearch, onClose, isOpen, className }: SearchCommandPaletteProps) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!isOpen) {
                    onClose();
                }
            } else if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSearch = async (searchQuery: string) => {
        setIsSearching(true);
        try {
            await onSearch(searchQuery);
            onClose();
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            handleSearch(query);
        }
    };

    const handleExampleClick = (example: string) => {
        setQuery(example);
        handleSearch(example);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50"
                        onClick={onClose}
                    />

                    <div className="fixed inset-x-0 top-[20%] mx-auto max-w-2xl px-4">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`bg-white rounded-xl shadow-2xl overflow-hidden ${className}`}
                        >
                            <form onSubmit={handleSubmit} className="relative">
                                <div className="flex items-center px-4 py-3 border-b gap-3">
                                    {isSearching ? (
                                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                    ) : (
                                        <Search className="w-5 h-5 text-gray-400" />
                                    )}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search data or type a command..."
                                        className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                                        disabled={isSearching}
                                    />
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <kbd className="px-2 py-1 bg-gray-100 rounded-md">
                                            <Command className="w-3 h-3 inline-block mr-1" />
                                            K
                                        </kbd>
                                        <span>to search</span>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div className="py-4 px-2">
                                <div className="px-3 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Suggestions
                                </div>
                                <div className="space-y-1">
                                    {searchExamples.map((example, index) => (
                                        <motion.button
                                            key={example.text}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleExampleClick(example.text)}
                                            className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg group hover:bg-gray-100 transition-colors ${selectedIndex === index ? 'bg-gray-100' : ''}`}
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {example.text}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {example.description}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};