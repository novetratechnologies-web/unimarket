// admin/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  Clock,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Home,
  Tag,
  DollarSign,
  Truck,
  MessageSquare,
  FileText,
  HelpCircle,
  Shield,
  CreditCard,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  Layers,
  UserPlus,
  Archive,
  Grid,
  Menu,
  X,
  Moon,
  Sun,
  Search,
  Gift,
  Percent,
  ShieldCheck,
  Globe,
  Mail,
  Activity,
  Image,
  UserCheck,
  UserX,
  Filter,
  ChevronDown
} from 'lucide-react'

// Import notification hook
import { useNotifications } from '../../context/NotificationContext'

// ============================================
// MENU CONFIGURATIONS - SEPARATED FOR EASY MANAGEMENT
// ============================================

// Main Menu Items
const mainMenuConfig = [
  { 
    id: 'dashboard',
    path: '/dashboard', 
    icon: LayoutDashboard, 
    label: 'Dashboard',
    description: 'Overview & metrics'
  },
  { 
    id: 'products',
    path: '/products', 
    icon: Package, 
    label: 'Products',
    description: 'Manage inventory',
    submenu: [
      { path: '/products', label: 'All Products', icon: Package, exact: true },
      { path: '/products/categories', label: 'Categories', icon: Layers },
      { path: '/products/inventory', label: 'Inventory', icon: Archive },
      { path: '/products/add', label: 'Add New', icon: PlusCircle }
    ]
  },
  { 
    id: 'orders',
    path: '/orders', 
    icon: ShoppingCart, 
    label: 'Orders',
    description: 'Manage orders',
    submenu: [
      { path: '/orders', label: 'All Orders', icon: ShoppingCart, exact: true },
      { path: '/orders?status=pending', label: 'Pending', icon: Clock },
      { path: '/orders?status=processing', label: 'Processing', icon: Activity },
      { path: '/orders?status=delivered', label: 'Delivered', icon: CheckCircle },
      { path: '/orders?status=cancelled', label: 'Cancelled', icon: XCircle }
    ]
  },
  { 
    id: 'customers',
    path: '/customers', 
    icon: Users, 
    label: 'Customers',
    description: 'Customer management'
  },
  { 
    id: 'analytics',
    path: '/analytics', 
    icon: BarChart3, 
    label: 'Analytics',
    description: 'Reports & insights',
    submenu: [
      { path: '/analytics', label: 'Overview', icon: BarChart3, exact: true },
      { path: '/analytics/sales', label: 'Sales', icon: TrendingUp },
      { path: '/analytics/revenue', label: 'Revenue', icon: DollarSign },
      { path: '/analytics/reports', label: 'Reports', icon: FileText }
    ]
  },
]

// Store Management Menu Items
const storeMenuConfig = [
  { 
    id: 'storefront',
    path: '/storefront', 
    icon: Home, 
    label: 'Storefront',
    description: 'Customize store',
    submenu: [
      { path: '/storefront', label: 'Home Page', icon: Home, exact: true },
      { path: '/storefront/pages', label: 'Pages', icon: FileText },
      { path: '/storefront/navigation', label: 'Navigation', icon: Menu },
      { path: '/storefront/media', label: 'Media', icon: Image }
    ]
  },
  { 
    id: 'promotions',
    path: '/promotions', 
    icon: Tag, 
    label: 'Promotions',
    description: 'Discounts & offers',
    submenu: [
      { path: '/promotions', label: 'All Promotions', icon: Tag, exact: true },
      { path: '/promotions/coupons', label: 'Coupons', icon: Gift },
      { path: '/promotions/deals', label: 'Deals', icon: Percent }
    ]
  },
  { 
    id: 'payments',
    path: '/payments', 
    icon: CreditCard, 
    label: 'Payments',
    description: 'Payment settings',
    submenu: [
      { path: '/payments', label: 'Methods', icon: CreditCard, exact: true },
      { path: '/payments/transactions', label: 'Transactions', icon: DollarSign },
      { path: '/payments/payouts', label: 'Payouts', icon: TrendingUp }
    ]
  },
  { 
    id: 'shipping',
    path: '/shipping', 
    icon: Truck, 
    label: 'Shipping',
    description: 'Shipping rules',
    submenu: [
      { path: '/shipping', label: 'Zones', icon: Globe, exact: true },
      { path: '/shipping/rules', label: 'Rules', icon: Shield },
      { path: '/shipping/tracking', label: 'Tracking', icon: Activity }
    ]
  },
]

