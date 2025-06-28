import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import { Client, Worker, Task } from '@/lib/types/data';
export async function parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            //@ts-ignore
            complete: (results) => {
                console.log('Parsed CSV results:', results); // Debug
                resolve(results.data);
            },
            //@ts-ignore
            error: (error) => reject(error)
        });
    });
}

export async function parseExcel(file: File): Promise<any[]> {
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return utils.sheet_to_json(firstSheet);
}

// AI-powered header mapping
export async function mapHeadersWithAI(
    headers: string[],
    entityType: 'clients' | 'workers' | 'tasks'
): Promise<Record<string, string>> {
    const standardHeaders = {
        clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
        workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
        tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'],
    };

    const commonVariations = {
        'ID': ['id', 'identifier', 'code', 'number', 'no', '#'],
        'Name': ['name', 'title', 'label', 'description'],
        'PriorityLevel': ['priority', 'importance', 'urgency', 'level', 'rank'],
        'Skills': ['skill', 'capability', 'competency', 'qualification', 'expertise'],
        'Duration': ['time', 'length', 'period', 'span'],
        'MaxConcurrent': ['concurrent', 'parallel', 'simultaneous', 'max_parallel'],
        'AvailableSlots': ['slots', 'capacity', 'availability', 'free_slots'],
        'QualificationLevel': ['qual_level', 'certification', 'grade', 'level'],
        'GroupTag': ['group', 'team', 'department', 'unit', 'tag'],
    };

    const mapping: Record<string, string> = {};
    const unmappedHeaders = new Set(headers);

    // First pass: exact matches
    standardHeaders[entityType].forEach(standardHeader => {
        const exactMatch = headers.find(h => 
            h.toLowerCase() === standardHeader.toLowerCase()
        );
        if (exactMatch) {
            mapping[exactMatch] = standardHeader;
            unmappedHeaders.delete(exactMatch);
        }
    });

    // Second pass: partial matches with common variations
    Array.from(unmappedHeaders).forEach(header => {
        const headerLower = header.toLowerCase().replace(/[_\s-]/g, '');
        
        for (const standardHeader of standardHeaders[entityType]) {
            if (mapping[header]) break;

            //@ts-ignore
            const variations = commonVariations[standardHeader.replace(/(?:Worker|Client|Task)/g, '')] || [];
            //@ts-ignore
            const standardHeaderLower = standardHeader.toLowerCase().replace(/[_\s-]/g, '');
            
              //@ts-ignore
            const matchesVariation = variations.some(v => 

                headerLower.includes(v.toLowerCase().replace(/[_\s-]/g, ''))
            );

            if (matchesVariation) {
                mapping[header] = standardHeader;
                unmappedHeaders.delete(header);
                break;
            }
        }
    });

    // Third pass: fuzzy matching for remaining headers
    Array.from(unmappedHeaders).forEach(header => {
        const headerWords = header.toLowerCase().split(/[_\s-]/);
        
        for (const standardHeader of standardHeaders[entityType]) {
            if (mapping[header]) break;

            const standardWords = standardHeader.toLowerCase().split(/(?=[A-Z])|[_\s-]/);
            const matchScore = headerWords.reduce((score, word) => 
                score + (standardWords.some(sw => sw.includes(word) || word.includes(sw)) ? 1 : 0)
            , 0) / headerWords.length;

            if (matchScore > 0.5) {
                mapping[header] = standardHeader;
                unmappedHeaders.delete(header);
                break;
            }
        }
    });

    return mapping;
}