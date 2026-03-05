// components/dashboard/QuickActions.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  Store, 
  BarChart3, 
  Wallet, 
  FileText,
  Users,
  Gift,
  Truck,
  CreditCard,
  Settings,
  Plus,
  ChevronRight,
  Zap,
  Sparkles,
  Clock,
  Star,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============================================
// CONSTANTS
// ============================================
const ACTION_CATEGORIES = {
  all: 'All Actions',
  products: 'Products',
  orders: 'Orders',
  vendors: 'Vendors',
  reports: 'Reports',
  finance: 'Finance'
};

const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 }
};

// ============================================
// QUICK ACTIONS COMPONENT
// ============================================
const QuickActions = ({ 
  actions = [],
  onActionClick,
  showCategories = true,
  showSearch = true,
  showRecent = true,
  maxRecent = 5,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentActions, setRecentActions] = useState(() => {
    // Load recent actions from localStorage
    const saved = localStorage.getItem('recentActions');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoriteActions');
    return saved ? JSON.parse(saved) : [];
  });

  // ============================================
  // DEFAULT ACTIONS (if none provided)
  // ============================================
  const defaultActions = [
    {
      id: 'add-product',
      label: 'Add Product',
      icon: Package,
      category: 'products',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      onClick: () => navigate('/products/add'),
      permission: 'products.create',
      shortcut: '⌘P',
      description: 'Create a new product listing',
      stats: { usage: 245, success: 98 }
    },
    {
      id: 'create-order',
      label: 'Create Order',
      icon: ShoppingCart,
      category: 'orders',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      onClick: () => navigate('/orders/create'),
      permission: 'orders.create',
      shortcut: '⌘O',
      description: 'Process a new customer order',
      stats: { usage: 189, success: 95 }
    },
    {
      id: 'add-vendor',
      label: 'Add Vendor',
      icon: Store,
      category: 'vendors',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      onClick: () => navigate('/vendors/add'),
      permission: 'vendors.create',
      shortcut: '⌘V',
      description: 'Onboard a new vendor',
      stats: { usage: 67, success: 100 }
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      icon: BarChart3,
      category: 'reports',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      onClick: () => navigate('/analytics'),
      permission: 'reports.view',
      shortcut: '⌘R',
      description: 'Access analytics and insights',
      stats: { usage: 423, success: 100 }
    },
    {
      id: 'process-payouts',
      label: 'Process Payouts',
      icon: Wallet,
      category: 'finance',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      onClick: () => navigate('/vendors/payouts'),
      permission: 'payouts.process',
      shortcut: '⌘W',
      description: 'Handle vendor payments',
      badge: '12 pending',
      stats: { usage: 156, success: 92 }
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: FileText,
      category: 'reports',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      onClick: () => handleGenerateReport,
      permission: 'reports.generate',
      shortcut: '⌘G',
      description: 'Create custom reports',
      stats: { usage: 89, success: 100 }
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      icon: Users,
      category: 'vendors',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      onClick: () => navigate('/vendors'),
      permission: 'users.manage',
      shortcut: '⌘U',
      description: 'View and manage vendors',
      stats: { usage: 234, success: 100 }
    },
    {
      id: 'create-promotion',
      label: 'Create Promotion',
      icon: Gift,
      category: 'products',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      onClick: () => navigate('/promotions/create'),
      permission: 'promotions.create',
      shortcut: '⌘F',
      description: 'Set up discounts and offers',
      stats: { usage: 45, success: 96 }
    },
    {
      id: 'manage-shipping',
      label: 'Manage Shipping',
      icon: Truck,
      category: 'orders',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      onClick: () => navigate('/shipping'),
      permission: 'shipping.manage',
      shortcut: '⌘S',
      description: 'Configure shipping options',
      stats: { usage: 78, success: 100 }
    },
    {
      id: 'process-refund',
      label: 'Process Refund',
      icon: CreditCard,
      category: 'finance',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      onClick: () => navigate('/orders/refund'),
      permission: 'refunds.process',
      shortcut: '⌘⇧R',
      description: 'Handle customer refunds',
      stats: { usage: 34, success: 88 }
    }
  ];

  // Use provided actions or defaults
  const allActions = actions.length > 0 ? actions : defaultActions;

  // ============================================
  // FILTER ACTIONS
  // ============================================
  const filteredActions = allActions.filter(action => {
    // Check permissions
    if (action.permission && !hasPermission(action.permission)) {
      return false;
    }

    // Filter by category
    if (selectedCategory !== 'all' && action.category !== selectedCategory) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        action.label.toLowerCase().includes(query) ||
        action.description?.toLowerCase().includes(query) ||
        action.category?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // ============================================
  // HANDLERS
  // ============================================
  const handleActionClick = (action) => {
    // Track recent action
    const updatedRecent = [
      { id: action.id, label: action.label, timestamp: Date.now() },
      ...recentActions.filter(a => a.id !== action.id)
    ].slice(0, maxRecent);
    
    setRecentActions(updatedRecent);
    localStorage.setItem('recentActions', JSON.stringify(updatedRecent));

    // Execute action
    if (action.onClick) {
      action.onClick();
    }
    
    if (onActionClick) {
      onActionClick(action);
    }
  };

  const toggleFavorite = (actionId, e) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteActions', JSON.stringify(newFavorites));
  };

  const handleGenerateReport = () => {
    // Implementation for report generation
    console.log('Generate report');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={ANIMATION_VARIANTS}
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Frequently used tasks and shortcuts</p>
            </div>
          </div>
          
          {recentActions.length > 0 && (
            <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Recent
            </button>
          )}
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && (
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          )}

          {showCategories && (
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {Object.entries(ACTION_CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === key
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions Grid */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory + searchQuery}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
              exit: { opacity: 0 }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredActions.map((action) => (
              <motion.button
                key={action.id}
                variants={ANIMATION_VARIANTS}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleActionClick(action)}
                className="group relative flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-left"
              >
                {/* Favorite Star */}
                <button
                  onClick={(e) => toggleFavorite(action.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star
                    className={`h-4 w-4 ${
                      favorites.includes(action.id)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-400'
                    }`}
                  />
                </button>

                {/* Icon */}
                <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:shadow-xl transition-all flex items-center justify-center`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {action.label}
                    </h3>
                    {action.badge && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {action.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {action.shortcut && (
                      <span className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">
                          {action.shortcut}
                        </span>
                      </span>
                    )}
                    {action.stats && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {action.stats.usage} uses
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow indicator */}
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredActions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No actions found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : 'No actions available in this category'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Recent Actions Footer */}
      {showRecent && recentActions.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent:
            </span>
            <div className="flex gap-2 overflow-x-auto">
              {recentActions.map((recent) => {
                const action = allActions.find(a => a.id === recent.id);
                if (!action) return null;
                
                return (
                  <button
                    key={recent.id}
                    onClick={() => handleActionClick(action)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
                  >
                    <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                      <action.icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">{action.label}</span>
                    <span className="text-xs text-gray-400">
                      {formatRecentTime(recent.timestamp)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================
const SearchIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatRecentTime = (timestamp) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ============================================
// QUICK ACTION CARD (Alternative smaller version)
// ============================================
export const QuickActionCard = ({ action, onClick, size = 'md' }) => {
  const sizes = {
    sm: {
      container: 'p-3',
      icon: 'h-8 w-8',
      iconSize: 'h-4 w-4',
      text: 'text-sm'
    },
    md: {
      container: 'p-4',
      icon: 'h-12 w-12',
      iconSize: 'h-6 w-6',
      text: 'text-base'
    },
    lg: {
      container: 'p-6',
      icon: 'h-16 w-16',
      iconSize: 'h-8 w-8',
      text: 'text-lg'
    }
  };

  const style = sizes[size];

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick?.(action)}
      className="group flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300"
    >
      <div className={`bg-gradient-to-br ${action.color} ${style.icon} rounded-xl mb-3 shadow-lg group-hover:shadow-xl transition-all flex items-center justify-center`}>
        <action.icon className={`${style.iconSize} text-white`} />
      </div>
      <span className={`font-medium text-gray-900 ${style.text} mb-1`}>
        {action.label}
      </span>
      {action.badge && (
        <span className="absolute -top-2 -right-2 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
          {action.badge}
        </span>
      )}
    </motion.button>
  );
};

// ============================================
// QUICK ACTION STRIP (Horizontal version)
// ============================================
export const QuickActionStrip = ({ actions = [], onActionClick }) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick?.(action)}
          className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-md transition-all whitespace-nowrap group"
        >
          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
            <action.icon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {action.label}
          </span>
          {action.badge && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              {action.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default QuickActions;