'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from '@/components/NextLinkCompat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  Users,
  MapPin,
  FileText,
  TrendingUp,
  Activity,
  Settings,
  Map as MapIcon,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  vehicleTypesAPI,
  salesMonitoringAPI,
  branchesAPI,
  spkAPI
} from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

const moduleCards = [
  {
    title: 'Master Data Management',
    description: 'Manage vehicle groups, types, colors, supervisors, and branches',
    icon: Settings,
    href: '/dashboard/master-data',
    color: 'bg-blue-500',
  },
  {
    title: 'Sales Monitoring',
    description: 'Live map view of sales staff locations and activity',
    icon: MapIcon,
    href: '/dashboard/sales-monitoring',
    color: 'bg-green-500',
  },
  {
    title: 'SPK Management',
    description: 'Manage orders, generate PDFs, and track order status',
    icon: FileText,
    href: '/dashboard/spk-management',
    color: 'bg-purple-500',
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeSales: 0,
    totalBranches: 0,
    spkThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Safety timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 15000);
        });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        const dataPromise = Promise.all([
          vehicleTypesAPI.getAll({ 'pagination[pageSize]': 1 }),
          salesMonitoringAPI.getSalesProfilesByStatus(true),
          branchesAPI.getAll({ 'pagination[pageSize]': 1 }),
          spkAPI.find({
            filters: {
              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
              }
            },
            'pagination[pageSize]': 1
          }),
          spkAPI.find({
            sort: 'createdAt:desc',
            'pagination[pageSize]': 5,
            populate: '*'
          })
        ]);

        const [
          vehiclesRes,
          salesRes,
          branchesRes,
          spkMonthRes,
          recentSpkRes
        ] = await Promise.race([dataPromise, timeoutPromise]) as any[];

        setStats({
          totalVehicles: vehiclesRes.meta?.pagination?.total || 0,
          activeSales: salesRes.data?.length || 0,
          totalBranches: branchesRes.meta?.pagination?.total || 0,
          spkThisMonth: spkMonthRes.meta?.pagination?.total || 0,
        });

        setRecentActivity(recentSpkRes.data || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsCards = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles.toString(),
      description: 'Available models',
      icon: Car,
      trend: 'neutral',
    },
    {
      title: 'Active Sales',
      value: stats.activeSales.toString(),
      description: 'Currently online',
      icon: Users,
      trend: 'online',
    },
    {
      title: 'Branches',
      value: stats.totalBranches.toString(),
      description: 'Total locations',
      icon: MapPin,
      trend: 'neutral',
    },
    {
      title: 'SPK This Month',
      value: stats.spkThisMonth.toString(),
      description: 'New orders',
      icon: FileText,
      trend: 'up',
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to your Car Dealer Dashboard</p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Module Cards */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Quick Access
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {moduleCards.map((module) => (
                    <Card key={module.title} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-4`}>
                          <module.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href={module.href}>
                          <Button className="w-full">
                            Open Module
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity (Latest SPKs)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-gray-500">No recent activity found.</p>
                    ) : (
                      recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-center gap-4 border-b last:border-0 pb-3 last:pb-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">New SPK created</p>
                            <p className="text-xs text-gray-500">
                              {activity.attributes?.spk_number || activity.spk_number || 'Unknown SPK'} - {activity.attributes?.customerName || activity.customerName}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {activity.attributes?.createdAt || activity.createdAt ?
                              formatDistanceToNow(new Date(activity.attributes?.createdAt || activity.createdAt), { addSuffix: true }) : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}