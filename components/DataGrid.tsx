import { useEffect, useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table';
import { EntityType, DataEntity, Client, Worker, Task } from '@/lib/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, AlertCircle, Wand2, Edit3 } from 'lucide-react';

interface DataGridProps {
    data: DataEntity[];
    entityType: EntityType;
    onDataChange: (newData: DataEntity[]) => void;
    validationErrors: Record<string, string[]>;
    onAutoFix?: (rowId: string, field: string) => void;
    className?: string;
}

// Type guards
function isClient(entity: DataEntity): entity is Client {
    return 'ClientID' in entity;
}

function isWorker(entity: DataEntity): entity is Worker {
    return 'WorkerID' in entity;
}

function isTask(entity: DataEntity): entity is Task {
    return 'TaskID' in entity;
}

export const DataGrid = ({ 
    data, 
    entityType, 
    onDataChange, 
    validationErrors,
    onAutoFix,
    className 
}: DataGridProps) => {
    const [editedData, setEditedData] = useState([...data]);
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null);

    // Sync with parent data changes
    useEffect(() => {
        setEditedData([...data]);
    }, [data]);

    const handleCellChange = (rowId: string, key: string, value: any) => {
        const newData = editedData.map(row => {
            if (isClient(row)) {
                if (row.ClientID === rowId) return { ...row, [key]: value };
            } else if (isWorker(row)) {
                if (row.WorkerID === rowId) return { ...row, [key]: value };
            } else if (isTask(row)) {
                if (row.TaskID === rowId) return { ...row, [key]: value };
            }
            return row;
        });
        setEditedData(newData);
        onDataChange(newData);
    };

    const getRowId = (entity: DataEntity): string => {
        if (isClient(entity)) return entity.ClientID;
        if (isWorker(entity)) return entity.WorkerID;
        if (isTask(entity)) return entity.TaskID;
        return '';
    };

    const columns = useMemo<ColumnDef<DataEntity>[]>(() => {
        if (data.length === 0) return [];

        const sampleItem = data[0];
        return Object.keys(sampleItem).map(key => ({
            enableSorting: true,
            accessorKey: key,
            header: ({ column }) => (
                <div className="flex items-center gap-2 px-2 py-1">
                    <span className="font-semibold text-gray-700">{key}</span>
                    <button
                        onClick={() => column.toggleSorting()}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                        {column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                            <ChevronDown className="w-4 h-4 opacity-30" />
                        )}
                    </button>
                </div>
            ),
            cell: ({ row, getValue }) => {
                const value = getValue();
                const rowId = getRowId(row.original);
                const errors = validationErrors[rowId] || [];
                const hasError = errors.some(error => error.includes(key));
                const cellKey = `${rowId}-${key}`;
                const isEditing = editingCell?.rowId === rowId && editingCell?.field === key;

                const isJsonField = key.toLowerCase().includes('json') || 
                                   key === 'AttributesJSON' || 
                                   key === 'RequiredSkills' || 
                                   key === 'Skills';

                const handleValueChange = (newValue: string) => {
                    let processedValue = newValue;
                    if (isJsonField) {
                        try {
                            // Try to parse and format JSON
                            const parsed = JSON.parse(newValue);
                            processedValue = JSON.stringify(parsed, null, 2);
                        } catch (e) {
                            // If not valid JSON, keep as is for user to fix
                            processedValue = newValue;
                        }
                    }
                    handleCellChange(rowId, key, processedValue);
                };

                const handleCellClick = () => {
                    setEditingCell({ rowId, field: key });
                };

                const handleBlur = () => {
                    setEditingCell(null);
                };

                const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        setEditingCell(null);
                    }
                    if (e.key === 'Escape') {
                        setEditingCell(null);
                    }
                };

                // Always render as editable input/textarea
                return (
                    <div className="relative group min-w-[120px]">
                        <div className={`relative ${hasError ? 'ring-2 ring-red-300' : ''} rounded`}>
                            {isJsonField ? (
                                <textarea
                                    value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                                    onChange={(e) => handleValueChange(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    className={`
                                        w-full min-h-[80px] p-2 text-sm font-mono resize-y
                                        border border-gray-300 rounded-md
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                        hover:border-gray-400 transition-colors
                                        bg-white
                                        ${hasError ? 'border-red-400 bg-red-50' : ''}
                                    `}
                                    placeholder="Enter JSON data..."
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={String(value || '')}
                                    onChange={(e) => handleValueChange(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    className={`
                                        w-full p-2 text-sm
                                        border border-gray-300 rounded-md
                                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                        hover:border-gray-400 transition-colors
                                        bg-white
                                        ${hasError ? 'border-red-400 bg-red-50' : ''}
                                    `}
                                    placeholder={`Enter ${key}...`}
                                />
                            )}
                        </div>

                        {/* Error indicator */}
                        {hasError && (
                            <div className="absolute -top-1 -right-1">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                        )}

                        {/* Auto-fix button */}
                        {hasError && onAutoFix && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors shadow-sm border border-blue-200"
                                onClick={() => onAutoFix(rowId, key)}
                                title="Auto-fix this field"
                            >
                                <Wand2 className="w-3 h-3 text-blue-600" />
                            </motion.button>
                        )}

                        {/* Error tooltip */}
                        {hasError && (
                            <div className="absolute bottom-full left-0 mb-1 p-2 bg-red-600 text-white text-xs rounded shadow-lg z-10 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {errors.find(error => error.includes(key))}
                            </div>
                        )}
                    </div>
                );
            },
        }));
    }, [data, editedData, validationErrors, editingCell, onAutoFix]);

    const table = useReactTable({
        data: editedData,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        //@ts-ignore
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
    });

    return (
        <div className={`space-y-4 ${className || ''}`}>
            {/* Search bar */}
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(String(e.target.value))}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search all fields..."
                />
            </div>

            {/* Table container */}
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <AnimatePresence>
                            {table.getRowModel().rows.map((row, index) => (
                                <motion.tr
                                    key={row.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td 
                                            key={cell.id} 
                                            className="px-4 py-3 border-r border-gray-100 last:border-r-0 align-top"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>

                {/* Empty state */}
                {data.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-2">
                            <Search className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
                        <p className="text-gray-500">Please upload data files to get started.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {data.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length
                            )}{' '}
                            of {table.getFilteredRowModel().rows.length} results
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};