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
    pagination, // Needed for stats
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

  // Handle edit SPK
  const handleEditSpk = useCallback((spk: SPK) => {
    setEditingSpk(spk);
    setFormData({
      finish: spk.finish,
      editable: spk.editable,
    });
    setIsEditModalOpen(true);
  }, []);

  // Handle update SPK
  const handleUpdateSpk = async () => {
    if (!editingSpk) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        finish: formData.finish,
        editable: formData.editable,
      };

      await updateSpk(editingSpk.documentId, updateData);
      setIsEditModalOpen(false);
      setEditingSpk(null);
      // Refetch is automatic via React Query invalidation
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingSpk(null);
  }, []);

  // Handle form input changes
  const handleInputChange = useCallback((field: 'finish' | 'editable', value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle PDF generation - pass raw SPK data to SpkPdfDocument
  const generatePdfData = useCallback((spk: SPK) => {
    // SpkPdfDocument expects the raw SPK data structure directly
    return spk;
  }, []);

  // Handle PDF preview
  const handlePreviewPdf = useCallback(async (spk: SPK) => {
    try {
      const pdfData = generatePdfData(spk);
      const doc = <SpkPdfDocument data={pdfData} />;
      const pdfBlob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 300000);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF');
    }
  }, [generatePdfData]);

  // Handle PDF download
  const handleDownloadPdf = useCallback(async (spk: SPK) => {
    try {
      const pdfData = generatePdfData(spk);
      const doc = <SpkPdfDocument data={pdfData} />;
      const pdfBlob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SPK_${spk.noSPK}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  }, [generatePdfData]);

  // Get the Strapi base URL for media downloads
  const getStrapiBaseUrl = useCallback(() => {
    return import.meta.env.VITE_STRAPI_URL?.replace('/api', '') || '';
  }, []);

  // Generic file download handler for Strapi media
  const handleDownloadMedia = useCallback(async (media: StrapiMedia | null | undefined, fileName: string, documentType: string) => {
    if (!media) {
      toast.error(`No ${documentType} document available`);
      return;
    }

    try {
      const strapiBaseUrl = getStrapiBaseUrl();
      const mediaUrl = media.url.startsWith('http')
        ? media.url
        : `${strapiBaseUrl}${media.url}`;

      const { default: api } = await import('@/services/api');
      const response = await api.get(mediaUrl, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: media.mime || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${media.name.split('.').pop() || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${documentType} downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${documentType}:`, error);
      toast.error(`Failed to download ${documentType}`);
    }
  }, [getStrapiBaseUrl]);

  // Handle KTP download
  const handleDownloadKtp = useCallback((spk: SPK) => {
    handleDownloadMedia(spk.ktpPaspor, `KTP_${spk.noSPK}`, 'KTP');
  }, [handleDownloadMedia]);

  // Handle KK download
  const handleDownloadKk = useCallback((spk: SPK) => {
    handleDownloadMedia(spk.kartuKeluarga, `KK_${spk.noSPK}`, 'Kartu Keluarga');
  }, [handleDownloadMedia]);

  // Handle Selfie download
  const handleDownloadSelfie = useCallback((spk: SPK) => {
    handleDownloadMedia(spk.selfie, `Selfie_${spk.noSPK}`, 'Selfie');
  }, [handleDownloadMedia]);

  // MRT Columns
  const columns = useMemo<MRT_ColumnDef<SPK>[]>(() => [
    {
      accessorKey: 'noSPK',
      header: 'No SPK',
      size: 180,
    },
    {
      accessorKey: 'tanggal',
      header: 'Tanggal',
      size: 120,
      Cell: ({ cell }) => {
        const value = cell.getValue<string>();
        const date = new Date(value);
        return date.toLocaleDateString('id-ID');
      },
    },
    {
      accessorKey: 'namaCustomer',
      header: 'Nama Customer',
      size: 200,
    },
    {
      accessorKey: 'noTeleponCustomer',
      header: 'No Telp Customer',
      size: 150,
    },
    {
      accessorKey: 'emailcustomer',
      header: 'Email Customer',
      size: 200,
      Cell: ({ cell }) => cell.getValue<string>() || '-',
    },
    {
      accessorKey: 'kotacustomer',
      header: 'Kota Customer',
      size: 150,
      Cell: ({ cell }) => cell.getValue<string>() || '-',
    },
    {
      accessorKey: 'salesProfile.surename',
      header: 'Sales',
      size: 150,
      Cell: ({ cell }) => cell.getValue<string>() || '-',
    },
    {
      accessorKey: 'salesProfile.namasupervisor',
      header: 'Supervisor',
      size: 180,
      Cell: ({ cell }) => cell.getValue<string>() || '-',
    },
    {
      accessorKey: 'editable',
      header: 'Editable',
      size: 100,
      Cell: ({ cell }) => (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium',
            color: cell.getValue<boolean>() ? 'primary.main' : 'text.secondary',
            backgroundColor: cell.getValue<boolean>() ? 'primary.50' : 'grey.100',
            width: 'fit-content'
          }}
        >
          {cell.getValue<boolean>() ? 'Yes' : 'No'}
        </Box>
      ),
    },
    {
      accessorKey: 'finish',
      header: 'Finish',
      size: 120,
      Cell: ({ cell }) => (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium',
            color: cell.getValue<boolean>() ? 'success.main' : 'warning.main',
            backgroundColor: cell.getValue<boolean>() ? 'success.50' : 'warning.50',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            width: 'fit-content'
          }}
        >
          {cell.getValue<boolean>() ? 'FINISH' : 'PROGRESS'}
        </Box>
      ),
    },
  ], []);

  const table = useMaterialReactTable({
    columns,
    data: spks,
    // Client-side mode (default)
    enablePagination: true,
    enableSorting: true,
    enableGlobalFilter: true,
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
