import axios from 'axios';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_STRAPI_URL || '';
const STRAPI_BASE_URL = import.meta.env.VITE_STRAPI_URL?.replace('/api', '') || '';
const API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 second default timeout for all requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        // Don't add Authorization header for auth endpoints
        const isAuthEndpoint = config.url?.includes('/auth/');

        if (!isAuthEndpoint) {
            const token = localStorage.getItem('jwt_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else if (API_TOKEN) {
                // Use API token only if no JWT token present
                config.headers.Authorization = `Bearer ${API_TOKEN}`;
            }
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login on actual 401 responses from the server
        // Don't redirect on timeout, network errors, or CORS issues
        const isActual401 =
            error.response?.status === 401 &&
            error.code !== 'ECONNABORTED' &&
            error.message !== 'Network Error' &&
            !error.message.includes('timeout') &&
            error.response?.data !== undefined;

        if (isActual401) {
            console.warn('[API] 401 Unauthorized - clearing session and redirecting to login');
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
        } else if (error.code === 'ECONNABORTED') {
            console.error('[API] Request timeout:', error.config?.url);
        } else if (error.message === 'Network Error') {
            console.error('[API] Network error:', error.config?.url);
        }
        return Promise.reject(error);
    }
);

// Test function to check Strapi endpoints
export const testStrapiConnection = async () => {
    try {
        // Test 1: Check if Strapi is running
        await axios.get(`${STRAPI_BASE_URL}/`);

        // Test 2: Check if API endpoints exist
        await axios.get(`${API_BASE_URL}/users`);

        // Test 3: Try auth endpoint with different URLs
        const possibleAuthUrls = [
            `${STRAPI_BASE_URL}/auth/local`,
            `${API_BASE_URL}/auth/local`,
            `${STRAPI_BASE_URL}/api/auth/local`,
        ];

        for (const url of possibleAuthUrls) {
            try {
                await axios.post(url, {}, {
                    validateStatus: () => true
                });
            } catch (e) {
                // Continue testing
            }
        }

        return true;
    } catch (error: any) {
        console.error('Strapi connection test failed:', error.message);
        return false;
    }
};

// Auth endpoints
export const authAPI = {
    login: async (identifier: string, password: string) => {
        // Try different endpoint patterns
        const endpoints = [
            '/auth/local',  // Standard Strapi public endpoint
            '/admin/login', // Admin panel endpoint
        ];

        for (const endpoint of endpoints) {
            // const loginUrl = `${API_BASE_URL}${endpoint}`; // unused variable

            try {
                // Use direct axios call to avoid baseURL confusion
                const axiosInstance = axios.create({
                    baseURL: API_BASE_URL,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                // Try different payload formats
                const payloads = [
                    { identifier, password },
                    { email: identifier, password },
                ];

                for (const payload of payloads) {
                    try {
                        const response = await axiosInstance.post(endpoint, payload);
                        return response.data;
                    } catch (payloadError: any) {
                        // 400 means endpoint exists but credentials are wrong
                        if (payloadError.response?.status === 400) {
                            throw payloadError;
                        }
                        // Continue to next payload
                        continue;
                    }
                }
            } catch (endpointError: any) {
                // If this endpoint doesn't exist (404) or method not allowed (405), try next endpoint
                if (endpointError.response?.status === 404 || endpointError.response?.status === 405) {
                    continue;
                }

                // If we got a 400 (invalid credentials), throw error
                if (endpointError.response?.status === 400) {
                    throw endpointError;
                }

                // For other errors, continue to next endpoint
                continue;
            }
        }

        throw new Error('No valid authentication endpoint found');
    },

    register: async (username: string, email: string, password: string) => {
        const response = await api.post('/auth/local/register', {
            username,
            email,
            password,
        });
        return response.data;
    },

    me: async () => {
        const response = await api.get('/users/me', {
            params: {
                populate: '*'
            }
        });
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', {
            email,
        });
        return response.data;
    },

    resetPassword: async (code: string, password: string, passwordConfirmation: string) => {
        const response = await api.post('/auth/reset-password', {
            code,
            password,
            passwordConfirmation,
        });
        return response.data;
    },
};

