'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import supabase, { spkAPI } from '@/services/api';
import { useState, useCallback } from 'react';

// Types for SPK with pagination
interface SpkPaginationParams {
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filterField?: string;
  filterValue?: string;
  startDate?: string;
  endDate?: string;
}

interface SpkPaginationResponse {
  data: any[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface UseSpkDataResult {
  spks: any[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (field: string, order: 'asc' | 'desc') => void;
  setFilter: (field: string, value: string) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  updateSpk: (id: string | number, data: any) => Promise<void>;
  isUpdating: boolean;
}

const DEFAULT_PARAMS: Omit<SpkPaginationParams, 'startDate' | 'endDate'> = {
  page: 1,
  pageSize: 25,
  sortField: 'createdAt',
  sortOrder: 'desc',
};

export function useSpkData(initialParams: Partial<SpkPaginationParams> = {}): UseSpkDataResult {
  const queryClient = useQueryClient();

  // Local state for pagination, sort, and filter parameters
  const [params, setParams] = useState<SpkPaginationParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });

  // Build query key for caching and invalidation
  const queryKey = ['spks', params];

  // Fetch SPK data with server-side pagination, filtering, and sorting
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Calculate date filter (default to last 2 months if not provided)
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      const defaultStartDate = twoMonthsAgo.toISOString().split('T')[0];

      let query = supabase
        .from('spks')
        .select(`
          *,
          salesProfile:user_profiles!created_by(id, full_name, username, email, phone, supervisor:supervisors!user_profiles_supervisor_id_fkey(namasupervisor)),
          branch:branches(*),
          detailInfo:spk_section_details(*),
          unitInfo:spk_section_units(
            *,
            vehicleType:vehicle_types(*),
            color:colors(*)
          ),
          paymentInfo:spk_section_payments(*)
        `, { count: 'exact' });

      // Filtering by date range
      const startDate = params.startDate || defaultStartDate;
      const endDate = params.endDate || new Date().toISOString().split('T')[0];
      query = query.gte('tanggal', startDate).lte('tanggal', endDate);

      // Additional field filter
      if (params.filterField && params.filterValue) {
        let dbField = params.filterField;
        if (dbField === 'noSPK') dbField = 'no_spk';
        else if (dbField === 'namaCustomer') dbField = 'nama_customer';
        else if (dbField === 'noTeleponCustomer') dbField = 'no_telepon_customer';
        query = query.ilike(dbField, '%' + params.filterValue + '%');
      }

      // Sorting (server-side)
      let sortField = params.sortField || 'createdAt';
      if (sortField === 'createdAt') sortField = 'created_at';
      else if (sortField === 'noSPK') sortField = 'no_spk';
      else if (sortField === 'tanggal') sortField = 'tanggal';
      else if (sortField === 'namaCustomer') sortField = 'nama_customer';

      query = query.order(sortField, { ascending: params.sortOrder === 'asc' });

      // Pagination
      const page = params.page || 1;
      let pageSize = params.pageSize || 25;

      if (pageSize !== -1) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Transform snake_case data to Strapi camelCase format expected by the dashboard and SpkPdfDocument
      const mappedData = data?.map((item: any) => ({
        id: item.id,
        noSPK: item.no_spk,
        tanggal: item.tanggal,
        pekerjaanCustomer: item.pekerjaan_customer,
        namaCustomer: item.nama_customer,
        namaDebitur: item.nama_debitur,
        emailcustomer: item.email_customer,
        alamatCustomer: item.alamat_customer,
        noTeleponCustomer: item.no_telepon_customer,
        kotacustomer: item.kota_customer,
        editable: item.editable,
        finish: item.finish,
        branch_id: item.branch_id,
        ktpPaspor: item.ktp_url ? { url: item.ktp_url } : null,
        kartuKeluarga: item.kk_url ? { url: item.kk_url } : null,
        selfie: item.selfie_url ? { url: item.selfie_url } : null,
        salesProfile: item.salesProfile ? {
          id: item.salesProfile.id,
          surename: item.salesProfile.full_name || item.salesProfile.username || '-',
          namasupervisor: item.salesProfile.supervisor ? (Array.isArray(item.salesProfile.supervisor) ? item.salesProfile.supervisor[0]?.namasupervisor : item.salesProfile.supervisor.namasupervisor) || '-' : '-',
          email: item.salesProfile.email || '-',
          phonenumber: item.salesProfile.phone || '-',
          city: '-',
          address: '-',
        } : null,
        branch: item.branch || null,
        detailInfo: (() => {
          const d = Array.isArray(item.detailInfo) ? item.detailInfo[0] : item.detailInfo;
          return d ? {
            namaBpkbStnk: d.nama_bpkb_stnk,
            kotaStnkBpkb: d.kota_stnk_bpkb,
            alamatBpkbStnk: d.alamat_bpkb_stnk,
          } : null;
        })(),
        unitInfo: (() => {
          const u = Array.isArray(item.unitInfo) ? item.unitInfo[0] : item.unitInfo;
          return u ? {
            noRangka: u.no_rangka,
            noMesin: u.no_mesin,
            tahun: u.tahun,
            hargaOtr: u.harga_otr,
            vehicleType: u.vehicleType,
            color: u.color,
          } : null;
        })(),
        paymentInfo: (() => {
          const p = Array.isArray(item.paymentInfo) ? item.paymentInfo[0] : item.paymentInfo;
          return p ? {
            caraBayar: p.cara_bayar,
            angsuran: p.angsuran,
            tandaJadi: p.tanda_jadi,
            dp: p.dp,
            namaLeasing: p.nama_leasing,
            pembelianVia: p.pembelian_via,
            tenor: p.tenor,
            keterangan: p.keterangan,
          } : null;
        })(),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return {
        data: mappedData || [],
        meta: {
          pagination: {
            page: page,
            pageSize: pageSize,
            total: count || 0,
            pageCount: pageSize === -1 ? 1 : Math.ceil((count || 0) / pageSize),
          }
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - reduced for fresher data
    gcTime: 5 * 60 * 1000, // 5 minutes - cache duration
    retry: 1, // Only retry once to avoid hanging
    retryDelay: 1000, // 1 second between retries
  });

  // Extract data and pagination info
  const spks = data?.data || [];
  const pagination = {
    page: (data as any)?.meta?.pagination?.page || params.page || 1,
    pageSize: (data as any)?.meta?.pagination?.pageSize || params.pageSize || 25,
    pageCount: (data as any)?.meta?.pagination?.pageCount || 1,
    total: (data as any)?.meta?.pagination?.total || spks.length,
  };

  // Update SPK mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: string | number; updateData: any }) => {
      return await spkAPI.update(id, updateData);
    },
    onSuccess: () => {
      // Invalidate and refetch SPK data
      queryClient.invalidateQueries({ queryKey: ['spks'] });
      toast.success('SPK updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update SPK:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update SPK');
    },
  });

  // Parameter update functions
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 })); // Reset to first page when changing page size
  }, []);

  const setSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setParams(prev => ({ ...prev, sortField: field, sortOrder: order, page: 1 })); // Reset to first page when sorting
  }, []);

  const setFilter = useCallback((field: string, value: string) => {
    setParams(prev => ({ ...prev, filterField: field, filterValue: value, page: 1 })); // Reset to first page when filtering
  }, []);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setParams(prev => ({ ...prev, startDate, endDate, page: 1 })); // Reset to first page when changing date range
  }, []);

  const updateSpk = async (id: string | number, updateData: any) => {
    await updateMutation.mutateAsync({ id, updateData });
  };

  return {
    spks,
    loading: isLoading,
    error,
    refetch,
    pagination,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    setDateRange,
    updateSpk,
    isUpdating: updateMutation.isPending,
  };
}
