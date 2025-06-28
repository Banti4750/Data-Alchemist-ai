export interface Rule {
    type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedence';
    parameters: Record<string, any>;
    valid: boolean;
    validationMessage?: string;
}

export interface ModificationResult {
    updatedData: any[];
    entityType: 'clients' | 'workers' | 'tasks';
    changesMade: string;
}