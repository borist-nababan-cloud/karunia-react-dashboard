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
import { ROLES, hasAccess, RoleId } from '@/lib/roles';

// Define the type for items to include allowedRoles
type NavItem = {
  name: string;
  href?: string;
  icon: any;
  allowedRoles?: RoleId[];
  children?: NavItem[];
};

const navigationGroups: { groupName: string, items: NavItem[] }[] = [
  {
    groupName: 'Master Data',
    items: [
      { name: 'Vehicle Groups', href: '/dashboard/master-data/vehicle-groups', icon: Car, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Vehicle Types', href: '/dashboard/master-data/vehicle-types', icon: Car, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Colors', href: '/dashboard/master-data/colors', icon: Palette, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Branches', href: '/dashboard/master-data/branches', icon: MapPin, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Supervisors', href: '/dashboard/master-data/supervisors', icon: User, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Stock', href: '/dashboard/master-data/stock', icon: Car, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Information', href: '/dashboard/master-data/information', icon: Info, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
    ]
  },
  {
    groupName: 'Showroom',
    items: [
      { name: 'User Management', href: '/dashboard/user-management', icon: UserCheck, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Sales Monitoring', href: '/dashboard/sales-monitoring', icon: MapIcon },
      { name: 'SPK Management', href: '/dashboard/spk-management', icon: FileText },
      { name: 'Att Logs', href: '/dashboard/master-data/attlogs', icon: MapPin, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
      { name: 'Sales Track', href: '/dashboard/sales-track', icon: MapIcon, allowedRoles: [ROLES.ADMIN, ROLES.SUPER_USER] },
    ]
  },
  {
    groupName: 'Web Menu',
    items: []
  },
  {
    groupName: 'CRM Menu',
    items: []
  },
  {
    groupName: 'Service & Part',
    items: []
  }
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
    <div className="flex h-screen bg-astra-silver/30">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-astra-white/80 backdrop-blur-md border-r border-gray-200/50 shadow-soft transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-center h-20 px-4 border-b border-gray-200/50">
          <h1 className="text-xl font-extrabold text-astra-charcoal tracking-tight text-center">
            {import.meta.env.VITE_APP_NAME || 'ASTRA DAIHATSU'}
          </h1>
        </div>

        <nav className="mt-8 flex-1 overflow-y-auto">
          <div className="px-4 space-y-6 pb-6">
            {navigationGroups.map((group) => (
              <div key={group.groupName} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">
                  {group.groupName}
                </h3>
                <div className="space-y-1">
                  {group.items.length === 0 ? (
                    <p className="text-xs text-gray-400 italic pl-2 mt-1">Coming soon...</p>
                  ) : (
                    group.items.map((item) => {
                      if (item.allowedRoles && !hasAccess(user?.roleId, item.allowedRoles)) {
                        return null;
                      }
                      return (
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
                                    href={child.href || '#'}
                                    className={cn(
                                      "flex items-center px-2 py-2 text-sm rounded-xl transition-all duration-200",
                                      isActive(child.href || '#')
                                        ? "bg-astra-red text-white shadow-soft font-semibold"
                                        : "text-gray-600 hover:bg-astra-red/10 hover:text-astra-red"
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
                              href={item.href || '#'}
                              className={cn(
                                "flex items-center px-2 py-2 text-sm rounded-xl transition-all duration-200",
                                isActive(item.href || '#')
                                ? "bg-astra-red text-white shadow-soft font-semibold"
                                : "text-gray-600 hover:bg-astra-red/10 hover:text-astra-red"
                            )}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        )}
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom fixed section */}
        <div className="p-4 border-t border-gray-200/50">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center px-2 py-2 text-sm rounded-xl transition-all duration-200",
              isActive('/dashboard/settings') 
                ? "bg-astra-red text-white shadow-soft font-semibold" 
                : "text-gray-600 hover:bg-astra-red/10 hover:text-astra-red"
            )}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-astra-white/80 backdrop-blur-md shadow-sm z-10">
          <div className="flex items-center justify-between h-20 px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-astra-silver/50"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5 text-astra-charcoal" />
            </Button>

            <div className="flex items-center space-x-4 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-astra-silver hover:border-astra-red transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-astra-red text-white font-bold">
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6 md:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-astra-white/50 backdrop-blur-sm border-t border-gray-200/50 p-4">
          <div className="flex items-center justify-center">
            <div className="bg-astra-charcoal text-white py-2 px-6 rounded-xl shadow-soft">
              <span className="font-bold text-sm tracking-wide">
                {import.meta.env.VITE_APP_NAME} {import.meta.env.VITE_APP_TRADE_MARK}
              </span>
              <span className="text-xs text-astra-silver uppercase tracking-widest font-semibold ml-3 pl-3 border-l border-gray-600">
                {import.meta.env.VITE_APP_VERSION || '1.0.0'}
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-astra-charcoal/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}