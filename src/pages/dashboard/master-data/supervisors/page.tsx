'use client';

import { useState, useEffect } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CRUDTable } from '@/components/CRUDTable';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supervisorsAPI } from '@/services/api';
import { toast } from 'sonner';

interface Supervisor {
  id: number;
  documentId: string;
  namasupervisor: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}



interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function SupervisorsPage() {
  const [data, setData] = useState<Supervisor[]>([]);

  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 50,
    pageCount: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supervisor | null>(null);
  const [formData, setFormData] = useState<Partial<Supervisor>>({
    namasupervisor: '',
  });

  // Fetch data from API
  const fetchData = async (page = 1, pageSize = 50, search = '') => {
    try {
      setLoading(true);
      const supervisorsResponse = await supervisorsAPI.find({
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        ...(search && { 'filters[namasupervisor][$containsi]': search }),
      });
      setData(supervisorsResponse.data || []);


      // Update pagination metadata from response
      if (supervisorsResponse.meta?.pagination) {
        setPagination(supervisorsResponse.meta.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load supervisors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 50, '');
  }, []);

  const columns: MRT_ColumnDef<Supervisor>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      Cell: ({ row }) => <Badge variant="outline">{row.original.id}</Badge>,
    },
    {
      accessorKey: 'namasupervisor',
      header: 'Name',
      Cell: ({ row }) => (
        <div className="font-medium">{row.original.namasupervisor}</div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      Cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="text-sm text-gray-600">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
  ];

  const handleAdd = () => {
    setFormData({
      namasupervisor: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: Supervisor) => {
    setEditingItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };


  const handleSave = async () => {
    try {
      if (editingItem) {
        // Edit existing item
        const dataToUpdate = {
          namasupervisor: formData.namasupervisor,
        };
        await supervisorsAPI.update(
          editingItem.documentId,
          dataToUpdate
        );
        toast.success('Supervisor updated successfully');
      } else {
        // Add new item
        await supervisorsAPI.create(formData);
        toast.success('Supervisor created successfully');
      }
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      setEditingItem(null);
      fetchData(pagination.page, pagination.pageSize, searchTerm); // Refetch data
    } catch (error) {
      console.error('Failed to save supervisor:', error);
      toast.error('Failed to save supervisor');
    }
  };

  const handleDelete = async (item: Supervisor) => {
    if (!confirm(`Are you sure you want to delete "${item.namasupervisor}"?`)) {
      return;
    }

    try {
      await supervisorsAPI.delete(item.documentId);
      toast.success('Supervisor deleted successfully');
      fetchData(pagination.page, pagination.pageSize, searchTerm);
    } catch (error) {
      console.error('Failed to delete supervisor:', error);
      toast.error('Failed to delete supervisor');
    }
  };

  const handlePageChange = (page: number) => {
    fetchData(page, pagination.pageSize, searchTerm);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchData(1, pageSize, searchTerm); // Reset to page 1 when changing page size
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    fetchData(1, pagination.pageSize, search); // Reset to page 1 when searching
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <CRUDTable
            data={data}
            columns={columns}
            title="Supervisors (SPV)"
            description="Manage sales supervisors"
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search supervisors by name..."
            addButtonText="Add Supervisor"
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            isLoading={loading}
          />

          {/* Add/Edit Dialog */}
          <Dialog
            open={isAddDialogOpen || isEditDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingItem(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Supervisor' : 'Add New Supervisor'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the supervisor information below.'
                    : 'Fill in the details for the new supervisor.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="namasupervisor">Supervisor Name</Label>
                  <Input
                    id="namasupervisor"
                    value={formData.namasupervisor || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, namasupervisor: e.target.value })
                    }
                    placeholder="e.g., ASEP SOPYAN"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setIsEditDialogOpen(false);
                      setEditingItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingItem ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
