import { Client, Worker, Task } from '@/lib/types/data';

export function validateData(
    clients: Client[],
    workers: Worker[],
    tasks: Task[]
): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    const taskIds = new Set(tasks.map(t => t.TaskID));
    const workerSkills = new Set(workers.flatMap(w => w.Skills));

    // Validate clients
    clients.forEach(client => {
        const clientErrors: string[] = [];

        if (!client.ClientID) clientErrors.push('ClientID is required');
        if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
            clientErrors.push('PriorityLevel must be between 1-5');
        }

        // Convert comma-separated string to array and validate each task ID
        if (client.RequestedTaskIDs) {
            const requestedTasks = client.RequestedTaskIDs
                .split(',')
                .map(taskId => taskId.trim())
                .filter(taskId => taskId.length > 0);

            requestedTasks.forEach(taskId => {
                if (!taskIds.has(taskId)) {
                    clientErrors.push(`RequestedTaskID ${taskId} not found`);
                }
            });
        }

        if (clientErrors.length > 0) {
            errors[client.ClientID] = clientErrors;
        }
    });

    // Validate workers
    workers.forEach(worker => {
        const workerErrors: string[] = [];

        if (!worker.WorkerID) workerErrors.push('WorkerID is required');
        if (worker.MaxLoadPerPhase < 1) {
            workerErrors.push('MaxLoadPerPhase must be at least 1');
        }

        if (workerErrors.length > 0) {
            errors[worker.WorkerID] = workerErrors;
        }
    });

    // Validate tasks
    tasks.forEach(task => {
        const taskErrors: string[] = [];

        if (!task.TaskID) taskErrors.push('TaskID is required');
        if (task.Duration < 1) taskErrors.push('Duration must be at least 1');

        // Check required skills are covered by workers
        if (task.RequiredSkills) {
            const requiredSkills = task.RequiredSkills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);

            requiredSkills.forEach(skill => {
                const workerHasSkill = workers.some(worker => {
                    const workerSkills = worker.Skills
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                    return workerSkills.includes(skill);
                });

                if (!workerHasSkill) {
                    taskErrors.push(`No worker has required skill: ${skill}`);
                }
            });
        }

        if (taskErrors.length > 0) {
            errors[task.TaskID] = taskErrors;
        }
    });

    // Cross-entity validations
    validateCircularDependencies(tasks, errors);
    validateWorkerOverload(workers, tasks, errors);

    return errors;
}

function validateCircularDependencies(tasks: Task[], errors: Record<string, string[]>) {
    // Implement circular dependency check
}

function validateWorkerOverload(
    workers: Worker[],
    tasks: Task[],
    errors: Record<string, string[]>
) {
    // Implement worker overload check
}