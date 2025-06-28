interface RulesTableProps {
    rules: Rule[];
    tasks: Task[];
    onDelete?: (index: number) => void;
}


export const RulesTable = ({ rules, tasks }: RulesTableProps) => {
    console.log(rules)
    const getRuleDescription = (rule: Rule) => {
        switch (rule.type) {
            case 'coRun':
                if (!rule.parameters || !Array.isArray(rule.parameters.tasks)) return 'Invalid coRun rule';
                const taskNames = rule.parameters.tasks
                    .map((id: string) => tasks.find(t => t.TaskID === id)?.TaskName || id);
                return `${taskNames.join(' and ')} must run together`;

            case 'precedence':
                if (!rule.parameters || !rule.parameters.cause || !rule.parameters.effect) return 'Invalid precedence rule';
                const cause = tasks.find(t => t.TaskID === rule.parameters.cause)?.TaskName || rule.parameters.cause;
                const effect = tasks.find(t => t.TaskID === rule.parameters.effect)?.TaskName || rule.parameters.effect;
                return `${cause} must finish before ${effect} starts`;

            case 'loadLimit':
                if (!rule.parameters || !rule.parameters.workerId || typeof rule.parameters.maxTasks !== 'number') return 'Invalid loadLimit rule';
                return `Worker ${rule.parameters.workerId} can handle maximum ${rule.parameters.maxTasks} tasks`;

            case 'phaseWindow':
                if (!rule.parameters || !rule.parameters.taskId || !Array.isArray(rule.parameters.phases)) return 'Invalid phaseWindow rule';
                return `Task ${rule.parameters.taskId} must be executed in phases: ${rule.parameters.phases.join(', ')}`;

            case 'slotRestriction':
                if (!rule.parameters || !rule.parameters.workerId || typeof rule.parameters.minSlots !== 'number') return 'Invalid slotRestriction rule';
                return `Worker ${rule.parameters.workerId} requires minimum ${rule.parameters.minSlots} slots`;

            case 'patternMatch':
                if (!rule.parameters || typeof rule.parameters.pattern !== 'string') return 'Invalid patternMatch rule';
                return `Pattern matching rule: ${rule.parameters.pattern}`;

            case 'skillRequirement':
                if (!rule.parameters || !Array.isArray(rule.parameters.skills)) return 'Invalid skillRequirement rule';
                return `Required skills: ${rule.parameters.skills.length > 0 ? rule.parameters.skills.join(', ') : 'None'}`;

            default:
                return rule.businessLogic || JSON.stringify(rule.parameters);
        }
    };

    return (
        <div className="mt-6">
            <h4 className="font-medium mb-2">Active Business Rules</h4>
            {rules.length === 0 ? (
                <p className="text-sm text-gray-500">No rules added yet</p>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rules.map((rule, i) => (
                            <tr key={i}>
                                <td className="px-4 py-2 text-sm capitalize">{rule.type}</td>
                                <td className="px-4 py-2 text-sm">{getRuleDescription(rule)}</td>
                                <td className="px-4 py-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rule.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {rule.valid ? 'Active' : 'Invalid'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};