'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { spkAPI } from '@/services/api';
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
  updateSpk: (id: string, data: any) => Promise<void>;
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

      const apiParams: any = {};

      // Pagination
      const page = params.page || 1;
      const pageSize = params.pageSize || 25;
      apiParams['pagination[page]'] = page;
      apiParams['pagination[pageSize]'] = pageSize;
      apiParams['pagination[start]'] = (page - 1) * pageSize;

      // Sorting (server-side) - fixed syntax
      const sortField = params.sortField || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      apiParams[`sort[${sortField}]`] = sortOrder;

      // Populate nested relations - use Strapi v4 format
      apiParams['populate'] = 'salesProfile,detailInfo,unitInfo,ktpPaspor,kartuKeluarga,selfie';
      apiParams['populate[unitInfo]'] = 'vehicleType,color';

      // Filtering by date range
      const startDate = params.startDate || defaultStartDate;
      const endDate = params.endDate || new Date().toISOString().split('T')[0];
      apiParams['filters[tanggal][$gte]'] = startDate;
      apiParams['filters[tanggal][$lte]'] = endDate;

      // Additional field filter
      if (params.filterField && params.filterValue) {
        apiParams[`filters[${params.filterField}][$containsi]`] = params.filterValue;
      }

      const response = await spkAPI.find(apiParams);
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - reduced for fresher data
    gcTime: 5 * 60 * 1000, // 5 minutes - cache duration
    retry: 1, // Only retry once to avoid hanging
    retryDelay: 1000, // 1 second between retries
  });

  // Extract data and pagination info
  const spks = data?.data || [];
  const pagination = {
    page: data?.meta?.pagination?.page || params.page || 1,
    pageSize: data?.meta?.pagination?.pageSize || params.pageSize || 25,
    pageCount: data?.meta?.pagination?.pageCount || 1,
    total: data?.meta?.pagination?.total || 0,
  };

  // Update SPK mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: string; updateData: any }) => {
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

  const updateSpk = async (id: string, updateData: any) => {
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
