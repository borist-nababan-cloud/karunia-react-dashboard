// Strapi Common Types
export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiError {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details?: any;
  };
}

// User Types
export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  role?: {
    id: number;
    name: string;
    description: string;
    type: string;
  };
}

// Auth Response
export interface AuthResponse {
  jwt: string;
  user: StrapiUser;
}

// SPK Types
export interface SPK {
  id: number;
  attributes: {
    spkNumber: string;
    date: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    customerKtp?: string;
    vehicleType: string;
    vehicleColor: string;
    noRangka?: string;
    noMesin?: string;
    tahun?: number;
    totalPrice: number;
    paymentType: 'cash' | 'credit';
    dp: number;
    tenor?: number;
    angsuran?: number;
    bunga?: number;
    salesName: string;
    salesEmail?: string;
    salesPhone?: string;
    status: 'ON PROGRESS' | 'FINISH';
    isEditable: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

// Vehicle Type Types
export interface VehicleType {
  id: number;
  attributes: {
    name: string;
    brand: string;
    model: string;
    category: string;
    year: number;
    status: 'active' | 'inactive';
    price: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

// Vehicle Group Types
export interface VehicleGroup {
  id: number;
  attributes: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

// Color Types
export interface Color {
  id: number;
  attributes: {
    name: string;
    hexCode?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

// Supervisor Types
export interface Supervisor {
  id: number;
  attributes: {
    name: string;
    email: string;
    phone: string;
    branch?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

// Branch Types
export interface Branch {
  id: number;
  attributes: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email: string;
    latitude: number;
    longitude: number;
    status: 'active' | 'inactive';
    manager: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

// Sales Staff Types
export interface SalesStaff {
  id: number;
  attributes: {
    name: string;
    email: string;
    phone: string;
    branch: string;
    status: 'online' | 'offline';
    lastUpdated: string;
    latitude?: number;
    longitude?: number;
    currentLocation?: string;
    todayVisits: number;
    monthlyTarget: number;
    monthlyAchievement: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}