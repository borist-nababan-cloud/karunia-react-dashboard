import { useState, useEffect, useCallback } from 'react';
import { spkAPI, vehicleTypesAPI, branchesAPI, salesStaffAPI } from '@/services/api';
import { StrapiListResponse, SPK, VehicleType, Branch, SalesStaff } from '@/types/strapi';

// Generic hook for fetching data
export function useApi<T>(apiCall: () => Promise<StrapiListResponse<T>>, deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data.map(item => item));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// SPK specific hook
export function useSPKs(filters = {}) {
  return useApi(
    () => spkAPI.find({
      sort: 'createdAt:desc',
      ...filters,
    }),
    [JSON.stringify(filters)]
  );
}

// Vehicle Types hook
export function useVehicleTypes() {
  return useApi(
    () => vehicleTypesAPI.find({
      sort: 'name:asc',
    }),
    []
  );
}

// Branches hook
export function useBranches() {
  return useApi(
    () => branchesAPI.find({
      sort: 'name:asc',
    }),
    []
  );
}

// Sales Staff hook
export function useSalesStaff(filters = {}) {
  return useApi(
    () => salesStaffAPI.find({
      sort: 'name:asc',
      ...filters,
    }),
    [JSON.stringify(filters)]
  );
}

// CRUD operations
export function useCRUD<T>(apiCall: {
  create: (data: any) => Promise<any>;
  update: (id: number | string, data: any) => Promise<any>;
  delete: (id: number | string) => Promise<any>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: T) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall.create(data);
      return response;
    } catch (err: any) {
      setError(err.message || 'Create failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: number | string, data: T) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall.update(id, data);
      return response;
    } catch (err: any) {
      setError(err.message || 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number | string) => {
    try {
      setLoading(true);
      setError(null);
      await apiCall.delete(id);
    } catch (err: any) {
      setError(err.message || 'Delete failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, delete: remove, loading, error };
}