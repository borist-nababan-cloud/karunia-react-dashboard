'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { vehicleTypesAPI, vehicleGroupsAPI } from '@/services/api';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

interface VehicleType {
  id: number;
  documentId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  vehicle_group: string | null | { documentId: string; name: string };
}

interface VehicleGroupData {
  id: number;
  documentId: string;
  name: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function VehicleTypesPage() {
  const [data, setData] = useState<VehicleType[]>([]);
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroupData[]>([]);
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
  const [editingItem, setEditingItem] = useState<VehicleType | null>(null);
  const [formData, setFormData] = useState<Partial<VehicleType>>({
    name: '',
    vehicle_group: null,
  });

  const fetchData = useCallback(async (page = 1, pageSize = 50, search = '') => {
    try {
      setLoading(true);
      const [vehicleTypesResponse, vehicleGroupsResponse] = await Promise.all([
        vehicleTypesAPI.find({
          'pagination[page]': page,
          'pagination[pageSize]': pageSize,
          ...(search && { 'filters[name][$containsi]': search }),
        }),
        vehicleGroupsAPI.find(),
      ]);

      setData(vehicleTypesResponse.data || []);
      setVehicleGroups(vehicleGroupsResponse.data || []);

      // Update pagination metadata from response
      if (vehicleTypesResponse.meta?.pagination) {
        setPagination(vehicleTypesResponse.meta.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - fetchData is stable

  useEffect(() => {
    fetchData(1, 50, '');
  }, [fetchData]);

  const columns: MRT_ColumnDef<VehicleType>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      Cell: ({ row }) => <Badge variant="outline">{row.original.id}</Badge>,
    },
    {
      accessorKey: 'name',
      header: 'Vehicle Type',
      Cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'vehicle_group',
      header: 'Vehicle Group',
      Cell: ({ row }) => {
        const group = row.original.vehicle_group;
        const displayValue = typeof group === 'object' && group !== null
          ? group.name
          : group;

        return (
          <div className="font-medium">{displayValue || '-'}</div>
        );
      },
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
      name: '',
      vehicle_group: null,
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: VehicleType) => {
    setEditingItem(item);
    // Handle vehicle_group which might be an object or string
    const vehicleGroupValue = typeof item.vehicle_group === 'object' && item.vehicle_group !== null
      ? item.vehicle_group.name
      : item.vehicle_group;

    setFormData({
      ...item,
      vehicle_group: vehicleGroupValue
    });
    setIsEditDialogOpen(true);
  };


  const handleSave = async () => {
    try {
      const dataToSave = {
        name: formData.name,
        vehicle_group: formData.vehicle_group,
      };

      if (editingItem) {
        await vehicleTypesAPI.update(
          editingItem.documentId,
          dataToSave
        );
        toast.success('Vehicle type updated successfully');
      } else {
        await vehicleTypesAPI.create(dataToSave);
        toast.success('Vehicle type created successfully');
      }
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      setEditingItem(null);
      // Refresh current page data
      fetchData(pagination.page, pagination.pageSize, searchTerm);
    } catch (error) {
      console.error('Failed to save vehicle type:', error);
      toast.error('Failed to save vehicle type');
    }
  };

  const handleDelete = async (item: VehicleType) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await vehicleTypesAPI.delete(item.documentId);
      toast.success('Vehicle type deleted successfully');
      // Refresh current page data
      fetchData(pagination.page, pagination.pageSize, searchTerm);
    } catch (error) {
      console.error('Failed to delete vehicle type:', error);
      toast.error('Failed to delete vehicle type');
    }
  };

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, pagination.pageSize, searchTerm);
  }, [fetchData, pagination.pageSize, searchTerm]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    fetchData(1, pageSize, searchTerm); // Reset to page 1 when changing page size
  }, [fetchData, searchTerm]);

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    fetchData(1, pagination.pageSize, search); // Reset to page 1 when searching
  }, [fetchData, pagination.pageSize]);

  const vehicleGroupOptions = vehicleGroups.map((group) => ({
    label: group.name,
    value: group.name,
  }));

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <CRUDTable
            data={data}
            columns={columns}
            title="Vehicle Types"
            description="Manage all vehicle types and models"
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search vehicle types by name..."
            addButtonText="Add Vehicle Type"
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            isLoading={loading}
          />

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
                  {editingItem ? 'Edit Vehicle Type' : 'Add New Vehicle Type'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the vehicle type information below.'
                    : 'Fill in the details for the new vehicle type.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vehicle Type Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., TERIOS R AT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_group">Vehicle Group</Label>
                  <Combobox
                    options={vehicleGroupOptions}
                    value={typeof formData.vehicle_group === 'string' ? formData.vehicle_group : ''}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, vehicle_group: value }));
                    }}
                    placeholder="Select vehicle group..."
                    searchPlaceholder="Search groups..."
                    noResultsMessage="No groups found."
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
