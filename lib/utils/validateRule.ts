//@ts-ignore
import { Rule, Task, Worker, Client } from '../types/rules';

interface ValidationResult {
    valid: boolean;
    validationMessage?: string;
}

const validateRule = (
    rule: Rule,
    allTasks: Task[],
    allWorkers: Worker[],
    allClients?: Client[] // Optional if you need client validation
): ValidationResult => {
    // Basic rule structure validation
    if (!rule.type || !rule.parameters) {
        return {
            valid: false,
            validationMessage: "Invalid rule structure: missing type or parameters"
        };
    }

    // Get all available IDs for reference checking
    const availableTaskIds = allTasks.map(t => t.TaskID);
    const availableWorkerIds = allWorkers.map(w => w.WorkerID);
    const availableClientIds = allClients?.map(c => c.ClientID) || [];

    // Validate based on rule type
    switch (rule.type) {
        case 'coRun':
            return validateCoRunRule(rule.parameters, availableTaskIds);
        case 'precedence':
            return validatePrecedenceRule(rule.parameters, availableTaskIds);
        case 'loadLimit':
            return validateLoadLimitRule(rule.parameters, availableWorkerIds);
        case 'phaseWindow':
            return validatePhaseWindowRule(rule.parameters, availableTaskIds);
        case 'slotRestriction':
            return validateSlotRestrictionRule(rule.parameters, availableWorkerIds);
        case 'patternMatch':
            return validatePatternMatchRule(rule.parameters, availableTaskIds, availableWorkerIds);
        default:
            return {
                valid: false,
                validationMessage: `Unknown rule type: ${rule.type}`
            };
    }
};

// Validation functions for each rule type
const validateCoRunRule = (params: any, availableTaskIds: string[]): ValidationResult => {
    if (!params.tasks || !Array.isArray(params.tasks)) {
        return {
            valid: false,
            validationMessage: "Co-run rules require a 'tasks' array"
        };
    }

    if (params.tasks.length < 2) {
        return {
            valid: false,
            validationMessage: "Co-run rules require at least 2 tasks"
        };
    }

    const missingTasks = params.tasks.filter((t: string) => !availableTaskIds.includes(t));
    if (missingTasks.length > 0) {
        return {
            valid: false,
            validationMessage: `Tasks not found: ${missingTasks.join(', ')}`
        };
    }

    return { valid: true };
};

const validatePrecedenceRule = (params: any, availableTaskIds: string[]): ValidationResult => {
    if (!params.cause || !params.effect) {
        return {
            valid: false,
            validationMessage: "Precedence rules require 'cause' and 'effect' parameters"
        };
    }

    const errors: string[] = [];
    if (!availableTaskIds.includes(params.cause)) {
        errors.push(`Cause task ${params.cause} not found`);
    }
    if (!availableTaskIds.includes(params.effect)) {
        errors.push(`Effect task ${params.effect} not found`);
    }
    if (params.cause === params.effect) {
        errors.push("Cause and effect cannot be the same task");
    }

return errors.length > 0
        ? { valid: false, validationMessage: errors.join('; ') }
        : { valid: true };
};

const validateLoadLimitRule = (params: any, availableWorkerIds: string[]): ValidationResult => {
    if (!params.workerId || !params.maxTasks) {
        return {
            valid: false,
            validationMessage: "Load limit rules require 'workerId' and 'maxTasks' parameters"
        };
    }

    if (!availableWorkerIds.includes(params.workerId)) {
        return {
            valid: false,
            validationMessage: `Worker ${params.workerId} not found`
        };
    }

    if (typeof params.maxTasks !== 'number' || params.maxTasks < 1) {
        return {
            valid: false,
            validationMessage: "maxTasks must be a positive number"
        };
    }

    return { valid: true };
};

const validatePhaseWindowRule = (params: any, availableTaskIds: string[]): ValidationResult => {
    if (!params.taskId || !params.phases || !Array.isArray(params.phases)) {
        return {
            valid: false,
            validationMessage: "Phase window rules require 'taskId' and 'phases' array parameters"
        };
    }

    if (!availableTaskIds.includes(params.taskId)) {
        return {
            valid: false,
            validationMessage: `Task ${params.taskId} not found`
        };
    }

    if (params.phases.length === 0) {
        return {
            valid: false,
            validationMessage: "At least one phase must be specified"
        };
    }

    return { valid: true };
};

const validateSlotRestrictionRule = (params: any, availableWorkerIds: string[]): ValidationResult => {
    if (!params.workerId || typeof params.minSlots !== 'number') {
        return {
            valid: false,
            validationMessage: "Slot restriction rules require 'workerId' and 'minSlots' parameters"
        };
    }

    if (!availableWorkerIds.includes(params.workerId)) {
        return {
            valid: false,
            validationMessage: `Worker ${params.workerId} not found`
        };
    }

    if (params.minSlots < 0) {
        return {
            valid: false,
            validationMessage: "minSlots cannot be negative"
        };
    }

    return { valid: true };
};

const validatePatternMatchRule = (params: any, availableTaskIds: string[], availableWorkerIds: string[]): ValidationResult => {
    if (!params.pattern || typeof params.pattern !== 'string') {
        return {
            valid: false,
            validationMessage: "Pattern match rules require a 'pattern' parameter"
        };
    }

    try {
        new RegExp(params.pattern);
    } catch (e) {
        return {
            valid: false,
            validationMessage: "Invalid regular expression pattern"
        };
    }

    return { valid: true };
};

function validateCircularDependencies(tasks: Task[], rules: Rule[]): ValidationResult {
    const graph: Record<string, string[]> = {};
    
    // Build dependency graph
    tasks.forEach(task => {
        graph[task.TaskID] = [];
    });

    rules.forEach(rule => {
        if (rule.type === 'precedence') {
            graph[rule.parameters.cause].push(rule.parameters.effect);
        }
    });

    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function hasCycle(node: string): boolean {
        if (recursionStack.has(node)) return true;
        if (visited.has(node)) return false;

        visited.add(node);
        recursionStack.add(node);

        for (const neighbor of graph[node]) {
            if (hasCycle(neighbor)) return true;
        }

        recursionStack.delete(node);
        return false;
    }

    for (const task of tasks) {
        if (!visited.has(task.TaskID) && hasCycle(task.TaskID)) {
            return {
                valid: false,
                validationMessage: "Circular dependency detected in task precedence rules"
            };
        }
    }

    return { valid: true };
};

const validateCompleteRule = (rule: Rule, tasks: Task[], workers: Worker[], clients?: Client[]): Rule => {
    const validation = validateRule(rule, tasks, workers, clients);
    return {
        ...rule,
        valid: validation.valid,
        validationMessage: validation.validationMessage
    };
};


const validateAllRules = (
    rules: Rule[],
    tasks: Task[],
    workers: Worker[]
): { valid: number; invalid: number; warnings: number } => {
    const availableTaskIds = tasks.map(t => t.TaskID);
    const availableWorkerIds = workers.map(w => w.WorkerID);

    let valid = 0;
    let invalid = 0;
    let warnings = 0;

    rules.forEach(rule => {
        const validation = validateRule(rule, tasks, workers);
        if (!validation.valid) {
            invalid++;
        } else if (validation.validationMessage) {
            warnings++;
        } else {
            valid++;
        }
    });

    return { valid, invalid, warnings };
};

// Export all functions
export {
    //@ts-ignore
    ValidationResult,
    validateRule,
    validateCompleteRule,
    validateAllRules,
    validateCircularDependencies
};