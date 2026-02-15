'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSpkData } from '@/hooks/useSpkData';
import { toast } from 'sonner';
import { MoreHorizontal, FileText, Download, Eye, CheckCircle, Clock, Edit3, FileDown, IdCard, Users, RefreshCw } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import SpkPdfDocument from '@/components/SpkPdfDocument';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Box } from '@mui/material';

// Strapi Media upload type
interface StrapiMedia {
  id: number;
  name: string;
  url: string;
  mime: string;
  size: number;
}

interface SPK {
  id: number;
  documentId: string;
  noSPK: string;
  tanggal: string;
  pekerjaanCustomer: string;
  namaCustomer: string;
  namaDebitur: string;
  alamatCustomer: string;
  noTeleponCustomer: string;
  emailcustomer: string | null;
  kotacustomer: string | null;
  finish: boolean;
  editable: boolean;
  ktpPaspor?: StrapiMedia | null;
  kartuKeluarga?: StrapiMedia | null;
  selfie?: StrapiMedia | null;
  salesProfile: {
    id: number;
    documentId: string;
    surename: string;
    namasupervisor: string;
    email: string;
    phonenumber: string;
    city: string;
    address: string;
  };
  detailInfo?: {
    namaBpkbStnk: string;
    kotaStnkBpkb: string;
    alamatBpkbStnk: string;
  };
  unitInfo?: {
    noRangka: string;
    noMesin: string;
    tahun: string;
    hargaOtr: number;
    vehicleType?: {
      name: string;
    };
    color?: {
      colorname: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export default function SpkManagementPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSpk, setEditingSpk] = useState<SPK | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for edit
  const [formData, setFormData] = useState({
    finish: false,
    editable: false,
  });

  // Track if component is mounted to prevent initial render updates


  // Use custom hook for SPK data with React Query
  /* 
    Use "Fetch All" strategy for robust client-side pagination, sorting, and filtering.
    This guarantees that "Rows per Page" and other features work consistently.
  */
  const {
    spks,
    loading,
    error,
    refetch,
    // pagination, // Not needed for client-side
    // setPage,
    // setPageSize,
    // setSort,
    // setFilter,
    updateSpk,
  } = useSpkData({
    page: 1,
    pageSize: -1, // Fetch All
    sortField: 'createdAt',
    sortOrder: 'desc',
  });

  const table = useMaterialReactTable({
    columns,
    data: spks,
    // Client-side mode (default)
    enablePagination: true,
    enableSorting: true,
    enableFiltering: true,
    state: {
      isLoading: loading,
    },
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: 'createdAt', desc: true }],
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      },
    },
    enableRowActions: true,
    renderRowActions: ({ row }) => {
      const spk = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditSpk(spk)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handlePreviewPdf(spk)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadPdf(spk)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDownloadKtp(spk)} disabled={!spk.ktpPaspor}>
              <IdCard className="mr-2 h-4 w-4" />
              Download KTP
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadKk(spk)} disabled={!spk.kartuKeluarga}>
              <Users className="mr-2 h-4 w-4" />
              Download KK
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadSelfie(spk)} disabled={!spk.selfie}>
              <FileDown className="mr-2 h-4 w-4" />
              Download Other
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSpks = pagination.total;
    const finishedSpks = spks.filter(s => s.finish).length;
    const progressSpks = spks.filter(s => !s.finish).length;
    return { totalSpks, finishedSpks, progressSpks };
  }, [pagination.total, spks]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SPK Management</h1>
              <p className="text-gray-600">Manage vehicle orders and generate PDF documents</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total SPK</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSpks}</div>
                <p className="text-xs text-muted-foreground">Last 2 months</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.progressSpks}</div>
                <p className="text-xs text-muted-foreground">Active orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finished</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.finishedSpks}</div>
                <p className="text-xs text-muted-foreground">Completed orders</p>
              </CardContent>
            </Card>
          </div>

          {/* SPK Table - MRT */}
          <Card>
            <CardHeader>
              <CardTitle>SPK List</CardTitle>
              <CardDescription>
                {pagination.total} total records • Page {pagination.page} of {pagination.pageCount}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="text-red-500 text-sm">
                    {error instanceof Error ? error.message : 'Failed to load SPK data'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : (
                <MaterialReactTable table={table} />
              )}
            </CardContent>
          </Card>

          {/* Edit SPK Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit SPK Status</DialogTitle>
                <DialogDescription>
                  Update SPK finish and editable status. Other fields are read-only.
                </DialogDescription>
              </DialogHeader>

              {editingSpk && (
                <div className="space-y-6">
                  {/* Read-only fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>No SPK</Label>
                      <Input value={editingSpk.noSPK} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal</Label>
                      <Input value={new Date(editingSpk.tanggal).toLocaleDateString('id-ID')} disabled />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>No Telepon Customer</Label>
                      <Input value={editingSpk.noTeleponCustomer} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Customer</Label>
                      <Input value={editingSpk.emailcustomer || '-'} disabled />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Sales</Label>
                      <Input value={editingSpk.salesProfile?.surename || '-'} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Supervisor</Label>
                      <Input value={editingSpk.salesProfile?.namasupervisor || '-'} disabled />
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="editable">Editable</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="editable"
                          checked={formData.editable}
                          onCheckedChange={(checked) => handleInputChange('editable', checked)}
                        />
                        <Label htmlFor="editable" className="text-sm">
                          {formData.editable ? 'Editable' : 'Not Editable'}
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finish">Finish</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="finish"
                          checked={formData.finish}
                          onCheckedChange={(checked) => handleInputChange('finish', checked)}
                        />
                        <Label htmlFor="finish" className="text-sm">
                          {formData.finish ? 'Finished' : 'In Progress'}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateSpk}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update SPK'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