// System Menu Items
const systemMenuConfig = [
  { 
    id: 'content',
    path: '/content', 
    icon: FileText, 
    label: 'Content',
    description: 'Manage content',
    submenu: [
      { path: '/content/blog', label: 'Blog', icon: FileText },
      { path: '/content/faq', label: 'FAQ', icon: HelpCircle },
      { path: '/content/media', label: 'Media', icon: Image }
    ]
  },
  { 
    id: 'support',
    path: '/support', 
    icon: MessageSquare, 
    label: 'Support',
    description: 'Customer support',
    submenu: [
      { path: '/support/tickets', label: 'Tickets', icon: MessageSquare },
      { path: '/support/chats', label: 'Chats', icon: MessageSquare }
    ]
  },
  { 
    id: 'notifications',
    path: '/notifications', 
    icon: Bell, 
    label: 'Notifications',
    description: 'System notifications'
  },
  { 
    id: 'settings',
    path: '/settings', 
    icon: Settings, 
    label: 'Settings',
    description: 'System settings',
    submenu: [
      { path: '/settings', label: 'General', icon: Settings, exact: true },
      { path: '/settings/users', label: 'Users', icon: Users },
      { path: '/settings/security', label: 'Security', icon: ShieldCheck },
      { path: '/settings/notifications', label: 'Notifications', icon: Bell },
      { path: '/settings/integrations', label: 'Integrations', icon: Grid }
    ]
  },
]

