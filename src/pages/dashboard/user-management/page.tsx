'use client';

import { useState, useEffect } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CRUDTable } from '@/components/CRUDTable';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { StatusBadge } from '@/components/StatusBadge';
import { userProfilesAPI } from '@/services/api';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  supervisor_id: number | null;
  blocked: boolean;
  confirmed: boolean;
  online_stat: boolean;
  role_id: number | null;
  created_at: string;
  updated_at: string;
  supervisor?: {
    namasupervisor: string | null;
  };
}

export default function UserManagementPage() {
  const [data, setData] = useState<UserProfile[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    confirmed: false,
    blocked: false,
    supervisor_id: null,
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesProfilesResponse, supervisorsResponse] = await Promise.all([
        userProfilesAPI.findSalesProfiles(),
        userProfilesAPI.findSupervisors()
      ]);
      setData(salesProfilesResponse.data || []);
      setSupervisors(supervisorsResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load sales profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: MRT_ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      Cell: ({ row }) => (
        <div className="text-sm">{row.original.email || '-'}</div>
      ),
    },
    {
      accessorKey: 'full_name',
      header: 'Full Name',
      Cell: ({ row }) => (
        <div className="text-sm font-medium">{row.original.full_name || '-'}</div>
      ),
    },
    {
      id: 'supervisor',
      accessorFn: (row) => row.supervisor?.namasupervisor || '-',
      header: 'Supervisor',
      Cell: ({ cell }) => (
        <div className="text-sm">{cell.getValue<string>()}</div>
      ),
    },
    {
      accessorKey: 'confirmed',
      header: 'Approved',
      Cell: ({ row }) => (
        <StatusBadge
          approved={row.original.confirmed}
          blocked={row.original.blocked}
        />
      ),
    },
  ];

  const handleEdit = (item: UserProfile) => {
    setEditingItem(item);
    setFormData({
      confirmed: item.confirmed,
      blocked: item.blocked,
      supervisor_id: item.supervisor_id,
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      await userProfilesAPI.update(editingItem.id, {
        confirmed: formData.confirmed,
        blocked: formData.blocked,
        supervisor_id: formData.supervisor_id,
      });

      const updatedSupervisor = supervisors.find((s: any) => Number(s.id) === formData.supervisor_id);
      
      setData(data.map(item =>
        item.id === editingItem.id
          ? { 
              ...item, 
              ...formData, 
              supervisor: updatedSupervisor ? { namasupervisor: updatedSupervisor.namasupervisor } : undefined 
            }
          : item
      ));

      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast.success('Sales profile updated successfully');
    } catch (error) {
      console.error('Failed to update sales profile:', error);
      toast.error('Failed to update sales profile');
    }
  };

  const triggerForceReset = async () => {
    if (!editingItem) return;
    
    if (!confirm(`Are you sure you want to force password reset for ${editingItem.full_name || editingItem.email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ force_password_reset: true })
        .eq('id', editingItem.id);

      if (error) throw error;
      toast.success("User will be forced to reset password on next login.");
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to force password reset:', error);
      toast.error('Failed to force password reset');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <CRUDTable
            data={data}
            columns={columns}
            title="Sales Profiles"
            description="Manage sales profiles - Only supervisor, approval status, and blocked status can be edited"
            onEdit={handleEdit}
            searchPlaceholder="Search sales profiles..."
            addButtonText={null as any} // Disable add button - profiles register via frontend
            isLoading={loading}
          />

          {/* Edit User Dialog */}
          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setIsEditDialogOpen(false);
                setEditingItem(null);
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Sales Profile - {editingItem?.full_name || editingItem?.email}</DialogTitle>
                <DialogDescription>
                  Only the following fields can be edited: Supervisor, Approved Status, and Blocked Status.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Read-only fields */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-sm font-mono">{editingItem?.full_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm font-mono">{editingItem?.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Username</Label>
                    <p className="text-sm font-mono">{editingItem?.username || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="text-sm font-mono">{editingItem?.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">WhatsApp</Label>
                    <p className="text-sm font-mono">{editingItem?.whatsapp || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created</Label>
                    <p className="text-sm">
                      {editingItem?.created_at ? new Date(editingItem.created_at).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Supervisor</Label>
                    <div className="mt-1">
                      <Select
                        value={formData.supervisor_id ? formData.supervisor_id.toString() : '__none__'}
                        onValueChange={(value) => setFormData({ ...formData, supervisor_id: value === '__none__' ? null : Number(value) })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No Supervisor</SelectItem>
                          {supervisors.map((supervisor: any) => (
                            <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                              {supervisor.namasupervisor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="confirmed"
                        checked={formData.confirmed}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, confirmed: checked })
                        }
                      />
                      <Label htmlFor="confirmed" className="text-sm font-medium">
                        Approved
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="blocked"
                        checked={formData.blocked}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, blocked: checked })
                        }
                      />
                      <Label htmlFor="blocked" className="text-sm font-medium text-red-600">
                        Blocked
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={triggerForceReset}
                    type="button"
                  >
                    Force Reset Password
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingItem(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}