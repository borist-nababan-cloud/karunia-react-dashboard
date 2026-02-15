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
import { colorsAPI } from '@/services/api';
import { toast } from 'sonner';

interface Color {
  id: number;
  documentId: string;
  colorname: string;
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

export default function ColorsPage() {
  const [data, setData] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Color | null>(null);
  const [formData, setFormData] = useState<Partial<Color>>({
    colorname: '',
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await colorsAPI.findAll();
      const colorsData = response.data || [];
      setData(colorsData);
    } catch (error) {
      console.error('Failed to load colors:', error);
      toast.error('Failed to load colors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: MRT_ColumnDef<Color>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      Cell: ({ row }) => <Badge variant="outline">{row.original.id}</Badge>,
    },
    {
      accessorKey: 'colorname',
      header: 'Color Name',
      Cell: ({ row }) => (
        <div className="font-medium">{row.original.colorname}</div>
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
      colorname: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: Color) => {
    setEditingItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        const dataToUpdate = {
          colorname: formData.colorname,
        };
        await colorsAPI.update(
          editingItem.documentId,
          dataToUpdate
        );
        toast.success('Color updated successfully');
      } else {
        await colorsAPI.create(formData);
        toast.success('Color created successfully');
      }
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      setEditingItem(null);
      fetchData(); // Refetch data
    } catch (error) {
      console.error('Failed to save color:', error);
      toast.error('Failed to save color');
    }
  };

  const handleDelete = async (item: Color) => {
    if (!confirm(`Are you sure you want to delete "${item.colorname}"?`)) {
      return;
    }

    try {
      await colorsAPI.delete(item.documentId);
      toast.success('Color deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete color:', error);
      toast.error('Failed to delete color');
    }
  };


  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <CRUDTable
            data={data}
            columns={columns}
            title="Colors"
            description="Manage available vehicle colors"
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search colors by name..."
            addButtonText="Add Color"
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
                  {editingItem ? 'Edit Color' : 'Add New Color'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the color information below.'
                    : 'Fill in the details for the new color.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="colorname">Color Name</Label>
                  <Input
                    id="colorname"
                    value={formData.colorname || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, colorname: e.target.value })
                    }
                    placeholder="e.g., HIJAU METALIK"
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
