'use client';

import React from 'react';
import Link from '@/components/NextLinkCompat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  Palette,
  Users,
  MapPin,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

const masterDataSections = [
  {
    title: 'Vehicle Groups',
    description: 'Manage vehicle categories and groups',
    icon: Car,
    href: '/dashboard/master-data/vehicle-groups',
    count: 12,
    color: 'bg-blue-500',
  },
  {
    title: 'Vehicle Types',
    description: 'Manage specific vehicle types and models',
    icon: Car,
    href: '/dashboard/master-data/vehicle-types',
    count: 47,
    color: 'bg-green-500',
  },
  {
    title: 'Colors',
    description: 'Manage available vehicle colors',
    icon: Palette,
    href: '/dashboard/master-data/colors',
    count: 18,
    color: 'bg-purple-500',
  },
  {
    title: 'Supervisors (SPV)',
    description: 'Manage sales supervisors',
    icon: Users,
    href: '/dashboard/master-data/supervisors',
    count: 8,
    color: 'bg-orange-500',
  },
  {
    title: 'Branches',
    description: 'Manage branch locations and details',
    icon: MapPin,
    href: '/dashboard/master-data/branches',
    count: 5,
    color: 'bg-red-500',
  },
];

const recentChanges = [
  {
    id: 1,
    action: 'Added new vehicle type',
    item: 'Honda Vario 160',
    section: 'Vehicle Types',
    time: '2 minutes ago',
    type: 'create',
  },
  {
    id: 2,
    action: 'Updated branch location',
    item: 'Jakarta Branch',
    section: 'Branches',
    time: '1 hour ago',
    type: 'update',
  },
  {
    id: 3,
    action: 'Added new color option',
    item: 'Matte Black',
    section: 'Colors',
    time: '3 hours ago',
    type: 'create',
  },
];

export default function MasterDataPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Master Data Management</h1>
              <p className="text-gray-600">Manage all your master data configurations</p>
            </div>
          </div>

          {/* Data Sections Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {masterDataSections.map((section) => (
              <Card key={section.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary">{section.count} items</Badge>
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={section.href}>
                    <Button className="w-full">
                      Manage {section.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Changes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentChanges.map((change) => (
                  <div key={change.id} className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${change.type === 'create' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{change.action}</p>
                      <p className="text-xs text-gray-500">
                        {change.item} - {change.section}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{change.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}