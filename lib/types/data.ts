export type DataEntity = Client | Worker | Task;

export interface Client {
    ClientID: string;
    ClientName: string;
    PriorityLevel: number;
    RequestedTaskIDs: string;
    GroupTag?: string;
    AttributesJSON: Record<string, any>;
}

export interface Worker {
    WorkerID: string;
    WorkerName: string;
    Skills: string;
    AvailableSlots: string;
    MaxLoadPerPhase: number;
    WorkerGroup?: string;
    QualificationLevel?: number;
}

export interface Task {
    TaskID: string;
    TaskName: string;
    Category?: string;
    Duration: number;
    RequiredSkills: string;
    PreferredPhases: string;
    MaxConcurrent: number;
}
export type EntityType = 'clients' | 'workers' | 'tasks';