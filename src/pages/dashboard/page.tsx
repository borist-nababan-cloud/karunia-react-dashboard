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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="bg-white/60 backdrop-blur-md p-10 rounded-2xl shadow-soft border border-gray-100 max-w-3xl w-full">
            <h1 className="text-4xl font-extrabold text-astra-charcoal tracking-tight">
              Welcome back, <span className="text-astra-red">{user?.username || 'User'}</span>!
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              You are logged in as <span className="font-semibold text-astra-red bg-astra-red/10 px-3 py-1 rounded-full ml-1">{user?.role_custom || 'Unknown Role'}</span>. 
            </p>
            <p className="mt-4 text-md text-gray-500">
              Use the sidebar menu to navigate to your assigned modules and manage your content.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}