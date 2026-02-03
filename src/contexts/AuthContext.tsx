import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

interface User {
    id: number;
    username: string;
    email: string;
    confirmed: boolean;
    blocked: boolean;
    role_custom?: string;  // Custom role field (ADMIN, SALES, etc.)
    role?: {
        id: number;
        name: string;
        description: string;
        type: string;
    };
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for stored user session on mount
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('jwt_token');
                const storedUser = localStorage.getItem('user');

                if (token && storedUser) {
                    // Verify token is still valid with timeout
                    const userData = await Promise.race([
                        authAPI.me(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Auth check timeout')), 10000)
                        ),
                    ]) as any;

                    // ROLE-BASED ACCESS CONTROL CHECK
                    if (!userData.role_custom || userData.role_custom !== 'ADMIN') {
                        // Show toast notification for session termination
                        toast.error('Session Terminated: Your account does not have administrative privileges. Access denied.', {
                            duration: 5000,
                            position: 'top-center'
                        });

                        // Clear unauthorized session
                        localStorage.removeItem('jwt_token');
                        localStorage.removeItem('user');

                        throw new Error('Access denied. Your session has been terminated.');
                    }

                    setUser(userData);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                // Clear invalid session
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user');
                // Always clear loading state, even on error
                setIsLoading(false);
            } finally {
                // Always clear loading state
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await authAPI.login(email, password);

            // Handle different response formats
            let token, user;

            if (response.jwt) {
                token = response.jwt;
                user = response.user;
            } else if (response.data?.token) {
                token = response.data.token;
                user = response.data.user;
            } else if (response.token) {
                token = response.token;
                user = response.user;
            } else {
                console.error('Unexpected response format - no token found');
                throw new Error('Invalid response format from server - no authentication token found');
            }

            // ROLE-BASED ACCESS CONTROL CHECK
            if (!user.role_custom || user.role_custom !== 'ADMIN') {
                // Show toast notification for access denied
                toast.error('Access Denied: Only administrators can access this dashboard. Please contact your system administrator.', {
                    duration: 5000,
                    position: 'top-center'
                });

                throw new Error('Access denied. Only administrators can access this dashboard. Please contact your system administrator.');
            }

            // Store JWT token
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);

            // Show success notification
            toast.success(`Welcome back, ${user.username || 'Administrator'}!`, {
                duration: 3000,
                position: 'top-center'
            });

        } catch (error: any) {
            console.error('Login failed:', error);

            // Handle different error formats
            const errorMessage = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message ||
                'Login failed';

            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await authAPI.register(username, email, password);

            // Auto-login after successful registration
            localStorage.setItem('jwt_token', response.jwt);
            localStorage.setItem('user', JSON.stringify(response.user));

            setUser(response.user);
        } catch (error: any) {
            setError(error.response?.data?.error?.message || 'Registration failed');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        setUser(null);
        setError(null);
        window.location.href = '/auth/login';
    };

    const value = {
        user,
        login,
        register,
        logout,
        isLoading,
        error,
        setError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
