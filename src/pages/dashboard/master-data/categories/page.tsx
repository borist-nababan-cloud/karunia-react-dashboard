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
import { categoriesAPI } from '@/services/api';
import { toast } from 'sonner';

interface Category {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
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
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    status: 'active',
  });

  // Fetch data from API
  const fetchData = async (page = 1, pageSize = 50, search = '') => {
    try {
      setLoading(true);
      const response = await categoriesAPI.find({
        'pagination[page]': page,
        'pagination[pageSize]': pageSize,
        ...(search && { 'filters[name][$containsi]': search }),
      });
      setData(response.data || []);

      // Update pagination metadata from response
      if (response.meta?.pagination) {
        setPagination(response.meta.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 50, '');
  }, []);

  const columns: MRT_ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: 'Category Name',
      Cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      Cell: ({ row }) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {row.original.description || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      Cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'active' ? 'default' : 'secondary'
          }
        >
          {row.original.status}
        </Badge>
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
      description: '',
      status: 'active',
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: Category) => {
    setEditingItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (item: Category) => {
    if (
      window.confirm(`Are you sure you want to delete ${item.name} category?`)
    ) {
      try {
        await categoriesAPI.delete(item.documentId);
        toast.success('Category deleted successfully');
        fetchData(pagination.page, pagination.pageSize, searchTerm);
      } catch (error) {
        console.error('Failed to delete category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      if (editingItem) {
        // Edit existing item
        const dataToUpdate = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
        };
        await categoriesAPI.update(
          editingItem.documentId,
          dataToUpdate
        );
        toast.success('Category updated successfully');
      } else {
        // Add new item
        await categoriesAPI.create(formData);
        toast.success('Category created successfully');
      }
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      setEditingItem(null);
      fetchData(pagination.page, pagination.pageSize, searchTerm);
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('Failed to save category');
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
            title="Categories"
            description="Manage vehicle categories"
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search categories by name..."
            addButtonText="Add Category"
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
                  {editingItem ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update the category information below.'
                    : 'Fill in the details for the new category.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Scooter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="e.g., Automatic scooter motorcycles"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Button onClick={handleSave} disabled={!formData.name}>
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