// Generic CRUD operations
export const createCRUDAPI = (endpoint: string) => ({
    getAll: async (params = {}) => {
        try {
            const response = await api.get(`/${endpoint}`, { params });
            return response.data;
        } catch (error: any) {
            console.error(`[CRUD] ${endpoint}.getAll ERROR:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            throw error;
        }
    },

    getById: async (id: string | number) => {
        try {
            const response = await api.get(`/${endpoint}/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`[CRUD] ${endpoint}.getById ERROR:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            throw error;
        }
    },

    create: async (data: any) => {
        try {
            const response = await api.post(`/${endpoint}`, { data });
            return response.data;
        } catch (error: any) {
            console.error(`[CRUD] ${endpoint}.create ERROR:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            throw error;
        }
    },

    update: async (id: string | number, data: any) => {
        try {
            const response = await api.put(`/${endpoint}/${id}`, { data });
            return response.data;
        } catch (error: any) {
            console.error(`[CRUD] ${endpoint}.update ERROR:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            throw error;
        }
    },

    delete: async (id: string | number) => {
        try {
            const response = await api.delete(`/${endpoint}/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`[CRUD] ${endpoint}.delete ERROR:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            throw error;
        }
    },

    // Custom query for Strapi filters
    find: async (filters = {}) => {
        try {
            const response = await api.get(`/${endpoint}`, {
                params: {
                    populate: '*',
                    // Set default pagination to 50 records per page (can be overridden by filters)
                    'pagination[pageSize]': 50,
                    'pagination[page]': 1,
                    ...filters,
                },
            });
            return response.data;
        } catch (error: any) {
            console.error(`[CRUD] ${endpoint}.find ERROR:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            throw error;
        }
    },

    // Recursively fetch all records
    findAll: async (filters = {}) => {
        try {
            // First request to get metadata and first page
            const firstPageResponse = await api.get(`/${endpoint}`, {
                params: {
                    populate: '*',
                    'pagination[pageSize]': 100, // Safe limit per request
                    'pagination[page]': 1,
                    ...filters,
                },
            });

            const meta = firstPageResponse.data.meta;
            const pageCount = meta?.pagination?.pageCount || 1;
            let allData = firstPageResponse.data.data || [];

            // If more pages exist, fetch them in parallel
            if (pageCount > 1) {
                const updatedFilters = { ...filters };
                const promises = [];

                for (let page = 2; page <= pageCount; page++) {
                    promises.push(
                        api.get(`/${endpoint}`, {
                            params: {
                                populate: '*',
                                'pagination[pageSize]': 100,
                                'pagination[page]': page,
                                ...updatedFilters,
                            },
                        })
                    );
                }

                const responses = await Promise.all(promises);
                responses.forEach(response => {
                    const pageData = response.data.data || [];
                    allData = [...allData, ...pageData];
                });
            }

            return {
                data: allData,
                meta: {
                    ...meta,
                    pagination: {
                        ...meta.pagination,
                        page: 1,
                        pageSize: allData.length,
                        pageCount: 1,
                        total: allData.length
                    }
                }
            };

        } catch (error: any) {
            console.error(`[CRUD] ${endpoint}.findAll ERROR:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            throw error;
        }
    },
});

// Specific API endpoints
export const spkAPI = createCRUDAPI('spks');
export const vehicleTypesAPI = createCRUDAPI('vehicle-types');
export const vehicleGroupsAPI = createCRUDAPI('vehicle-groups');
export const colorsAPI = createCRUDAPI('colors');
export const supervisorsAPI = createCRUDAPI('supervisors');
export const branchesAPI = createCRUDAPI('branches');
export const salesStaffAPI = createCRUDAPI('sales-staffs');

// Sales Profile API
export const salesProfilesAPI = createCRUDAPI('sales-profiles');

// Information/Articles API
export const articlesAPI = createCRUDAPI('articles');

// Sales Monitoring API
export const salesMonitoringAPI = {
    // Get all sales profiles with their SPK data and populated relationships
    getSalesProfilesWithSPK: async () => {
        // Use array format for Strapi v4 populate
        const response = await api.get('/sales-profiles', {
            params: {
                // Populate photo_profile and spks relations (top-level only)
                populate: ['photo_profile', 'spks'],
                // Filter only non-blocked sales profiles
                'filters[blocked]': false,
                // Sort by most recently updated
                'sort': 'updatedAt:desc',
                // Ensure we fetch enough records (default is 25)
                'pagination[pageSize]': 100,
            }
        });
        return response.data;
    },

    // Get sales profiles filtered by online status
    getSalesProfilesByStatus: async (onlineStatus?: boolean) => {
        const filters: any = {
            approved: true,
            blocked: false
        };

        if (onlineStatus !== undefined) {
            filters.online_stat = onlineStatus;
        }

        const response = await api.get('/sales-profiles', {
            params: {
                populate: '*',
                filters,
                sort: {
                    updatedAt: 'desc'
                }
            }
        });
        return response.data;
    },

    // Update sales profile location and online status
    updateSalesProfileLocation: async (profileId: number, location: { latitude: number; longitude: number }, onlineStatus: boolean) => {
        const response = await api.put(`/sales-profiles/${profileId}`, {
            data: {
                location,
                online_stat: onlineStatus,
                updatedAt: new Date().toISOString()
            }
        });
        return response.data;
    }
};

// User management API
export const usersAPI = {
    // Get all users with SALES role
    getSalesUsers: async () => {
        const response = await api.get('/users', {
            params: {
                filters: {
                    role_custom: 'SALES'
                },
                populate: '*'
            }
        });
        return response.data;
    },

    // Update user data
    updateUser: async (userId: number, userData: any) => {
        const response = await api.put(`/users/${userId}`, { data: userData });
        return response.data;
    },

    // Get supervisors for dropdown
    getSupervisors: async () => {
        const response = await api.get('/supervisors', {
            params: {
                populate: '*'
            }
        });
        return response.data;
    },

    // Get current user info
    getCurrentUser: async () => {
        const response = await api.get('/users/me', {
            params: {
                populate: '*'
            }
        });
        return response.data;
    }
};

// Categories API
export const categoriesAPI = createCRUDAPI('categories');

// File upload helper
export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export default api;
