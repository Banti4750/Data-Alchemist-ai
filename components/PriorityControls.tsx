import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Users, DollarSign, Brain, Scale, Download, Info, Sparkles } from 'lucide-react';

interface PriorityControlsProps {
    onPriorityChange: (priorities: Record<string, number>) => void;
    onExport?: (priorities: Record<string, number>) => void;
    className?: string;
}

interface PriorityPreset {
    id: string;
    name: string;
    description: string;
    values: Record<string, number>;
    icon: keyof typeof priorityIcons;
}

const priorityIcons = {
    star: Star,
    clock: Clock,
    users: Users,
    dollar: DollarSign,
    brain: Brain,
    scale: Scale,
    sparkles: Sparkles,
};

export const PriorityControls = ({ onPriorityChange, onExport, className }: PriorityControlsProps) => {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [priorities, setPriorities] = useState({
        clientPriority: 50,
        taskUrgency: 50,
        workerFairness: 50,
        costReduction: 50,
        skillMatch: 50,
        loadBalance: 50,
    });

    const priorityDescriptions: Record<string, string> = {
        clientPriority: 'Higher values prioritize tasks from high-priority clients',
        taskUrgency: 'Considers task deadlines and importance in scheduling',
        workerFairness: 'Ensures equal distribution of work among team members',
        costReduction: 'Optimizes for cost-effective resource allocation',
        skillMatch: 'Prioritizes matching worker skills with task requirements',
        loadBalance: 'Balances workload across available resources',
    };

    const presets: PriorityPreset[] = [
        {
            id: 'client-first',
            name: 'Client First',
            description: 'Prioritize client satisfaction and task urgency',
            icon: 'star',
            values: {
                clientPriority: 90,
                taskUrgency: 80,
                workerFairness: 40,
                costReduction: 30,
                skillMatch: 60,
                loadBalance: 40
            }
        },
        {
            id: 'balanced-team',
            name: 'Balanced Team',
            description: 'Equal focus on worker fairness and efficiency',
            icon: 'scale',
            values: {
                clientPriority: 50,
                taskUrgency: 50,
                workerFairness: 80,
                costReduction: 50,
                skillMatch: 70,
                loadBalance: 80
            }
        },
        {
            id: 'cost-efficient',
            name: 'Cost Efficient',
            description: 'Focus on cost reduction and resource optimization',
            icon: 'dollar',
            values: {
                clientPriority: 40,
                taskUrgency: 50,
                workerFairness: 40,
                costReduction: 90,
                skillMatch: 50,
                loadBalance: 70
            }
        }
    ];

    const handleSliderChange = (key: string, value: number) => {
        const newPriorities = { ...priorities, [key]: value };
        setPriorities(newPriorities);
        onPriorityChange(newPriorities);
    };

    const handlePresetSelect = (preset: PriorityPreset) => {
        //@ts-ignore
        setPriorities(preset.values);
        onPriorityChange(preset.values);
    };

    const handleExport = () => {
        if (onExport) {
            onExport(priorities);
        }
    };

    const getSliderColor = (value: number): string => {
        if (value >= 80) return 'bg-green-500';
        if (value >= 60) return 'bg-blue-500';
        if (value >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 border rounded-xl bg-white shadow-sm ${className}`}
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-semibold text-xl mb-1">Allocation Priorities</h3>
                    <p className="text-gray-500 text-sm">Customize how tasks are distributed</p>
                </div>
                {onExport && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </motion.button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {Object.entries(priorities).map(([key, value], index) => {
                        const label = key.replace(/([A-Z])/g, ' $1').trim();
                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <label className="font-medium flex items-center gap-2">
                                        {label}
                                    </label>
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setActiveTooltip(key)}
                                        onMouseLeave={() => setActiveTooltip(null)}
                                    >
                                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                        <AnimatePresence>
                                            {activeTooltip === key && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10"
                                                >
                                                    {priorityDescriptions[key]}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={value}
                                        onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div
                                        className={`absolute left-0 top-0 h-2 rounded-lg transition-all ${getSliderColor(value)}`}
                                        style={{ width: `${value}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 mt-1">
                                    <span>Low</span>
                                    <span className="font-medium">{value}%</span>
                                    <span>High</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    <h4 className="font-medium text-lg mb-3">Quick Presets</h4>
                    <div className="grid gap-3">
                        {presets.map((preset, index) => {
                            const Icon = priorityIcons[preset.icon];
                            return (
                                <motion.button
                                    key={preset.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePresetSelect(preset)}
                                    className="w-full p-4 text-left border rounded-xl hover:bg-gray-50 transition-colors flex items-start gap-3"
                                >
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium mb-1">{preset.name}</div>
                                        <div className="text-sm text-gray-600">{preset.description}</div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100"
                    >
                        <div className="flex items-center gap-2 text-blue-800 mb-3">
                            <Sparkles className="w-5 h-5" />
                            <h4 className="font-medium">Current Configuration</h4>
                        </div>
                        <div className="grid gap-2 text-sm text-blue-700">
                            {Object.entries(priorities).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span className="font-medium px-2 py-1 bg-blue-100 rounded">{value}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};