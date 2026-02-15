'use client';

import { useState, useEffect } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CRUDTable } from '@/components/CRUDTable';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import GoogleMapsSelector from '@/components/GoogleMapsSelector';
import { branchesAPI } from '@/services/api';
import { toast } from 'sonner';

interface Branch {
  id: number;
  documentId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  city: string | null;
  province: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function BranchesPage() {
  const [data, setData] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({
    name: '',
    address: '',
    city: '',
    province: '',
    phone_number: '',
    whatsapp_number: '',
    latitude: 0,
    longitude: 0,
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await branchesAPI.findAll();
      setData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: MRT_ColumnDef<Branch>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      Cell: ({ row }) => <Badge variant="outline">{row.original.id}</Badge>,
    },
    {
      accessorKey: 'name',
      header: 'Branch Name',
      Cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      Cell: ({ row }) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {row.original.address}
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'City',
      Cell: ({ row }) => (
        <div className="text-sm">{row.original.city || '-'}</div>
      ),
    },
    {
      accessorKey: 'phone_number',
      header: 'Phone',
      Cell: ({ row }) => (
        <div className="text-sm">{row.original.phone_number || '-'}</div>
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
      name: '',
      address: '',
      city: '',
      province: '',
      phone_number: '',
      whatsapp_number: '',
      latitude: 0,
      longitude: 0,
    });
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Branch) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };


  const handleSave = async () => {
    try {
      if (editingItem) {
        // Edit existing item
        const dataToUpdate = {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          phone_number: formData.phone_number,
          whatsapp_number: formData.whatsapp_number,
          latitude: formData.latitude,
          longitude: formData.longitude,
        };
        await branchesAPI.update(
          editingItem.documentId,
          dataToUpdate
        );
        toast.success('Branch updated successfully');
      } else {
        // Add new item
        await branchesAPI.create(formData);
        toast.success('Branch created successfully');
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      fetchData(); // Refetch data
    } catch (error) {
      console.error('Failed to save branch:', error);
      toast.error('Failed to save branch');
    }
  };

  const handleDelete = async (item: Branch) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await branchesAPI.delete(item.documentId);
      toast.success('Branch deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete branch:', error);
      toast.error('Failed to delete branch');
    }
  };


  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <CRUDTable
            data={data}
            columns={columns}
            title="Branches"
            description="Manage all branch locations and information"
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search branches by name..."
            addButtonText="Add Branch"
            isLoading={loading}
          />

          {/* Add/Edit Dialog */}
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setIsDialogOpen(false);
                setEditingItem(null);
              }
            }}
          >
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Branch' : 'Add New Branch'}
                </DialogTitle>
                <DialogDescription>
                  Fill in the branch details and select location on the map
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., KARUNIA SURABAYA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="e.g., Surabaya"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      value={formData.province || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, province: e.target.value })
                      }
                      placeholder="e.g., Jawa Timur"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_number: e.target.value,
                        })
                      }
                      placeholder="e.g., (021) 8901234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      value={formData.whatsapp_number || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsapp_number: e.target.value,
                        })
                      }
                      placeholder="e.g., 0812-3456-7890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Branch Location</Label>
                  <GoogleMapsSelector
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationChange={(lat, lng) =>
                      setFormData({ ...formData, latitude: lat, longitude: lng })
                    }
                    height="500px"
                    showSearch={true}
                    disabled={false}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
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
