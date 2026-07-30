import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface User {
    id: string; // Supabase user id is string (UUID)
    username: string;
    email: string;
    role_custom?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
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

    const handleUserSession = useCallback(async (authUser: any) => {
        try {
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*, user_roles(role_name)')
                .eq('id', authUser.id)
                .single();

            if (error || !profile) {
                // Securely ensure the profile exists via RPC (bypasses RLS issues)
                const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile');
                
                // Handle new JSON response format from backend RPC
                if (rpcError || (rpcData && (rpcData as any).success === false)) {
                    console.error('Failed to auto-insert profile via RPC:', rpcError || (rpcData as any).error);
                }

                toast.error('Your profile has been registered. Please wait for an administrator to verify your identity.', { duration: 6000 });
                await supabase.auth.signOut();
                setUser(null);
                return;
            }

            if (profile.blocked) {
                toast.error('Access Denied: Your account has been blocked.');
                await supabase.auth.signOut();
                setUser(null);
                return;
            }

            const roleName = profile.user_roles?.role_name;

            if (roleName !== 'ADMIN') {
                toast.error('Session Terminated: Your account does not have administrative privileges.', { duration: 5000 });
                await supabase.auth.signOut();
                setUser(null);
                return;
            }

            const mappedUser: User = {
                id: authUser.id,
                email: authUser.email || '',
                username: profile.username || authUser.user_metadata?.username || 'User',
                role_custom: roleName,
            };
            
            setUser(mappedUser);
        } catch (error) {
            console.error('Error handling session:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) throw error;

                if (session?.user) {
                    await handleUserSession(session.user);
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                setUser(null);
                setIsLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsLoading(false);
                return;
            }

            if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
                // If user state is already set and matching, skip re-fetching to save DB calls, unless forced
                if (user && user.id === session.user.id) {
                    setIsLoading(false);
                    return;
                }
                
                await handleUserSession(session.user);
            } else if (!session) {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [handleUserSession, user]);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            setIsLoading(true);

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Fix: Wait for the session JWT to be fully established and available
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                await supabase.auth.signOut();
                throw new Error('Authentication failed: Could not establish session.');
            }

            // Instead of trusting metadata, fetch the profile using the valid session
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*, user_roles(role_name)')
                .eq('id', session.user.id)
                .single();

            if (profileError || !profile) {
                // Securely ensure the profile exists via RPC (bypasses RLS issues)
                const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile');

                if (rpcError || (rpcData && (rpcData as any).success === false)) {
                    console.error('Failed to auto-insert profile via RPC:', rpcError || (rpcData as any).error);
                }

                toast.error('Your profile has been registered. Please wait for an administrator to verify your identity.', { duration: 6000 });
                await supabase.auth.signOut();
                throw new Error('Profile pending verification.');
            }

            if (profile.blocked) {
                toast.error('Access Denied: Your account has been blocked.');
                await supabase.auth.signOut();
                throw new Error('Account blocked.');
            }

            const roleName = profile.user_roles?.role_name;

            if (roleName !== 'ADMIN') {
                toast.error('Access Denied: Only administrators can access this dashboard.');
                await supabase.auth.signOut();
                throw new Error('Access denied.');
            }

            const mappedUser: User = {
                id: data.user.id,
                email: data.user.email || '',
                username: profile.username || data.user.user_metadata?.username || 'User',
                role_custom: roleName,
            };

            setUser(mappedUser);
            toast.success(`Welcome back!`);
            
        } catch (error: any) {
            console.error('Login failed:', error);
            setError(error.message || 'Login failed');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setError(null);
        window.location.href = '/auth/login';
    };

    const value = {
        user,
        login,
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
