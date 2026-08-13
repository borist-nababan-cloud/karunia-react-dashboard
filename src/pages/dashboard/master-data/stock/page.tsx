'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import { Badge } from '@/components/ui/badge';
import { CRUDTable } from '@/components/CRUDTable';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { stockAPI } from '@/services/api';
import { toast } from 'sonner';

interface Stock {
  id_kendaraan: string;
  no_rangka: string;
  no_mesin: string;
  id_type: string;
  id_warna: string;
  tgl_masuk: string;
  tahun: string;
  harga: number;
  notes: string;
  mstr_type_detail?: {
    nama_group_detail: string;
  };
}

export default function StockPage() {
  const [data, setData] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stockAPI.findReadyStock();
      setData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch stock:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = useMemo<MRT_ColumnDef<Stock>[]>(
    () => [
      {
        accessorKey: 'id_kendaraan',
        header: 'Stock No',
        Cell: ({ row }) => <Badge variant="outline">{row.original.id_kendaraan}</Badge>,
      },
      {
        accessorKey: 'no_rangka',
        header: 'No Rangka',
      },
      {
        accessorKey: 'no_mesin',
        header: 'No Mesin',
      },
      {
        accessorKey: 'id_type',
        header: 'Vehicle Type',
        enableGlobalFilter: false,
        Cell: ({ row }) => {
          const detailName = row.original.mstr_type_detail?.nama_group_detail;
          return (
            <div className="font-medium">
              {detailName || row.original.id_type}
            </div>
          );
        },
      },
      {
        accessorKey: 'id_warna',
        header: 'Color',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'tahun',
        header: 'Year',
        enableGlobalFilter: false,
      },
      {
        accessorKey: 'harga',
        header: 'Price',
        enableGlobalFilter: false,
        Cell: ({ row }) => {
          return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
          }).format(row.original.harga);
        },
      }
    ],
    []
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <CRUDTable
            title="Ready Stock"
            description="View list of available vehicle stock. This grid is read-only and managed by another application."
            data={data}
            columns={columns}
            isLoading={loading}
            // Omitting onAdd, onEdit, onDelete makes this table read-only
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
