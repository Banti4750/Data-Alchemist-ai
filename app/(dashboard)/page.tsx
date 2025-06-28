// 'use client';

// import { useState, useEffect } from 'react';
// import { FileUpload } from '@/components/FileUpload';
// import { DataGrid } from '@/components/DataGrid';
// import { ValidationPanel } from '@/components/ValidationPanel';
// import { RuleBuilder } from '@/components/RuleBuilder';
// import { PriorityControls } from '@/components/PriorityControls';
// import { AIAssistant } from '@/components/AIAssistant';
// import { Client, Worker, Task, EntityType } from '@/lib/types/data';
// import { validateData } from '@/lib/utils/validators';
// import { Rule } from '@/lib/types/rules';

// export default function Dashboard() {
//     const [clients, setClients] = useState<Client[]>([]);
//     const [workers, setWorkers] = useState<Worker[]>([]);
//     const [tasks, setTasks] = useState<Task[]>([]);
//     const [activeEntity, setActiveEntity] = useState<EntityType>('clients');
//     const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
//     const [rules, setRules] = useState<Rule[]>([]);
//     const [priorities, setPriorities] = useState<Record<string, number>>({});

//     useEffect(() => {
//         // Run validation whenever data changes
//         if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
//             const errors = validateData(clients, workers, tasks);
//             setValidationErrors(errors);
//         }
//     }, [clients, workers, tasks]);

//     const handleDataParsed = (data: any[], entityType: EntityType) => {
//         // Transform and set data based on entity type
//         switch (entityType) {
//             case 'clients':
//                 setClients(data as Client[]);
//                 break;
//             case 'workers':
//                 setWorkers(data as Worker[]);
//                 break;
//             case 'tasks':
//                 setTasks(data as Task[]);
//                 break;
//         }
//     };

//     const handleDataChange = (newData: any[], entityType: EntityType) => {
//         // Update the appropriate data state
//         switch (entityType) {
//             case 'clients':
//                 setClients(newData as Client[]);
//                 break;
//             case 'workers':
//                 setWorkers(newData as Worker[]);
//                 break;
//             case 'tasks':
//                 setTasks(newData as Task[]);
//                 break;
//         }
//     };

//     const handleAddRule = (newRule: Rule) => {
//         setRules([...rules, newRule]);
//     };

//     const handleExport = () => {
//         // Prepare data for export
//         const exportData = {
//             clients,
//             workers,
//             tasks,
//             rules,
//             priorities,
//         };

//         // Create download
//         const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'resource-allocation-config.json';
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     const handleAISearch = async (query: string) => {
//         // Call AI API to process natural language search
//         try {
//             const response = await fetch('/api/ai/search', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     query,
//                     clients,
//                     workers,
//                     tasks,
//                 }),
//             });
//             const { filterFunction } = await response.json();
//             // Apply the filter to the data
//             // This would be implemented based on the AI response
//         } catch (error) {
//             console.error('Error processing AI search:', error);
//         }
//     };

//     const handleAIModification = async (modification: string) => {
//         // Call AI API to process natural language modification
//         try {
//             const response = await fetch('/api/ai/modify', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     modification,
//                     clients,
//                     workers,
//                     tasks,
//                 }),
//             });
//             const { updatedData, entityType } = await response.json();
//             handleDataChange(updatedData, entityType);
//         } catch (error) {
//             console.error('Error processing AI modification:', error);
//         }
//     };

//     return (
//         <div className="container mx-auto p-4" >
//             <h1 className="text-2xl font-bold mb-6" > Resource Allocation Configurator </h1>

//             < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >
//                 {/* Left Column */}
//                 < div className="space-y-6" >
//                     <FileUpload
//                         onDataParsed={(data, type) => handleDataParsed(data, type)}
//                         entityType="clients"
//                     />
//                     <FileUpload
//                         onDataParsed={(data, type) => handleDataParsed(data, type)}
//                         entityType="workers"
//                     />
//                     <FileUpload
//                         onDataParsed={(data, type) => handleDataParsed(data, type)}
//                         entityType="tasks"
//                     />

//                     <ValidationPanel
//                         errors={validationErrors}
//                         onFixSuggestion={(entityId, fix) => {
//                             // Apply the suggested fix
//                             // This would be implemented based on the suggestion
//                         }
//                         }
//                     />
//                 </>

//                 {/* Middle Column */}
//                 <div className="space-y-6" >
//                     <div className="flex space-x-2 mb-4" >
//                         <button
//                             onClick={() => setActiveEntity('clients')}
//                             className={`px-4 py-2 rounded ${activeEntity === 'clients' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                         >
//                             Clients
//                         </button>
//                         < button
//                             onClick={() => setActiveEntity('workers')}
//                             className={`px-4 py-2 rounded ${activeEntity === 'workers' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                         >
//                             Workers
//                         </button>
//                         < button
//                             onClick={() => setActiveEntity('tasks')}
//                             className={`px-4 py-2 rounded ${activeEntity === 'tasks' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//                         >
//                             Tasks
//                         </button>
//                     </div>

//                     < DataGrid
//                         data={activeEntity === 'clients' ? clients :
//                             activeEntity === 'workers' ? workers : tasks}
//                         entityType={activeEntity}
//                         onDataChange={(newData) => handleDataChange(newData, activeEntity)}
//                         validationErrors={validationErrors}
//                     />
//                 </div>

//                 {/* Right Column */}
//                 <div className="space-y-6" >
//                     <AIAssistant
//                         onSearch={handleAISearch}
//                         onDataModification={handleAIModification}
//                     />

//                     <RuleBuilder
//                         tasks={tasks}
//                         clients={clients}
//                         workers={workers}
//                         onAddRule={handleAddRule}
//                     />

//                     <PriorityControls
//                         onPriorityChange={setPriorities}
//                     />

//                     < button
//                         onClick={handleExport}
//                         className="w-full bg-green-500 text-white py-3 rounded-lg font-bold"
//                         disabled={Object.keys(validationErrors).length > 0}
//                     >
//                         Export Configuration
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }