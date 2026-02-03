'use client';

import { useEffect } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isLoading } = useAuth();

  useEffect(() => {
    // Only navigate if auth is loaded
    if (!isLoading) {
      router.push('/auth/login');
    }
  }, [isLoading, router]);

  // Show loading screen while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}