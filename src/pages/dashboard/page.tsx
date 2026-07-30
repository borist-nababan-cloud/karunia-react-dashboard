'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {user?.username || 'User'}!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You are logged in as <span className="font-semibold text-primary">{user?.role_custom || 'Unknown Role'}</span>. 
            Use the sidebar menu to navigate to your assigned modules and manage your content.
          </p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}