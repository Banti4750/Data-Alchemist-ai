

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EntityType } from '@/lib/types/data';
import { ModificationResult } from '@/lib/types/ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
    const { purpose, data, query, text, entityId, error } = await request.json();
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    try {
        let response;
        switch (purpose) {
            case 'search':
                response = await handleAISearch(model, data, query);
                break;
            case 'modify':
                response = await handleAIModification(model, data, query);
                break;
            case 'nl-to-rule':
                // Use text parameter instead of query for rule conversion
                response = await handleNLToRule(model, data, text || query);
                break;
            case 'fix-validation':
                response = await handleValidationFix(model, data, entityId, error);
                break;
            default:
                return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 });
        }
        return NextResponse.json(response);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Processing failed', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

async function handleAISearch(model: any, data: any, query: string) {
    // const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an AI assistant for a resource allocation system. The user wants to search their data with this query:
    "${query}"

    Data Sample:
    - Clients: ${JSON.stringify(data.clients.slice(0, 3))}
    - Workers: ${JSON.stringify(data.workers.slice(0, 3))}
    - Tasks: ${JSON.stringify(data.tasks.slice(0, 3))}

    Generate a JavaScript filter function that:
    1. Takes one parameter (item)
    2. Returns true if the item matches the query
    3. Only contains the function code
    4. Has no additional explanations

    Example for "tasks with duration more than 2":
    function filter(item) {
      return item.Duration > 2;
    }

    Required:
    - Must be valid JavaScript
    - Must work with the data structure shown
  `;

    try {
        // const result = await model.generateContent(prompt);
        // const response = await result.response;
        // const text = response.text();

        // // Extract just the function code
        // const functionStart = text.indexOf('function');
        // const functionEnd = text.lastIndexOf('}') + 1;
        // const filterFunction = functionStart !== -1 ? text.slice(functionStart, functionEnd) : text;

        // return { filterFunction };

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { filterFunction: response.text() };
    } catch (error) {
        console.error('Gemini search error:', error);
        throw new Error('Failed to generate search filter');
    }
}

// 2. Fixed Modify Endpoint
async function handleAIModification(model: any, data: any, modification: string) {
    const prompt = `
    You are a data editor. Strictly follow these rules:
    1. Instruction: "${modification}"
    2. Current Data: ${JSON.stringify(data, null, 2)}
    3. Return ONLY this JSON structure:
    {
      "updatedData": [
        {
          /* Include ONLY the identifier field (ClientID/WorkerID/TaskID) */
          /* and the fields that need modification */
          /* Example: {"TaskID": "T001", "Duration": 3} */
        }
      ],
      "entityType": "clients|workers|tasks",
      "changesMade": "brief description"
    }
    4. Rules:
       - Never include unchanged fields
       - Always include the ID field (ClientID/WorkerID/TaskID)
       - Only return the minimal set of fields that need changing
       - Never include complete objects
       - Maintain original data types
    5. Example Responses:
       - For "Increase priority by 1 for client CL001":
         {
           "updatedData": [{"ClientID": "CL001", "PriorityLevel": 4}],
           "entityType": "clients",
           "changesMade": "Increased priority by 1"
         }
       - For "Change duration to 3 for marketing tasks":
         {
           "updatedData": [
             {"TaskID": "T001", "Duration": 3},
             {"TaskID": "T002", "Duration": 3}
           ],
           "entityType": "tasks",
           "changesMade": "Updated duration for marketing tasks"
         }
  `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        });

        const response = await result.response;
        const rawText = response.text();

        // Enhanced JSON extraction with validation
        const extractAndValidateJson = (text: string) => {
            // Remove markdown and other non-JSON content
            text = text.replace(/```json|```|^[^{]*|[^}]*$/g, '');

            // Parse and validate
            const parsed = JSON.parse(text);

            if (!parsed.updatedData || !Array.isArray(parsed.updatedData)) {
                throw new Error("Missing or invalid updatedData array");
            }

            if (!parsed.entityType || !['clients', 'workers', 'tasks'].includes(parsed.entityType)) {
                throw new Error("Invalid entityType");
            }

            // Validate each updated item has an ID field
            //@ts-ignore
            const idField = {
                clients: 'ClientID',
                workers: 'WorkerID',
                tasks: 'TaskID'
            }[parsed.entityType];

            parsed.updatedData.forEach((item: any) => {
                if (!item[idField]) {
                    throw new Error(`Missing ${idField} in updated item`);
                }
            });

            return parsed;
        };

        const resultData = extractAndValidateJson(rawText);
        console.log("Processed Modification:", resultData);
        return resultData;

    } catch (error) {
        console.error('Modification error details:', {
            error: error instanceof Error ? error.message : String(error),
            prompt
        });
        throw new Error(`Modification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

interface RuleResponse {
    type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedence';
    parameters: Record<string, any>;
    valid: boolean;
    validationMessage?: string;
}

async function handleNLToRule(model: any, data: any, text: string) {

    const prompt = `Convert this natural language rule to structured JSON:
  "${text}"


  Available entities:
  - Tasks: ${JSON.stringify(data.tasks.slice(0, 3).map(
        //@ts-ignore
        t => t.TaskName))}
  - Workers: ${JSON.stringify(data.workers.slice(0, 3).map(
            //@ts-ignore
            w => w.WorkerName))}
  - Clients: ${JSON.stringify(data.clients.slice(0, 3).map(
                //@ts-ignore
                c => c.ClientName))}

  Return JSON with:
  - type: RuleType
  - parameters: object with relevant fields
  - validationMessage: if invalid
  - businessLogic: explanation

  Example output:
  {
    "type": "coRun",
    "parameters": { "taskIds": ["T1", "T2"] },
    "validationMessage": "",
    "businessLogic": "These tasks must run together"
  }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    try {
        return JSON.parse(response.text());
    } catch (err) {
        return {
            type: 'invalid',
            parameters: {},
            validationMessage: 'Failed to parse rule',
            businessLogic: 'Please rephrase your rule'
        };
    }
}

async function handleValidationFix(model: any, data: any, entityId: string, error: string): Promise<ModificationResult> {
    // Determine entity type from ID format
    let entityType: EntityType = 'clients';
    if (entityId.startsWith('W')) entityType = 'workers';
    if (entityId.startsWith('T')) entityType = 'tasks';

    // Find the entity in the data
    const entity = data[entityType].find((item: any) => {
        const idField = entityType === 'clients' ? 'ClientID' :
            entityType === 'workers' ? 'WorkerID' : 'TaskID';
        return item[idField] === entityId;
    });

    if (!entity) {
        throw new Error(`Entity ${entityId} not found in ${entityType}`);
    }

    const prompt = `
    You are an AI assistant for a resource allocation system. You need to fix a validation error:

    Error: "${error}"
    Entity ID: ${entityId}
    Entity Type: ${entityType}
    Entity Data: ${JSON.stringify(entity, null, 2)}

    Full Data Context:
    - Clients: ${JSON.stringify(data.clients.slice(0, 2))}
    - Workers: ${JSON.stringify(data.workers.slice(0, 2))}
    - Tasks: ${JSON.stringify(data.tasks.slice(0, 2))}

    Generate a fix for this validation error. Return ONLY a JSON object with:
    1. The ID field (ClientID/WorkerID/TaskID)
    2. ONLY the fields that need to be modified to fix the error
    3. A brief description of the changes made

    Example response format:
    {
      "updatedData": [
        {
          "TaskID": "T001",
          "Duration": 3
        }
      ],
      "entityType": "tasks",
      "changesMade": "Updated duration to valid value"
    }

    Rules:
    - Never include unchanged fields
    - Always include the ID field
    - Only return the minimal set of fields that need changing
    - Maintain original data types
    - Fix the specific error mentioned
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        });

        const response = await result.response;
        const rawText = response.text();

        // Extract and validate JSON
        const extractAndValidateJson = (text: string) => {
            // Remove markdown and other non-JSON content
            text = text.replace(/```json|```|^[^{]*|[^}]*$/g, '');

            // Parse and validate
            const parsed = JSON.parse(text);

            if (!parsed.updatedData || !Array.isArray(parsed.updatedData)) {
                throw new Error("Missing or invalid updatedData array");
            }

            if (!parsed.entityType || !['clients', 'workers', 'tasks'].includes(parsed.entityType)) {
                throw new Error("Invalid entityType");
            }

            // Validate each updated item has an ID field
            //@ts-ignore
            const idField = {
                clients: 'ClientID',
                workers: 'WorkerID',
                tasks: 'TaskID'
            }[parsed.entityType];

            parsed.updatedData.forEach((item: any) => {
                if (!item[idField]) {
                    throw new Error(`Missing ${idField} in updated item`);
                }
            });

            return parsed;
        };

        const resultData = extractAndValidateJson(rawText);
        console.log("Processed Fix:", resultData);
        return resultData;

    } catch (error) {
        console.error('Fix generation error:', error);

        // Fallback fix based on error type
        const idField = entityType === 'clients' ? 'ClientID' :
            entityType === 'workers' ? 'WorkerID' : 'TaskID';

        let fallbackFix: any = { [idField]: entityId };

        //@ts-ignore
        if (error.toString().includes('PriorityLevel')) {
            fallbackFix.PriorityLevel = 3;
            //@ts-ignore
        } else if (error.toString().includes('Duration')) {
            fallbackFix.Duration = 1;
            //@ts-ignore
        } else if (error.toString().includes('MaxLoadPerPhase')) {
            fallbackFix.MaxLoadPerPhase = 1;
        }

        return {
            updatedData: [fallbackFix],
            entityType,
            changesMade: `Applied default fix for ${error}`
        };
    }
}