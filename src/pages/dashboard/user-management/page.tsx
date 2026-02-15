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
import { salesProfilesAPI, supervisorsAPI } from '@/services/api';
import { toast } from 'sonner';


interface SalesProfile {
  id: number;
  documentId: string;
  sales_uid: string;
  email: string;
  surename: string;
  address: string;
  city: string;
  province: string;
  phonenumber: string;
  wanumber: string;
  namasupervisor: string;
  approved: boolean;
  photo_profile: string | null;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface Supervisor {
  id: number;
  documentId: string;
  namasupervisor: string;
}

export default function UserManagementPage() {

  const [data, setData] = useState<SalesProfile[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesProfile | null>(null);
  const [formData, setFormData] = useState<Partial<SalesProfile>>({
    approved: false,
    blocked: false,
    namasupervisor: '',
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesProfilesResponse, supervisorsResponse] = await Promise.all([
        // Fetch all records using recursive strategy
        salesProfilesAPI.findAll(),
        supervisorsAPI.findAll()
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

  const columns: MRT_ColumnDef<SalesProfile>[] = [
    {
      accessorKey: 'sales_uid',
      header: 'Sales ID',
      Cell: ({ row }) => (
        <div className="font-medium">{row.original.sales_uid}</div>
      ),
    },
    {
      accessorKey: 'surename',
      header: 'Full Name',
      Cell: ({ row }) => (
        <div className="text-sm">{row.original.surename || '-'}</div>
      ),
    },
    {
      accessorKey: 'namasupervisor',
      header: 'Supervisor',
      Cell: ({ row }) => (
        <div className="text-sm">{row.original.namasupervisor || '-'}</div>
      ),
    },
    {
      accessorKey: 'approved',
      header: 'Status',
      Cell: ({ row }) => (
        <StatusBadge
          approved={row.original.approved}
          blocked={row.original.blocked}
        />
      ),
    },
  ];

  const handleEdit = (item: SalesProfile) => {
    setEditingItem(item);
    setFormData({
      approved: item.approved,
      blocked: item.blocked,
      namasupervisor: item.namasupervisor || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      await salesProfilesAPI.update(editingItem.documentId, {
        approved: formData.approved,
        blocked: formData.blocked,
        namasupervisor: formData.namasupervisor,
      });

      setData(data.map(item =>
        item.documentId === editingItem.documentId
          ? { ...item, ...formData }
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Profile Management</h1>
            <p className="text-gray-600 mt-2">
              Manage sales profiles - Only supervisor, approval status, and blocked status can be edited
            </p>
          </div>

          <CRUDTable
            data={data}
            columns={columns}
            title="Sales Profiles"
            description="Sales profiles - Dashboard access management"
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
                <DialogTitle>Edit Sales Profile - {editingItem?.surename}</DialogTitle>
                <DialogDescription>
                  Only the following fields can be edited: Supervisor, Approved Status, and Blocked Status.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Read-only fields */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Sales ID</Label>
                    <p className="text-sm font-mono">{editingItem?.sales_uid}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm font-mono">{editingItem?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-sm">{editingItem?.surename}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="text-sm">{editingItem?.phonenumber || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">WhatsApp</Label>
                    <p className="text-sm">{editingItem?.wanumber || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="text-sm">{editingItem?.address || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">City</Label>
                    <p className="text-sm">{editingItem?.city || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created</Label>
                    <p className="text-sm">
                      {editingItem?.createdAt ? new Date(editingItem.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="namasupervisor">Supervisor</Label>
                    <Select
                      value={formData.namasupervisor || '__none__'}
                      onValueChange={(value) => setFormData({ ...formData, namasupervisor: value === '__none__' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No Supervisor</SelectItem>
                        {supervisors.map((supervisor) => (
                          <SelectItem key={supervisor.documentId} value={supervisor.namasupervisor}>
                            {supervisor.namasupervisor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="approved"
                        checked={formData.approved}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, approved: checked })
                        }
                      />
                      <Label htmlFor="approved" className="text-sm font-medium">
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

                <div className="flex justify-end space-x-2 pt-4 border-t">
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
                    Update Sales Profile
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