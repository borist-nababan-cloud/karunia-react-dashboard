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
import { vehicleGroupsAPI } from '@/services/api';
import { toast } from 'sonner';

interface VehicleGroup {
  id: number;
    name: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: { username?: string; email?: string; full_name?: string };
  publishedAt: string;
}



interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function VehicleGroupsPage() {
  const [data, setData] = useState<VehicleGroup[]>([]);

  const [loading, setLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VehicleGroup | null>(null);
  const [formData, setFormData] = useState<Partial<VehicleGroup>>({
    name: '',
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);

      const vehicleGroupsResponse = await vehicleGroupsAPI.findAll();

      const vehicleGroupsData = vehicleGroupsResponse.data || [];

      setData(vehicleGroupsData);
    } catch (error) {
      console.error('Failed to load vehicle groups:', error);
      toast.error('Failed to load vehicle groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: MRT_ColumnDef<VehicleGroup>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      Cell: ({ row }) => <Badge variant="outline">{row.original.id}</Badge>,
    },
    {
      accessorKey: 'name',
      header: 'Vehicle Group',
      Cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      Cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div className="text-sm text-gray-600">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_by_profile.username',
      header: 'Created By',
      Cell: ({ row }) => {
        const profile = row.original.created_by_profile;
        const displayName = profile ? (profile.full_name || profile.username || profile.email) : null;
        return (
          <div className="text-sm text-gray-600">
            {displayName || '-'}
          </div>
        );
      },
    },
  ];

  const handleAdd = () => {
    setFormData({
      name: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: VehicleGroup) => {
    setEditingItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };


  const handleSave = async () => {
    try {
      if (editingItem) {
        // Edit existing item
        const dataToUpdate = {
          name: formData.name,
        };
        await vehicleGroupsAPI.update(
          editingItem.id,
          dataToUpdate
        );
        toast.success('Vehicle group updated successfully');
      } else {
        // Add new item
        await vehicleGroupsAPI.create(formData);
        toast.success('Vehicle group created successfully');
      }
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      setEditingItem(null);
      fetchData(); // Refetch data
    } catch (error) {
      console.error('Failed to save vehicle group:', error);
      toast.error('Failed to save vehicle group');
    }
  };

  const handleDelete = async (item: VehicleGroup) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await vehicleGroupsAPI.delete(item.id);
      toast.success('Vehicle group deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete vehicle group:', error);
      toast.error('Failed to delete vehicle group');
    }
  };


  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <CRUDTable
            data={data}
            columns={columns}
            title="Vehicle Groups"
            description="Manage vehicle categories and groups"
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search vehicle groups by name..."
            addButtonText="Add Vehicle Group"
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
                  {editingItem
                    ? 'Edit Vehicle Group'
                    : 'Add New Vehicle Group'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the vehicle group information below.'
                    : 'Fill in the details for the new vehicle group.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vehicle Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., ALL NEW XENIA"
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
