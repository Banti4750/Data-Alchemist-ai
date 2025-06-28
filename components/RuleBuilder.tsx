import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, AlertCircle, CheckCircle, ChevronRight, X } from 'lucide-react';

type RuleType = 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedence' | 'skillRequirement' | 'timeWindow' | 'resourceAllocation';

interface Task {
    TaskID: string;
    TaskName: string;
}

interface Client {
    ClientID: string;
    ClientName: string;
}

interface Worker {
    WorkerID: string;
    WorkerName: string;
}

interface Rule {
    type: RuleType;
    parameters: Record<string, any>;
    valid: boolean;
    validationMessage?: string;
    businessLogic?: string;
}

interface RuleBuilderProps {
    tasks: Task[];
    clients: Client[];
    workers: Worker[];
    onAddRule: (rule: Rule) => void;
}

export const RuleBuilder = ({ tasks, clients, workers, onAddRule }: RuleBuilderProps) => {
    const [ruleType, setRuleType] = useState<RuleType>('coRun');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
    const [activeExample, setActiveExample] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [ruleParameters, setRuleParameters] = useState<Record<string, any>>({});
    const [showExamples, setShowExamples] = useState(false);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const ruleTypeInfo = {
        coRun: {
            title: 'Co-run Tasks',
            description: 'Specify tasks that must be executed together',
            icon: '🔄'
        },
        slotRestriction: {
            title: 'Slot Restrictions',
            description: 'Define time slots when tasks can be scheduled',
            icon: '⏰'
        },
        loadLimit: {
            title: 'Load Limits',
            description: 'Set maximum workload for workers',
            icon: '⚖️'
        },
        phaseWindow: {
            title: 'Phase Windows',
            description: 'Schedule tasks in specific phases',
            icon: '📅'
        },
        patternMatch: {
            title: 'Pattern Matching',
            description: 'Create rules based on task patterns',
            icon: '🔍'
        },
        precedence: {
            title: 'Task Precedence',
            description: 'Define task execution order',
            icon: '📋'
        },
        skillRequirement: {
            title: 'Skill Requirements',
            description: 'Match tasks with worker skills',
            icon: '🎯'
        },
        timeWindow: {
            title: 'Time Windows',
            description: 'Set specific time ranges for tasks',
            icon: '🕒'
        },
        resourceAllocation: {
            title: 'Resource Allocation',
            description: 'Manage worker assignments',
            icon: '👥'
        }
    };

    const examples = [
        {
            input: "Tasks T001 and T002 should run together",
            output: "Co-run rule for website redesign and API development"
        },
        {
            input: "Finish quality assurance before starting content creation",
            output: "Precedence rule: T005 → T004"
        },
        {
            input: "John can only handle 2 tasks at a time",
            output: "Load limit for WR001 (John Doe)"
        },
        {
            input: "Tasks requiring Java skills should be assigned to senior developers",
            output: "Skill requirement rule for Java tasks"
        },
        {
            input: "Schedule high-priority tasks between 9 AM and 5 PM",
            output: "Time window restriction for priority tasks"
        },
        {
            input: "Distribute tasks evenly among workers in Team A",
            output: "Resource allocation rule for Team A"
        }
    ];

    const validateRule = (rule: Rule, allTasks: Task[], allWorkers: Worker[]): Rule => {
        const validatedRule = { ...rule, valid: true };

        // Check task references for co-run and precedence rules
        if (rule.type === 'coRun' || rule.type === 'precedence') {
            const taskIds = rule.type === 'coRun' 
                ? rule.parameters.tasks 
                : [rule.parameters.cause, rule.parameters.effect];

                //@ts-ignore
            const missingTasks = taskIds.filter(id =>
                !allTasks.some(t => t.TaskID === id)
            );

            if (missingTasks.length > 0) {
                validatedRule.valid = false;
                validatedRule.validationMessage = `Missing tasks: ${missingTasks.join(', ')}`;
            }
        }

        // Check worker references
        if (rule.type === 'loadLimit' && !allWorkers.some(w => w.WorkerID === rule.parameters.workerId)) {
            validatedRule.valid = false;
            validatedRule.validationMessage = `Worker ${rule.parameters.workerId} not found`;
        }

        return validatedRule;
    };

    const handleExampleClick = (example: string, index: number) => {
        setNaturalLanguageInput(example);
        setActiveExample(index);
        setShowExamples(false);
    };

    const handleAddRule = () => {
        if (!selectedTasks.length) {
            setError('Please select at least one task');
            return;
        }

        const newRule: Rule = {
            type: ruleType,
            parameters: {
                ...ruleParameters,
                tasks: selectedTasks
            },
            valid: true,
            businessLogic: ruleTypeInfo[ruleType].description
        };

        onAddRule(newRule);
        setSuccess(`${ruleTypeInfo[ruleType].title} rule added successfully!`);
        setSelectedTasks([]);
        setRuleParameters({});
    };

    const handleNaturalLanguageSubmit = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purpose: 'nl-to-rule',
                    text: naturalLanguageInput,
                    data: { tasks, clients, workers }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create rule');
            }

            const result = await response.json();
            
            // Validate the response structure
            if (!result.type || !result.parameters) {
                throw new Error('Invalid rule format from API');
            }

            console.log(result)
            const newRule: Rule = {
                type: result.type,
                parameters: result.parameters,
                valid: result.valid || false,
                validationMessage: result.validationMessage,
                businessLogic: result.businessLogic
            };

            onAddRule(newRule);
            setSuccess('Rule created successfully!');
            setNaturalLanguageInput('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create rule');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border p-6"
            >
                <h3 className="text-lg font-semibold mb-4">Create New Rule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {Object.entries(ruleTypeInfo).map(([type, info]) => (
                        <motion.button
                            key={type}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRuleType(type as RuleType)}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                                ruleType === type 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-200'
                            }`}
                        >
                            <div className="text-2xl mb-2">{info.icon}</div>
                            <h4 className="font-medium">{info.title}</h4>
                            <p className="text-sm text-gray-600">{info.description}</p>
                        </motion.button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={naturalLanguageInput}
                            onChange={(e) => setNaturalLanguageInput(e.target.value)}
                            placeholder="Describe your rule in plain English..."
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNaturalLanguageSubmit}
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Wand2 className="w-4 h-4" />
                            {isLoading ? 'Interpreting...' : 'Use AI'}
                        </motion.button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowExamples(!showExamples)}
                            className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                            <ChevronRight
                                className={`w-4 h-4 transition-transform ${
                                    showExamples ? 'rotate-90' : ''
                                }`}
                            />
                            Example rules
                        </button>
                    </div>

                    <AnimatePresence>
                        {showExamples && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    {examples.map((example, index) => (
                                        <motion.button
                                            key={index}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleExampleClick(example.input, index)}
                                            className={`p-4 rounded-lg bg-white shadow-sm border transition-colors ${
                                                activeExample === index ? 'border-blue-500' : 'border-gray-200'
                                            }`}
                                        >
                                            <p className="text-sm font-medium">{example.input}</p>
                                            <p className="text-xs text-gray-500 mt-1">{example.output}</p>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg"
                            >
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                                <button
                                    onClick={() => setError(null)}
                                    className="ml-auto hover:bg-red-100 p-1 rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg"
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span>{success}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-end">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddRule}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Add Rule
                        </motion.button>
                    </div>

                     {/* Multi-select for coRun rule */}
                    {ruleType === 'coRun' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Select Tasks to Co-Run</label>
                            <select
                                multiple
                                value={selectedTasks}
                                onChange={e => {
                                    const options = Array.from(e.target.selectedOptions, option => option.value);
                                    setSelectedTasks(options);
                                }}
                                className="w-full border rounded p-2"
                            >
                                {tasks.map(task => (
                                    <option key={task.TaskID} value={task.TaskID}>
                                        {task.TaskName} ({task.TaskID})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
                   