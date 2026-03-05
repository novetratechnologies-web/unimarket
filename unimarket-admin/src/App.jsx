// admin/src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Auth Provider
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute, { AdminProtectedRoute, SuperAdminProtectedRoute } from './components/ProtectedRoute'

// Notification Provider
import { NotificationProvider } from './context/NotificationContext'

// Toast Provider
import { GlobalToastProvider, useGlobalToast } from './context/GlobalToastContext';
import { ToastContainer } from './components/Toast'; // Import ToastContainer

// Layout Components
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'

// Pages
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders/OrdersPage'
import Customers from './pages/Customers/CustomersPage'
import GroupsPage from './pages/Customers/GroupsPage'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Storefront from './pages/Storefront'
import Promotions from './pages/Promotions'
import Payments from './pages/Payments'
import Shipping from './pages/Shipping'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import Notifications from './pages/Notifications.jsx'
import CreateProductPage from './pages/products/CreateProductPage.jsx'
import CategoryManagementPage from './pages/categories/CategoryManagementPage.jsx'
import CreateCategoryPage from './pages/categories/CreateCategoryPage.jsx'
import InventoryManagementPage from './pages/inventory/InventoryManagement.jsx'
import AdminProfilePage from './pages/profile/AdminProfilePage.jsx'

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Loading Spinner Component
const LoadingSpinner = ({ message = "Loading your dashboard..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-primary-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-primary-400 animate-spin"></div>
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
      <p className="mt-2 text-sm text-gray-400">Please wait while we verify your access</p>
    </div>
  </div>
)

// Main Layout Component
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => {
    try {
      const saved = localStorage.getItem('adminSidebarState')
      return saved !== null ? JSON.parse(saved) : true
    } catch {
      return true
    }
  })

  const { user, logout, checkAuth } = useAuth()
  // ✅ FIXED: Get toast functions from hook
  const { showToast, toasts, removeToast } = useGlobalToast();

  // Save sidebar state
  React.useEffect(() => {
    localStorage.setItem('adminSidebarState', JSON.stringify(isSidebarOpen))
  }, [isSidebarOpen])

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!checkAuth()) {
      window.location.href = '/login'
    }
  }, [checkAuth])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.href = '/login'
    }
  }

  if (!user) {
    return <LoadingSpinner message="Loading user data..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        user={user}
      />
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <Header 
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          user={user}
        />
        <main className="p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
            
            {/* Products */}
            <Route path="/products" element={
              <AdminProtectedRoute requiredPermissions={['products.view', 'products.manage']}>
                <CreateProductPage />
              </AdminProtectedRoute>
            } />

            {/* Category Management Routes */}
            <Route path="/products/categories" element={
              <AdminProtectedRoute requiredPermissions={['products.view', 'products.manage']}>
                <CategoryManagementPage />
              </AdminProtectedRoute>
            } />

            <Route path="/products/categories/create" element={
              <AdminProtectedRoute requiredPermissions={['products.view', 'products.manage']}>
                <CreateCategoryPage />
              </AdminProtectedRoute>
            } />

             <Route path="/products/inventory" element={
              <AdminProtectedRoute requiredPermissions={['products.view', 'products.manage']}>
                <InventoryManagementPage />
              </AdminProtectedRoute>
            } />


            <Route path="/products/categories/edit/:id" element={
              <AdminProtectedRoute requiredPermissions={['products.view', 'products.manage']}>
                <CreateCategoryPage />
              </AdminProtectedRoute>
            } />
            
            {/* Orders */}
            <Route path="/orders" element={<AdminProtectedRoute requiredPermissions={['orders.view', 'orders.manage']}><Orders /></AdminProtectedRoute>} />
            
            {/* Customers - Main Routes */}
            <Route path="/customers" element={<AdminProtectedRoute requiredPermissions={['customers.view']}><Customers /></AdminProtectedRoute>} />
            
            {/* Customer Status Filter Routes */}
            <Route path="/customers/status/pending" element={
              <AdminProtectedRoute requiredPermissions={['customers.view']}>
                <Customers initialFilter="pending" />
              </AdminProtectedRoute>
            } />
            <Route path="/customers/status/active" element={
              <AdminProtectedRoute requiredPermissions={['customers.view']}>
                <Customers initialFilter="active" />
              </AdminProtectedRoute>
            } />
            <Route path="/customers/status/inactive" element={
              <AdminProtectedRoute requiredPermissions={['customers.view']}>
                <Customers initialFilter="inactive" />
              </AdminProtectedRoute>
            } />
            
            {/* Customer Groups */}
            <Route path="/customers/groups" element={
              <AdminProtectedRoute requiredPermissions={['customers.view', 'customers.manage']}>
                <GroupsPage />
              </AdminProtectedRoute>
            } />
            
            {/* Add Customer - Redirect to main customers page with modal */}
            <Route path="/customers/add" element={<Navigate to="/customers?action=add" replace />} />
            
            {/* Analytics */}
            <Route path="/analytics" element={<AdminProtectedRoute requiredPermissions={['analytics.view']}><Analytics /></AdminProtectedRoute>} />

            {/* Settings */}
            <Route path="/profile" element={<SuperAdminProtectedRoute requiredPermissions={['profile.edit']}><AdminProfilePage/></SuperAdminProtectedRoute>} />
            
            {/* Settings */}
            <Route path="/settings" element={<SuperAdminProtectedRoute requiredPermissions={['settings.edit']}><Settings /></SuperAdminProtectedRoute>} />
            
            {/* Storefront */}
            <Route path="/storefront" element={<AdminProtectedRoute requiredPermissions={['storefront.manage']}><Storefront /></AdminProtectedRoute>} />
            
            {/* Promotions */}
            <Route path="/promotions" element={<AdminProtectedRoute requiredPermissions={['promotions.manage']}><Promotions /></AdminProtectedRoute>} />
            
            {/* Payments */}
            <Route path="/payments" element={<AdminProtectedRoute requiredPermissions={['payments.view', 'payments.manage']}><Payments /></AdminProtectedRoute>} />
            
            {/* Shipping */}
            <Route path="/shipping" element={<AdminProtectedRoute requiredPermissions={['shipping.manage']}><Shipping /></AdminProtectedRoute>} />
            
            {/* Notifications */}
            <Route path="/notifications" element={<AdminProtectedRoute><Notifications /></AdminProtectedRoute>} />
            
            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// Auth Check Component
const AuthChecker = () => {
  const { isInitialized, checkAuth, loading, user } = useAuth()
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setChecking(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Show loading while initializing
  if (!isInitialized || loading || checking) {
    return <LoadingSpinner message="Initializing admin dashboard..." />
  }

  // Check authentication
  if (!checkAuth()) {
    console.log('🔒 Not authenticated, redirecting to login')
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />
  }

  // Ensure user data exists
  if (!user) {
    console.log('👤 No user data found')
    return <LoadingSpinner message="Loading user data..." />
  }

  console.log('✅ Authenticated as:', user.email, 'Role:', user.role)
  return <MainLayout />
}

// Public Routes Component
const PublicRoutes = () => {
  const { checkAuth } = useAuth()
  
  if (checkAuth()) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <Login />
}

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <GlobalToastProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<PublicRoutes />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/*" element={<AuthChecker />} />
              </Routes>
            </Router>
          </GlobalToastProvider>
        </NotificationProvider>
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}

export default App