'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@/components/DataGrid';
import { ValidationPanel } from '@/components/ValidationPanel';
import { RuleBuilder } from '@/components/RuleBuilder';
import { PriorityControls } from '@/components/PriorityControls';
import { AIAssistant } from '@/components/AIAssistant';
import { FileUpload } from '@/components/FileUpload';
import { Client, Worker, Task, EntityType } from '@/lib/types/data';
import { validateData } from '@/lib/utils/validators';
//@ts-ignore
import { Rule } from '@/lib/types/rules';
import { Download, AlertCircle, CheckCircle, Loader2, FileJson, FileSpreadsheet, Upload, Database, Settings, Brain, FileText } from 'lucide-react';
import { RulesTable } from '@/components/RuleTable';
import { validateCompleteRule, validateAllRules } from '@/lib/utils/validateRule';
import { toast } from 'sonner';

interface ExportData {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: Rule[];
  priorities: Record<string, number>;
  timestamp: string;
  version: string;
  metadata?: {
    projectName?: string;
    description?: string;
    author?: string;
  };
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeEntity, setActiveEntity] = useState<EntityType>('clients');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [rules, setRules] = useState<Rule[]>([]);
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [fileName, setFileName] = useState('resource-allocation-config');
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{
    valid: number;
    invalid: number;
    warnings: number;
  }>({ valid: 0, invalid: 0, warnings: 0 });

  // Validate data whenever it changes
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      const errors = validateData(clients, workers, tasks);
      setValidationErrors(errors);
    }
  }, [clients, workers, tasks]);

  // Validate rules whenever they change
  useEffect(() => {
    const summary = validateAllRules(rules, tasks, workers);
    setValidationSummary(summary);
  }, [rules, tasks, workers]);

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
    toast.success('Rule deleted successfully');
  };

  const handleValidateAll = useCallback(() => {
    setIsValidating(true);
    toast.info('Validating all rules...');

    setTimeout(() => {
      try {
        const validatedRules = rules.map(rule =>
          validateCompleteRule(rule, tasks, workers)
        );

        setRules(validatedRules);

        const invalidCount = validatedRules.filter(r => !r.valid).length;
        if (invalidCount > 0) {
          toast.warning(`Found ${invalidCount} invalid rules`);
        } else {
          toast.success('All rules are valid!');
        }
      } catch (error) {
        toast.error('Validation failed');
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    }, 800);
  }, [rules, tasks, workers]);

  const handleFixAll = useCallback(() => {
    setIsValidating(true);
    toast.info('Auto-fixing in progress...');

    setTimeout(() => {
      try {
        handleValidateAll();
        toast.success('Fixed all possible issues');
      } catch (error) {
        console.error('Fix error:', error);
        toast.error('Failed to fix issues');
      } finally {
        setIsValidating(false);
      }
    }, 1000);
  }, [handleValidateAll]);

  // const handleFixSuggestion = async (entityId: string, error: string) => {
  //   try {
  //     let entityType: EntityType = 'clients';
  //     if (entityId.startsWith('W')) entityType = 'workers';
  //     if (entityId.startsWith('T')) entityType = 'tasks';
      
  //     const entityData = 
  //       entityType === 'clients' ? clients.find(c => c.ClientID === entityId) :
  //       entityType === 'workers' ? workers.find(w => w.WorkerID === entityId) :
  //       tasks.find(t => t.TaskID === entityId);
      
  //     if (!entityData) {
  //       throw new Error(`Entity ${entityId} not found`);
  //     }
      
  //     const updatedData = { ...entityData };
      
  //     if (error.includes('PriorityLevel must be between 1-5')) {
  //       //@ts-ignore
  //       updatedData.PriorityLevel = 3;
  //     } else if (error.includes('Duration must be at least 1')) {
  //       //@ts-ignore
  //       updatedData.Duration = 1;
  //     } else if (error.includes('MaxLoadPerPhase must be at least 1')) {
  //       //@ts-ignore
  //       updatedData.MaxLoadPerPhase = 1;
  //     } else if (error.includes('RequestedTaskID') && error.includes('not found')) {
  //       const invalidTaskId = error.match(/RequestedTaskID ([\w-]+) not found/)?.[1];
  //       if (invalidTaskId) {
  //         //@ts-ignore
  //         const taskIds = updatedData.RequestedTaskIDs.split(',').map(id => id.trim());
  //         //@ts-ignore
  //         updatedData.RequestedTaskIDs = taskIds.filter(id => id !== invalidTaskId).join(',');
  //       }
  //     } else if (error.includes('No worker has required skill')) {
  //       const missingSkill = error.match(/No worker has required skill: ([\w-]+)/)?.[1];
  //       if (missingSkill && workers.length > 0) {
  //         const firstWorker = { ...workers[0] };
  //         firstWorker.Skills = firstWorker.Skills ? `${firstWorker.Skills},${missingSkill}` : missingSkill;
          
  //         const workerUpdates = [firstWorker];
  //         handleDataChange(workerUpdates, 'workers');
          
  //         toast.success(`Added missing skill '${missingSkill}' to worker ${firstWorker.WorkerName}`);
  //         return;
  //       }
  //     }
      
  //     const updates = [updatedData];
  //     handleDataChange(updates, entityType);
      
  //     toast.success(`Fixed error for ${entityId}`);
  //   } catch (error) {
  //     console.error('Fix error:', error);
  //     toast.error('Failed to apply fix');
  //   }
  // };

  const handleDataParsed = (data: any[], entityType: EntityType) => {
    switch (entityType) {
      case 'clients':
        setClients(data as Client[]);
        break;
      case 'workers':
        setWorkers(data as Worker[]);
        break;
      case 'tasks':
        setTasks(data as Task[]);
        break;
    }
    setIsSearchActive(false);
    toast.success(`${entityType} data loaded successfully`);
  };

  const handleDataChange = (newData: any[], entityType: EntityType) => {
    const fullUpdatedData = newData.map(item => {
      const original =
        entityType === 'clients' ? clients.find(c => c.ClientID === item.ClientID) :
          entityType === 'workers' ? workers.find(w => w.WorkerID === item.WorkerID) :
            tasks.find(t => t.TaskID === item.TaskID);
      return { ...original, ...item };
    });

    switch (entityType) {
      case 'clients':
        setClients(fullUpdatedData as Client[]);
        break;
      case 'workers':
        setWorkers(fullUpdatedData as Worker[]);
        break;
      case 'tasks':
        setTasks(fullUpdatedData as Task[]);
        break;
    }
  };

  const handleSearchResults = (results: any[], entityType: string) => {
    setFilteredData(results);
    setActiveEntity(entityType as EntityType);
    setIsSearchActive(true);
  };

  const handleResetSearch = () => {
    setFilteredData([]);
    setIsSearchActive(false);
  };

  const handleAddRule = (newRule: Rule) => {
    const validatedRule = validateCompleteRule(newRule, tasks, workers);
    setRules([...rules, validatedRule]);

    if (validatedRule.valid) {
      toast.success('Rule added successfully');
    } else {
      toast.warning('Rule added but needs validation', {
        description: validatedRule.validationMessage
      });
    }
  };

  const prepareExportData = (): ExportData => {
    return {
      clients,
      workers,
      tasks,
      rules,
      priorities,
      timestamp: new Date().toISOString(),
      version: '1.0',
      metadata: {
        projectName: 'Resource Allocation Configuration',
        description: 'Generated configuration for resource allocation system'
      }
    };
  };

  const exportToFile = (data: ExportData) => {
    const blob = exportFormat === 'json'
      ? new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      : new Blob([convertToCSV(data)], { type: 'text/csv' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: ExportData): string => {
    let csv = 'Type,ID,Name\n';
    
    data.clients.forEach(client => {
      csv += `Client,${client.ClientID},${client.ClientName}\n`;
    });
    
    data.workers.forEach(worker => {
      csv += `Worker,${worker.WorkerID},${worker.WorkerName}\n`;
    });
    
    data.tasks.forEach(task => {
      csv += `Task,${task.TaskID},${task.TaskName}\n`;
    });

    return csv;
  };

  const ValidationStatusBadge = () => (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="font-semibold text-green-700">Valid: {validationSummary.valid}</span>
        </div>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold text-yellow-700">Warnings: {validationSummary.warnings}</span>
        </div>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="font-semibold text-red-700">Invalid: {validationSummary.invalid}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleValidateAll}
          disabled={rules.length === 0 || isValidating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span>Validate All</span>
        </button>
        <button
          onClick={handleFixAll}
          disabled={validationSummary.invalid === 0 || isValidating}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Fix All
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resource Allocation Configurator</h1>
              <p className="text-gray-600 mt-1">Manage clients, workers, tasks, and business rules</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {clients.length + workers.length + tasks.length} total records
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Data Import</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <FileUpload
                onDataParsed={(data, type) => handleDataParsed(data, type)}
                entityType="clients"
              />
              <FileUpload
                onDataParsed={(data, type) => handleDataParsed(data, type)}
                entityType="workers"
              />
              <FileUpload
                onDataParsed={(data, type) => handleDataParsed(data, type)}
                entityType="tasks"
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className=" gap-8">
          {/* Left Column - Data Management */}
          <div className="flex-1 space-y-6">
            {/* Data View Controls */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
                  </div>
                  <div className="flex space-x-2">
                    {(['clients', 'workers', 'tasks'] as EntityType[]).map((entity) => (
                      <button
                        key={entity}
                        onClick={() => {
                          setActiveEntity(entity);
                          setIsSearchActive(false);
                        }}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          activeEntity === entity && !isSearchActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {entity.charAt(0).toUpperCase() + entity.slice(1)}
                        <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                          {entity === 'clients' ? clients.length : 
                           entity === 'workers' ? workers.length : tasks.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <DataGrid
                  data={isSearchActive ? filteredData :
                    activeEntity === 'clients' ? clients :
                      activeEntity === 'workers' ? workers : tasks}
                  entityType={activeEntity}
                  onDataChange={(newData) => handleDataChange(newData, activeEntity)}
                  validationErrors={validationErrors}
                />
              </div>
            </div>

            {/* Validation Panel */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h2 className="text-xl font-semibold text-gray-900">Validation Issues</h2>
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {Object.keys(validationErrors).length} errors
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {/* <ValidationPanel
                    errors={validationErrors}
                    // onFixSuggestion={handleFixSuggestion}
                  /> */}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI & Rules */}
          <div className="w-full space-y-6">
            {/* AI Assistant */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
                </div>
              </div>
              <div className="p-6">
                <AIAssistant
                  clients={clients}
                  workers={workers}
                  tasks={tasks}
                  onSearchResults={handleSearchResults}
                  //@ts-ignore
                  onDataModified={handleDataChange}
                  onResetSearch={handleResetSearch}
                />
              </div>
            </div>

            {/* Rule Builder */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Rule Builder</h2>
                </div>
              </div>
              <div className="p-6">
                <RuleBuilder
                  tasks={tasks}
                  clients={clients}
                  workers={workers}
                  onAddRule={handleAddRule}
                />
              </div>
            </div>

            {/* Business Rules Management */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Business Rules</h2>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {rules.length} rules
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <ValidationStatusBadge />
                <RulesTable
                  rules={rules}
                  tasks={tasks}
                  onDelete={handleDeleteRule}
                />
              </div>
            </div>

            {/* Priority Controls */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <PriorityControls onPriorityChange={setPriorities} />
              </div>
            </div>

            {/* Export Configuration */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Export Configuration</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <button
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        exportFormat === 'json' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setExportFormat('json')}
                    >
                      <FileJson size={18} />
                      <span>JSON</span>
                    </button>
                    <button
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                        exportFormat === 'csv' 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setExportFormat('csv')}
                    >
                      <FileSpreadsheet size={18} />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter filename..."
                  />
                </div>

                <button
                  onClick={async () => {
                    setIsExporting(true);
                    toast.info('Preparing export...');
                    
                    try {
                      const data = prepareExportData();
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      exportToFile(data);
                      toast.success('Export completed successfully');
                    } catch (error) {
                      console.error('Export error:', error);
                      toast.error('Failed to export configuration');
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  disabled={
                    isExporting ||
                    Object.keys(validationErrors).length > 0 ||
                    validationSummary.invalid > 0
                  }
                  className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2 transition-colors ${
                    isExporting
                      ? 'bg-blue-400 text-white'
                      : Object.keys(validationErrors).length > 0 || validationSummary.invalid > 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Export Configuration</span>
                    </>
                  )}
                </button>

                {(Object.keys(validationErrors).length > 0 || validationSummary.invalid > 0) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm text-center">
                      {Object.keys(validationErrors).length > 0 && (
                        <span>{Object.keys(validationErrors).length} data errors</span>
                      )}
                      {validationSummary.invalid > 0 && (
                        <span>
                          {Object.keys(validationErrors).length > 0 ? ' and ' : ''}
                          {validationSummary.invalid} invalid rules
                        </span>
                      )}
                      {' '}must be fixed before exporting
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

