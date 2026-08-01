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
export const salesProfilesAPI = createCRUDAPI('sales_profiles');
export const articlesAPI = createCRUDAPI('articles');
export const categoriesAPI = createCRUDAPI('categories');

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
            .from('sales_profiles')
            .select('*, spks(*)')
            .eq('blocked', false)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    getSalesProfilesByStatus: async (onlineStatus?: boolean) => {
        let query = supabase.from('sales_profiles').select('*').eq('approved', true).eq('blocked', false);
        if (onlineStatus !== undefined) {
            query = query.eq('online_stat', onlineStatus);
        }
        const { data, error } = await query.order('updated_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    updateSalesProfileLocation: async (profileId: number, location: any, onlineStatus: boolean) => {
        const { data, error } = await supabase
            .from('sales_profiles')
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