// ============================================
// QUICK STATS CONFIGURATION
// ============================================
const quickStatsConfig = [
  { label: "Today's Revenue", value: '$2,850', color: 'text-green-600', bgColor: 'bg-green-100' },
  { label: 'Pending Orders', value: '15', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { label: 'Low Stock', value: '8', color: 'text-red-600', bgColor: 'bg-red-100' }
]

// ============================================
// HELPER FUNCTIONS
// ============================================
const stripQueryParams = (path) => {
  return path.split('?')[0]
}

const isPathActive = (currentPath, menuPath, exact = false) => {
  const baseCurrent = stripQueryParams(currentPath)
  const baseMenu = stripQueryParams(menuPath)
  
  // For exact matches
  if (exact) {
    return baseCurrent === baseMenu
  }
  
  // For parent items - check if current path starts with menu path
  // But be careful with nested paths
  if (menuPath !== '/' && baseCurrent.startsWith(baseMenu + '/')) {
    return true
  }
  
  return baseCurrent === baseMenu
}

const isSubmenuItemActive = (subItemPath, currentPath, currentSearch) => {
  if (subItemPath.includes('?')) {
    return currentPath + currentSearch === subItemPath
  }
  return stripQueryParams(currentPath) === stripQueryParams(subItemPath)
}

const findActiveMenuItem = (items, path, search) => {
  for (const item of items) {
    if (item.submenu) {
      // Check if any submenu item is active
      const hasActiveSubmenu = item.submenu.some(sub => 
        isSubmenuItemActive(sub.path, path, search)
      )
      if (hasActiveSubmenu) {
        return item.id
      }
    }
  }
  return null
}

// ============================================
// SIDEBAR COMPONENT
// ============================================
const Sidebar = ({ isOpen, toggleSidebar, onLogout, user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [openSubmenus, setOpenSubmenus] = useState(new Set())
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Get real unread count from notification context
  const { unreadCount } = useNotifications()

  // Initialize open submenus based on current route
  useEffect(() => {
    const path = location.pathname
    const search = location.search
    const newOpenSubmenus = new Set()

    // Check all menu configurations
    const checkItems = (items) => {
      items.forEach(item => {
        if (item.submenu) {
          const hasActiveSubmenu = item.submenu.some(sub => 
            isSubmenuItemActive(sub.path, path, search)
          )
          if (hasActiveSubmenu) {
            newOpenSubmenus.add(item.id)
          }
        }
      })
    }

    checkItems(mainMenuConfig)
    checkItems(storeMenuConfig)
    checkItems(systemMenuConfig)

    setOpenSubmenus(newOpenSubmenus)
  }, [location.pathname, location.search])

  const toggleSubmenu = (itemId) => {
    setOpenSubmenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout()
      }
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'A'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredMenuItems = (items) => {
    if (!searchTerm) return items
    return items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const MenuItem = ({ item }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isOpen = openSubmenus.has(item.id)
    
    // Check if this item or any of its children is active
    const isItemActive = !hasSubmenu && isPathActive(location.pathname, item.path, true)
    const hasActiveChild = hasSubmenu && item.submenu.some(sub => 
      isSubmenuItemActive(sub.path, location.pathname, location.search)
    )

    return (
      <div className="mb-1">
        {hasSubmenu ? (
          <>
            <button
              onClick={() => toggleSubmenu(item.id)}
              className={`
                w-full flex items-center justify-between px-4 py-3 
                rounded-xl transition-all duration-200 group
                ${isOpen || hasActiveChild
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center min-w-0">
                <div className={`
                  p-2 rounded-lg mr-3 transition-all duration-200
                  ${isOpen || hasActiveChild
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }
                `}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block font-medium truncate">{item.label}</span>
                  {isOpen && item.description && (
                    <span className="text-xs text-gray-500 truncate">{item.description}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <ChevronDown className={`
                  h-4 w-4 transition-transform duration-200
                  ${isOpen ? 'rotate-180' : ''}
                `} />
              </div>
            </button>
            
            {isOpen && (
              <div className="ml-11 mt-1 space-y-0.5 animate-slide-down">
                {item.submenu.map((subItem, index) => {
                  const isSubActive = isSubmenuItemActive(
                    subItem.path, 
                    location.pathname, 
                    location.search
                  )
                  
                  return (
                    <NavLink
                      key={index}
                      to={subItem.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          toggleSidebar()
                        }
                      }}
                    >
                      <div className={`
                        flex items-center px-3 py-2 text-sm rounded-lg
                        transition-all duration-200 group
                        ${isSubActive
                          ? 'text-primary-600 bg-primary-50 font-medium' 
                          : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                        }
                      `}>
                        {subItem.icon && (
                          <subItem.icon className={`
                            h-4 w-4 mr-2 transition-colors
                            ${isSubActive
                              ? 'text-primary-600' 
                              : 'text-gray-500 group-hover:text-primary-600'
                            }
                          `} />
                        )}
                        <span>{subItem.label}</span>
                        {subItem.label === 'Notifications' && unreadCount > 0 && (
                          <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <NavLink
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleSidebar()
              }
            }}
          >
            {({ isActive }) => (
              <div className={`
                flex items-center justify-between px-4 py-3 rounded-xl
                transition-all duration-200 group
                ${isActive || isPathActive(location.pathname, item.path, true)
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}>
                <div className="flex items-center min-w-0">
                  <div className={`
                    p-2 rounded-lg mr-3 transition-all duration-200
                    ${isActive || isPathActive(location.pathname, item.path, true)
                      ? 'bg-primary-100 text-primary-600' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }
                  `}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-medium truncate">{item.label}</span>
                    {isOpen && item.description && (
                      <span className="text-xs text-gray-500 truncate">{item.description}</span>
                    )}
                  </div>
                </div>
                
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        )}
      </div>
    )
  }

  const MenuSection = ({ title, items }) => {
    const filtered = filteredMenuItems(items)
    if (filtered.length === 0) return null
    
    return (
      <div className="mb-6">
        {isOpen && (
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        )}
        <div className="space-y-1">
          {filtered.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    )
  }

  const QuickStats = () => (
    <div className="mt-8 mx-2 p-4 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-100/50">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <Activity className="h-4 w-4 mr-2 text-primary-600" />
        Quick Stats
      </h4>
      <div className="space-y-3">
        {quickStatsConfig.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-xs text-gray-600">{stat.label}</span>
            <span className={`text-xs font-semibold ${stat.color} ${stat.bgColor} px-2 py-1 rounded-full`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const CollapsedIcons = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        {mainMenuConfig.map((item) => {
          const isItemActive = isPathActive(location.pathname, item.path, true)
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  toggleSidebar()
                }
              }}
              className={({ isActive }) => `
                relative flex items-center justify-center p-3 
                rounded-xl transition-all duration-200 group
                ${isActive || isItemActive
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
      
      <div className="border-t border-gray-200/80"></div>
      
      <div className="space-y-1">
        {storeMenuConfig.slice(0, 3).map((item) => {
          const isItemActive = isPathActive(location.pathname, item.path, true)
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  toggleSidebar()
                }
              }}
              className={({ isActive }) => `
                relative flex items-center justify-center p-3 
                rounded-xl transition-all duration-200 group
                ${isActive || isItemActive
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </div>
  )

  const UserProfile = () => (
    <>
      {isOpen ? (
        <>
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {user ? getInitials(user.name || user.email) : 'A'}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || user?.email?.split('@')[0] || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'admin@unimarket.com'}
              </p>
              <p className="text-xs text-primary-600 mt-0.5 font-medium capitalize">
                {user?.role || 'Administrator'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user ? getInitials(user.name || user.email) : 'A'}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full ring-2 ring-white"></span>
            </div>
          </div>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-white/95 backdrop-blur-xl 
        border-r border-gray-200/80 shadow-2xl shadow-primary-500/5
        transition-all duration-300 z-40 overflow-y-auto flex flex-col
        ${isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-24'}
      `}>
        {/* Logo Section */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-200/80">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-3 ${!isOpen && 'justify-center w-full'}`}>
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                </div>
                {isOpen && (
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Unimarket
                    </h1>
                    <p className="text-xs text-gray-500">Admin Dashboard</p>
                  </div>
                )}
              </div>
              
              {isOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                </button>
              )}
            </div>

            {/* Search Bar - Only in expanded mode */}
            {isOpen && (
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            )}
          </div>

          {/* Collapsed Sidebar Toggle */}
          {!isOpen && (
            <button
              onClick={toggleSidebar}
              className="w-full p-4 hover:bg-gray-50 transition-colors group border-t border-gray-200/80"
              title="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5 text-gray-500 mx-auto group-hover:text-gray-700" />
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {isOpen ? (
            <>
              <MenuSection title="Main" items={mainMenuConfig} />
              <MenuSection title="Store Management" items={storeMenuConfig} />
              <MenuSection title="System" items={systemMenuConfig} />
              
              {/* Quick Stats */}
              <QuickStats />
            </>
          ) : (
            <CollapsedIcons />
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 p-4">
          <UserProfile />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 z-30 flex items-center px-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
        <div className="ml-4 flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="ml-2 font-semibold text-gray-900">Unimarket Admin</span>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {!isOpen && (
        <div className="fixed left-4 bottom-4 z-30 hidden lg:block">
          <button
            onClick={toggleSidebar}
            className="p-3 bg-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all duration-200"
            title="Expand menu"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </>
  )
}

export default Sidebar