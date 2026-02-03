'use client';


import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Box } from '@mui/material';

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface CRUDTableProps<TData extends Record<string, any>> {
  data: TData[];
  columns: MRT_ColumnDef<TData>[];
  title: string;
  description: string;
  onAdd?: () => void;
  onEdit?: (item: TData) => void;
  onDelete?: (item: TData) => void;
  searchPlaceholder?: string;
  addButtonText?: string;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (searchTerm: string) => void;
  isLoading?: boolean;
}

export const CRUDTable = <TData extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  onAdd,
  onEdit,
  onDelete,
  addButtonText = "Add New",
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  isLoading = false,
}: CRUDTableProps<TData>) => {

  const table = useMaterialReactTable({
    columns,
    data,
    rowCount: pagination?.total ?? data.length,
    state: {
      isLoading,
      ...(pagination && {
        pagination: {
          pageIndex: pagination.page - 1,
          pageSize: pagination.pageSize,
        },
      }),
    },
    manualPagination: !!pagination,
    onPaginationChange: (updater) => {
      if (!onPageChange || !onPageSizeChange || !pagination) return;
      const newPagination = typeof updater === 'function'
        ? updater({
          pageIndex: pagination.page - 1,
          pageSize: pagination.pageSize,
        })
        : updater;

      if (newPagination.pageSize !== pagination.pageSize) {
        onPageSizeChange(newPagination.pageSize);
      }
      if (newPagination.pageIndex !== pagination.page - 1) {
        onPageChange(newPagination.pageIndex + 1);
      }
    },
    manualFiltering: !!onSearchChange,
    onGlobalFilterChange: (updater) => {
      if (onSearchChange && typeof updater === 'string') {
        onSearchChange(updater);
      }
    },
    enableRowActions: !!onEdit || !!onDelete,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '8px' }}>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.original)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </Box>
    ),
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: '1rem', p: '4px' }}>
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </Box>
    ),
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>

      <MaterialReactTable table={table} />
    </div>
  );
};

