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
import { supervisorsAPI, userProfilesAPI } from '@/services/api';
import { toast } from 'sonner';

interface Supervisor {
  id: number;
    namasupervisor: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: { username?: string; email?: string; full_name?: string };
  publishedAt: string;
  user_auth_id?: string | null;
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

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supervisor | null>(null);
  const [formData, setFormData] = useState<Partial<Supervisor>>({
    namasupervisor: '',
    user_auth_id: null,
  });

  const [profiles, setProfiles] = useState<any[]>([]);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const supervisorsResponse = await supervisorsAPI.findAll();
      setData(supervisorsResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load supervisors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await userProfilesAPI.getEligibleUsersForSupervisors();
      setProfiles(res.data || []);
    } catch (err) {
      console.error('Failed to load user profiles:', err);
    }
  };

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
      namasupervisor: '',
      user_auth_id: null,
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
          user_auth_id: formData.user_auth_id,
        };
        await supervisorsAPI.update(
          editingItem.id,
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
      fetchData(); // Refetch data
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
      await supervisorsAPI.delete(item.id);
      toast.success('Supervisor deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete supervisor:', error);
      toast.error('Failed to delete supervisor');
    }
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

                <div className="space-y-2">
                  <Label htmlFor="user_auth_id">Linked Auth Profile</Label>
                  <select
                    id="user_auth_id"
                    value={formData.user_auth_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, user_auth_id: e.target.value || null })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- No Profile Linked --</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || p.username || p.email}</option>
                    ))}
                  </select>
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
