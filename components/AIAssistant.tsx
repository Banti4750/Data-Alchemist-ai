import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Wand2, Loader2, ArrowRight, XCircle, CheckCircle, RotateCcw } from 'lucide-react';

interface AIAssistantProps {
    clients: any[];
    workers: any[];
    tasks: any[];
    onSearchResults: (results: any[], entityType: string) => void;
    onDataModified: (updatedData: any[], entityType: string) => void;
    onResetSearch: () => void;
    className?: string;
}

export const AIAssistant = ({
    clients,
    workers,
    tasks,
    onSearchResults,
    onDataModified,
    onResetSearch,
    className
}: AIAssistantProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [modificationQuery, setModificationQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isModifying, setIsModifying] = useState(false);
    const [activeSearch, setActiveSearch] = useState(false);

    // Separate function for AI search
    const handleAISearch = async (query: string) => {
        setIsSearching(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purpose: 'search',
                    query,
                    data: { clients, workers, tasks }
                }),
            });

            if (!response.ok) throw new Error('Search API request failed');

            const result = await response.json();
            const { filterFunction } = result;

            try {
                const filter = new Function('item', `return (${filterFunction})(item)`);

                // Apply filter to all entity types
                //@ts-ignore
                const clientResults = clients.filter(filter);
                //@ts-ignore
                const workerResults = workers.filter(filter);
                //@ts-ignore
                const taskResults = tasks.filter(filter);

                // Determine which entity type has results
                let results, entityType;
                if (clientResults.length > 0) {
                    results = clientResults;
                    entityType = 'clients';
                } else if (workerResults.length > 0) {
                    results = workerResults;
                    entityType = 'workers';
                } else if (taskResults.length > 0) {
                    results = taskResults;
                    entityType = 'tasks';
                } else {
                    throw new Error('No results found for this query');
                }

                setActiveSearch(true);
                onSearchResults(results, entityType);
            } catch (e) {
                console.error('Error executing filter:', e);
                throw new Error('Invalid filter function returned by AI');
            }
        } catch (error) {
            console.error('Error processing AI search:', error);
            alert(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSearching(false);
        }
    };

    // Separate function for AI modification
    const handleAIModification = async (query: string) => {
        setIsModifying(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purpose: 'modify',
                    query,
                    data: { clients, workers, tasks }
                }),
            });

            if (!response.ok) throw new Error('Modification API request failed');

            const result = await response.json();
            const { updatedData, entityType } = result;

            // Get the appropriate ID field for the entity type
            //@ts-ignore
            const idField = {
                //@ts-ignore
                clients: 'ClientID',
                //@ts-ignore
                workers: 'WorkerID',
                tasks: 'TaskID'
            }[entityType];

            // Get the current data based on entity type
            const originalData =
                entityType === 'clients' ? clients :
                    entityType === 'workers' ? workers :
                        tasks;

            // Merge changes while preserving all fields
            const fullUpdatedData = originalData.map(item => {
                const modifiedItem = updatedData.find((m: any) => m[idField] === item[idField]);
                return modifiedItem ? { ...item, ...modifiedItem } : item;
            });

            onDataModified(fullUpdatedData, entityType);
        } catch (error) {
            console.error('Error processing AI modification:', error);
            alert(`Modification failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsModifying(false);
        }
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        handleAISearch(searchQuery);
    };

    const handleModification = () => {
        if (!modificationQuery.trim()) return;
        handleAIModification(modificationQuery);
        setModificationQuery('');
    };

    const handleResetSearch = () => {
        setSearchQuery('');
        setActiveSearch(false);
        onResetSearch();
    };

    const searchExamples = [
        'Show tasks with duration > 2 phases',
        'Find workers without required skills',
        'List clients with high priority tasks',
        'Display tasks without assigned workers',
    ];

    const modificationExamples = [
        'Increase duration by 1 for marketing tasks',
        'Add "Project Management" to required skills for Task5',
        'Update priority level to 8 for urgent client tasks',
        'Set maximum workload to 40 hours for all workers',
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 border rounded-xl bg-white shadow-sm space-y-8 ${className}`}
        >
            <div className="flex items-center gap-2 text-gray-800">
                <Wand2 className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold">AI Assistant</h3>
            </div>

            <div className="space-y-6">
                <div className="space-y-4">
                    <label className="block font-medium">Search Data with Natural Language</label>
                    <div className="relative">
                        <div className="absolute left-4 top-3.5 text-gray-400">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type your search query..."
                            className="w-full pl-12 pr-24 py-3 bg-white border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSearching}
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-2">
                            {activeSearch && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={handleResetSearch}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>Search</>
                                )}
                            </motion.button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {searchExamples.map((example) => (
                            <button
                                key={example}
                                onClick={() => setSearchQuery(example)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block font-medium">Modify Data with Natural Language</label>
                    <div className="relative">
                        <div className="absolute left-4 top-3.5 text-gray-400">
                            <Wand2 className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={modificationQuery}
                            onChange={(e) => setModificationQuery(e.target.value)}
                            placeholder="Describe how you want to modify the data..."
                            className="w-full pl-12 pr-24 py-3 bg-white border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isModifying}
                        />
                        <div className="absolute right-2 top-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleModification}
                                disabled={isModifying || !modificationQuery.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isModifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>Apply Changes</>
                                )}
                            </motion.button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {modificationExamples.map((example) => (
                            <button
                                key={example}
                                onClick={() => setModificationQuery(example)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};