'use client';

import { useState } from 'react';
import Link from '@/components/NextLinkCompat';
import { usePathname } from '@/hooks/useNavigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Car,
  Map as MapIcon,
  FileText,
  Settings,
  LogOut,
  Menu,
  Home,
  Palette,
  User,
  MapPin,
  UserCheck,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  {
    name: 'Master Data',
    icon: Settings,
    children: [
      // { name: 'Categories', href: '/dashboard/master-data/categories', icon: Palette },
      { name: 'Vehicle Groups', href: '/dashboard/master-data/vehicle-groups', icon: Car },
      { name: 'Vehicle Types', href: '/dashboard/master-data/vehicle-types', icon: Car },
      { name: 'Colors', href: '/dashboard/master-data/colors', icon: Palette },
      { name: 'Supervisors', href: '/dashboard/master-data/supervisors', icon: User },
      { name: 'Branches', href: '/dashboard/master-data/branches', icon: MapPin },
      { name: 'Information', href: '/dashboard/master-data/information', icon: Info },
    ]
  },
  { name: 'User Management', href: '/dashboard/user-management', icon: UserCheck },
  { name: 'Sales Monitoring', href: '/dashboard/sales-monitoring', icon: MapIcon },
  { name: 'SPK Management', href: '/dashboard/spk-management', icon: FileText },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-center h-16 px-4 bg-primary">
          <h1 className="text-xl font-bold text-white">Car Dealer Dashboard</h1>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-600">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                            isActive(child.href)
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          <child.icon className="mr-3 h-4 w-4" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t p-2">
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2 px-6 rounded-md shadow-md border border-gray-700">
              <span className="font-bold text-sm tracking-wide">Karunia Apps @nababancloud.net 2025</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold ml-3 pl-3 border-l border-gray-600">Trial Version 1.0.1</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}