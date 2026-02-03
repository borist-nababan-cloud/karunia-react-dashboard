import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages
const LandingPage = React.lazy(() => import('./pages/page'));
const LoginPage = React.lazy(() => import('./pages/auth/login/page'));
const RegisterPage = React.lazy(() => import('./pages/auth/register/page'));

// Dashboard Pages
const DashboardPage = React.lazy(() => import('./pages/dashboard/page'));
const MasterDataPage = React.lazy(() => import('./pages/dashboard/master-data/page'));
const BranchesPage = React.lazy(() => import('./pages/dashboard/master-data/branches/page'));
const CategoriesPage = React.lazy(() => import('./pages/dashboard/master-data/categories/page'));
const ColorsPage = React.lazy(() => import('./pages/dashboard/master-data/colors/page'));
const InformationPage = React.lazy(() => import('./pages/dashboard/master-data/information/page'));
const SupervisorsPage = React.lazy(() => import('./pages/dashboard/master-data/supervisors/page'));
const VehicleGroupsPage = React.lazy(() => import('./pages/dashboard/master-data/vehicle-groups/page'));
const VehicleTypesPage = React.lazy(() => import('./pages/dashboard/master-data/vehicle-types/page'));
const SalesMonitoringPage = React.lazy(() => import('./pages/dashboard/sales-monitoring/page'));
const SpkManagementPage = React.lazy(() => import('./pages/dashboard/spk-management/page'));
const UserManagementPage = React.lazy(() => import('./pages/dashboard/user-management/page'));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/master-data" element={<MasterDataPage />} />
        <Route path="/dashboard/master-data/branches" element={<BranchesPage />} />
        <Route path="/dashboard/master-data/categories" element={<CategoriesPage />} />
        <Route path="/dashboard/master-data/colors" element={<ColorsPage />} />
        <Route path="/dashboard/master-data/information" element={<InformationPage />} />
        <Route path="/dashboard/master-data/supervisors" element={<SupervisorsPage />} />
        <Route path="/dashboard/master-data/vehicle-groups" element={<VehicleGroupsPage />} />
        <Route path="/dashboard/master-data/vehicle-types" element={<VehicleTypesPage />} />
        <Route path="/dashboard/sales-monitoring" element={<SalesMonitoringPage />} />
        <Route path="/dashboard/spk-management" element={<SpkManagementPage />} />
        <Route path="/dashboard/user-management" element={<UserManagementPage />} />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
