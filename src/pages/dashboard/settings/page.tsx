'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to update password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-soft border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-astra-charcoal">Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account settings and preferences.
              </p>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="text-lg leading-6 font-semibold text-astra-charcoal">
                Change Password
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Ensure your account is using a long, random password to stay secure.</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label 
                    htmlFor="new-password" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-astra-red focus:border-astra-red sm:text-sm p-3 border transition-colors"
                    required
                  />
                </div>
                <div>
                  <label 
                    htmlFor="confirm-password" 
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-astra-red focus:border-astra-red sm:text-sm p-3 border transition-colors"
                    required
                  />
                </div>
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto bg-astra-red hover:bg-red-700 text-white shadow-soft rounded-xl"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
