import { supabase } from '../lib/supabaseClient';

export const createCRUDAPI = (endpoint: string) => ({
    getAll: async (params = {}) => {
        const { data, error } = await supabase.from(endpoint).select('*, created_by_profile:user_profiles!created_by(username, email, full_name)');
        if (error) throw error;
        return data;
    },
    
    getById: async (id: string | number) => {
        const { data, error } = await supabase.from(endpoint).select('*, created_by_profile:user_profiles!created_by(username, email, full_name)').eq('id', id).single();
        if (error) throw error;
        return data;
    },
    
    create: async (data: any) => {
        const { data: result, error } = await supabase.from(endpoint).insert(data).select().single();
        if (error) throw error;
        return result;
    },
    
    update: async (id: string | number, data: any) => {
        const { data: result, error } = await supabase.from(endpoint).update(data).eq('id', id).select().single();
        if (error) throw error;
        return result;
    },
    
    delete: async (id: string | number) => {
        // Many CMS use 'documentId' for strapi, but supabase uses 'id'. 
        // Some frontend code might pass documentId here, so we will match against 'id' or handle appropriately in components
        const { error } = await supabase.from(endpoint).delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    find: async (filters: any = {}) => {
        const { data, error } = await supabase.from(endpoint).select('*, created_by_profile:user_profiles!created_by(username, email, full_name)');
        if (error) throw error;
        return { data };
    },

    findAll: async (filters: any = {}) => {
        const { data, error } = await supabase.from(endpoint).select('*, created_by_profile:user_profiles!created_by(username, email, full_name)');
        if (error) throw error;
        return { data }; 
    }
});

// Using snake_case for tables as it's standard in Postgres/Supabase
export const spkAPI = createCRUDAPI('spks');
export const vehicleTypesAPI = createCRUDAPI('vehicle_types');
export const vehicleGroupsAPI = createCRUDAPI('vehicle_groups');
export const colorsAPI = createCRUDAPI('colors');
export const supervisorsAPI = createCRUDAPI('supervisors');
export const branchesAPI = createCRUDAPI('branches');
export const salesStaffAPI = createCRUDAPI('sales_staffs');
export const salesProfilesAPI = createCRUDAPI('user_profiles'); // Redirect to user_profiles as sales_profiles is deprecated
export const articlesAPI = createCRUDAPI('articles');
export const categoriesAPI = createCRUDAPI('categories');

export const userProfilesAPI = {
    findSalesProfiles: async () => {
        // Fetch all users with role_id = 3 (SALES) and join their supervisor from the master table
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                *,
                supervisor:supervisors!user_profiles_supervisor_id_fkey (
                    namasupervisor
                )
            `)
            .eq('role_id', 3);
        if (error) throw error;
        return { data };
    },
    findSupervisors: async () => {
        // Fetch all master supervisors
        const { data, error } = await supabase
            .from('supervisors')
            .select('*');
        if (error) throw error;
        return { data };
    },
    update: async (id: string, data: any) => {
        const { data: result, error } = await supabase
            .from('user_profiles')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return result;
    },
    getEligibleUsersForSupervisors: async () => {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .not('role_id', 'in', '(4,8)');
        if (error) throw error;
        return { data };
    }
};
export const stockAPI = {
    findReadyStock: async () => {
        // Fetch only where jual = 'N' and join mstr_type_detail for nama_group_detail
        // Filter out empty no_rangka and no_mesin, and sort by year descending
        const { data, error } = await supabase
            .from('stock')
            .select(`
                *,
                mstr_type_detail:id_type (
                    nama_group_detail
                )
            `)
            .eq('jual', 'N')
            .not('no_rangka', 'is', null)
            .neq('no_rangka', '')
            .not('no_mesin', 'is', null)
            .neq('no_mesin', '')
            .order('tahun', { ascending: false });
        if (error) throw error;
        return { data };
    }
};

export const usersAPI = {
    getSalesUsers: async () => {
        const { data, error } = await supabase.from('users').select('*').eq('role_custom', 'SALES');
        if (error) throw error;
        return { data };
    },
    updateUser: async (userId: string | number, userData: any) => {
        const { data, error } = await supabase.from('users').update(userData).eq('id', userId).select().single();
        if (error) throw error;
        return data;
    },
    getSupervisors: async () => {
        const { data, error } = await supabase.from('supervisors').select('*');
        if (error) throw error;
        return data;
    },
    getCurrentUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    }
};

export const salesMonitoringAPI = {
    getSalesProfilesWithSPK: async () => {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*, spks!created_by(*)')
            .eq('role_id', 3)
            .eq('blocked', false)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    getSalesProfilesByStatus: async (onlineStatus?: boolean) => {
        let query = supabase.from('user_profiles').select('*').eq('role_id', 3).eq('confirmed', true).eq('blocked', false);
        if (onlineStatus !== undefined) {
            query = query.eq('online_stat', onlineStatus);
        }
        const { data, error } = await query.order('updated_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    updateSalesProfileLocation: async (profileId: string, location: any, onlineStatus: boolean) => {
        const { data, error } = await supabase
            .from('user_profiles')
            .update({ location, online_stat: onlineStatus })
            .eq('id', profileId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

export const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('uploads').upload(fileName, file);
    if (error) throw error;
    return [{ url: supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl }];
};

export default supabase;
