// admin/src/components/dashboard/RecentOrders.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  RefreshCw,
  AlertCircle,
  Package,
  ChevronRight,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

// ============================================
// STATUS CONFIGURATION
// ============================================
const STATUS_CONFIG = {
  delivered: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    iconColor: 'text-emerald-600',
    label: 'Delivered',
    progress: 100
  },
  shipped: {
    icon: Truck,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    label: 'Shipped',
    progress: 75
  },
  processing: {
    icon: Clock,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-600',
    label: 'Processing',
    progress: 50
  },
  pending: {
    icon: Clock,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-600',
    label: 'Pending',
    progress: 25
  },
  cancelled: {
    icon: XCircle,
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    iconColor: 'text-rose-600',
    label: 'Cancelled',
    progress: 0
  },
  refunded: {
    icon: XCircle,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    iconColor: 'text-purple-600',
    label: 'Refunded',
    progress: 0
  },
  partially_refunded: {
    icon: XCircle,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
    label: 'Partially Refunded',
    progress: 0
  },
  confirmed: {
    icon: CheckCircle,
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    iconColor: 'text-indigo-600',
    label: 'Confirmed',
    progress: 40
  },
  on_hold: {
    icon: Clock,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-600',
    label: 'On Hold',
    progress: 15
  },
  failed: {
    icon: XCircle,
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    iconColor: 'text-rose-600',
    label: 'Failed',
    progress: 0
  },
  abandoned: {
    icon: Package,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-600',
    label: 'Abandoned',
    progress: 0
  }
};

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatsCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend} from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const RecentOrders = ({ 
  limit = 5, 
  showViewAll = true, 
  autoRefresh = true, 
  refreshInterval = 30000,
  showStats = true,
  onOrderClick,
  className = '' 
}) => {
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Hooks
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // ============================================
  // FETCH ORDERS - FIXED
  // ============================================
  const fetchOrders = useCallback(async (showRefreshingState = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshingState) {
        setRefreshing(true);
      }
      
      setError(null);
      
      // Build query parameters - WITHOUT status filter to avoid 400 error
      const params = {
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      console.log('🔍 Fetching orders with params:', params);

      // Use the API client based on user role
      let response;
      
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        response = await api.orders.getAll(params);
      } else if (user?.role === 'vendor') {
        response = await api.orders.getVendorOrders(params);
      } else {
        response = await api.orders.getMyOrders(params);
      }

      console.log('🔍 Orders response:', response);

      // Handle response - API client already returns data directly
      let ordersData = [];

      if (response) {
        if (response.data) {
          ordersData = response.data;
        } else if (Array.isArray(response)) {
          ordersData = response;
        } else if (response.orders) {
          ordersData = response.orders;
        }
      }

      // Ensure ordersData is an array
      if (!Array.isArray(ordersData)) {
        ordersData = [];
      }

      // Filter out abandoned orders on the frontend
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        ordersData = ordersData.filter(order => order.status !== 'abandoned');
      }

      setOrders(ordersData);
      setLastUpdated(new Date());
      setRetryCount(0);

      if (showRefreshingState && ordersData.length > 0) {
        showToast(`Loaded ${ordersData.length} orders`, 'success');
      }

    } catch (err) {
      console.error('❌ Failed to fetch recent orders:', err);
      
      let errorMessage = 'Failed to load orders';
      
      if (err.code === 'NOT_FOUND') {
        errorMessage = 'Orders API endpoint not found';
      } else if (err.code === 'UNAUTHORIZED' || err.status === 401) {
        errorMessage = 'Please log in to view orders';
      } else if (err.code === 'FORBIDDEN' || err.status === 403) {
        errorMessage = 'You do not have permission to view orders';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Implement retry logic for network errors
      if (retryCount < 3 && (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchOrders(showRefreshingState);
        }, 2000 * (retryCount + 1));
      }

      if (orders.length === 0) {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, user?.role, isAuthenticated, showToast, orders.length, retryCount]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const intervalId = setInterval(() => {
      fetchOrders(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, isAuthenticated, fetchOrders]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleOrderClick = (order) => {
    if (onOrderClick) {
      onOrderClick(order);
    } else {
      navigate(`/orders/${order._id}`);
    }
  };

  const handleViewAll = () => {
    navigate('/orders');
  };

  // ============================================
  // UTILITIES
  // ============================================
  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const formatOrderDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: format(date, 'MMM d, yyyy • h:mm a')
      };
    } catch {
      return {
        relative: 'Date unknown',
        absolute: 'Date unknown'
      };
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount || 0);
    } catch {
      return `$${parseFloat(amount || 0).toFixed(2)}`;
    }
  };

  const getCustomerName = (order) => {
    if (!order) return 'Customer';
    
    if (order.customerName) return order.customerName;
    
    if (order.customer) {
      if (typeof order.customer === 'object') {
        const firstName = order.customer.firstName || order.customer.first_name || '';
        const lastName = order.customer.lastName || order.customer.last_name || '';
        return `${firstName} ${lastName}`.trim() || 'Customer';
      }
    }
    
    if (order.guestDetails) {
      const firstName = order.guestDetails.firstName || '';
      const lastName = order.guestDetails.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Guest';
    }
    
    if (order.shippingAddress) {
      const firstName = order.shippingAddress.firstName || '';
      const lastName = order.shippingAddress.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Customer';
    }
    
    return 'Customer';
  };

  const calculateStats = useMemo(() => {
    if (!orders.length) return null;

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalRevenue / orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.customer?._id || order.guestEmail)).size;

    return {
      totalRevenue,
      averageOrderValue,
      orderCount: orders.length,
      uniqueCustomers
    };
  }, [orders]);

  // ============================================
  // RENDER STATES
  // ============================================

  // Loading State
  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="space-y-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 animate-pulse">
              <div className="flex items-center space-x-4 flex-1">
                <div className="p-3 bg-gray-200 rounded-lg w-12 h-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-24 ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Not Authenticated State
  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Authenticated</h3>
          <p className="text-gray-600 mb-6">Please log in to view orders</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Sign In
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !orders.length) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Orders</h3>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-6">Please try again or contact support</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!orders.length) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-gray-600 mb-6">Your orders will appear here once customers start purchasing</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            View Products
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER - SINGLE CONTAINER
  // ============================================
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-primary-600" />
              Recent Orders
            </h2>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {calculateStats && (
              <div className="hidden md:flex items-center space-x-4 mr-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(calculateStats.totalRevenue)}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Avg. Order</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(calculateStats.averageOrderValue)}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 relative group"
              title="Refresh orders"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing && (
                <span className="absolute -bottom-8 right-0 text-xs text-gray-500 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm">
                  Refreshing...
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {showStats && calculateStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatsCard
              title="Total Orders"
              value={calculateStats.orderCount}
              icon={ShoppingBag}
              color="bg-blue-600"
            />
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(calculateStats.totalRevenue)}
              icon={DollarSign}
              color="bg-green-600"
            />
            <StatsCard
              title="Avg. Order Value"
              value={formatCurrency(calculateStats.averageOrderValue)}
              icon={TrendingUp}
              color="bg-purple-600"
            />
            <StatsCard
              title="Unique Customers"
              value={calculateStats.uniqueCustomers}
              icon={Users}
              color="bg-amber-600"
            />
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="divide-y divide-gray-100">
        {orders.slice(0, limit).map((order) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          const customerName = getCustomerName(order);
          const orderAmount = order.total || 0;
          const orderCurrency = order.currency || 'USD';
          const orderDate = formatOrderDate(order.orderDate || order.createdAt);
          const orderNumber = order.orderNumber || `#${order._id?.slice(-8).toUpperCase()}`;

          return (
            <div
              key={order._id || order.orderNumber}
              onClick={() => handleOrderClick(order)}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                {/* Status Icon */}
                <div className={`p-3 ${statusConfig.bgColor} rounded-xl flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                </div>

                {/* Order Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {orderNumber}
                    </h4>
                    {order.vendors && order.vendors.length > 1 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {order.vendors.length} vendors
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{customerName}</p>
                  <p className="text-xs text-gray-500 mt-1" title={orderDate.absolute}>
                    {orderDate.relative}
                  </p>
                </div>
              </div>

              {/* Order Amount & Status */}
              <div className="text-right ml-4 flex-shrink-0">
                <div className="font-bold text-gray-900 text-lg">
                  {formatCurrency(orderAmount, orderCurrency)}
                </div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Footer */}
      {showViewAll && orders.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 bg-white hover:bg-primary-50 rounded-lg transition-colors border border-gray-200 hover:border-primary-200"
          >
            <span>View All Orders</span>
            <ChevronRight className="h-4 w-4" />
            {orders.length > limit && (
              <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                {orders.length} total
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;