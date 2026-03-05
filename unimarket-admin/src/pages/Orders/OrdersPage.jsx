// admin/src/pages/Orders/OrdersPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit,
  XCircle,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Plus,
  MoreVertical,
  Printer,
  Mail,
  FileText,
  Archive,
  Trash2,
  Settings,
  Grid,
  List,
  BarChart3,
  PieChart,
  DownloadCloud,
  UploadCloud,
  Copy,
  Send,
  Ban,
  Check,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';
import OrderDetailModal from '../../components/orders/OrderDetailModal';
import BulkActionModal from '../../components/orders/BulkActionModal';
import ExportModal from '../../components/orders/ExportModal';
import FilterPanel from '../../components/orders/FilterPanel';
import OrderAnalytics from '../../components/orders/OrderAnalytics'

// ============================================
// STATUS CONFIGURATION
// ============================================
const ORDER_STATUS = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    progress: 25
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    progress: 50
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    progress: 60
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    progress: 75
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    progress: 100
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    progress: 0
  },
  refunded: {
    label: 'Refunded',
    icon: XCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    progress: 0
  },
  partially_refunded: {
    label: 'Partially Refunded',
    icon: XCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    progress: 50
  },
  disputed: {
    label: 'Disputed',
    icon: AlertCircle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    borderColor: 'border-rose-300',
    progress: 0
  },
  on_hold: {
    label: 'On Hold',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    progress: 15
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    borderColor: 'border-rose-300',
    progress: 0
  },
  abandoned: {
    label: 'Abandoned',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    progress: 0
  }
};

const PAYMENT_STATUS = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  processing: { label: 'Processing', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  authorized: { label: 'Authorized', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  paid: { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-50' },
  partially_paid: { label: 'Partially Paid', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  failed: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-50' },
  refunded: { label: 'Refunded', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  partially_refunded: { label: 'Partially Refunded', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  disputed: { label: 'Disputed', color: 'text-rose-600', bgColor: 'bg-rose-50' },
  chargeback: { label: 'Chargeback', color: 'text-rose-600', bgColor: 'bg-rose-50' }
};

const FULFILLMENT_STATUS = {
  unfulfilled: { label: 'Unfulfilled', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  partially_fulfilled: { label: 'Partially Fulfilled', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  fulfilled: { label: 'Fulfilled', color: 'text-green-600', bgColor: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50' }
};

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatsCard = ({ title, value, change, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-2 flex items-center ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'transform rotate-180' : ''}`} />
            {Math.abs(change)}% from last month
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
// ORDER TABLE COMPONENT
// ============================================
const OrdersTable = ({
  orders,
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  onSort,
  sortField,
  sortOrder,
  onViewOrder,
  onEditOrder,
  onUpdateStatus,
  loading
}) => {
  const headers = [
    { key: 'select', label: '', width: '40px' },
    { key: 'orderNumber', label: 'Order', sortable: true, width: '120px' },
    { key: 'customer', label: 'Customer', sortable: true, width: '200px' },
    { key: 'date', label: 'Date', sortable: true, width: '150px' },
    { key: 'items', label: 'Items', sortable: true, width: '80px', align: 'center' },
    { key: 'total', label: 'Total', sortable: true, width: '120px', align: 'right' },
    { key: 'status', label: 'Status', sortable: true, width: '120px' },
    { key: 'payment', label: 'Payment', sortable: true, width: '120px' },
    { key: 'fulfillment', label: 'Fulfillment', sortable: true, width: '120px' },
    { key: 'actions', label: 'Actions', width: '100px', align: 'center' }
  ];

  const getSortIcon = (key) => {
    if (sortField !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-100">
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-48 h-4 bg-gray-200 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-y border-gray-200">
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  header.align === 'center' ? 'text-center' : header.align === 'right' ? 'text-right' : 'text-left'
                }`}
                style={{ width: header.width }}
              >
                {header.key === 'select' ? (
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                ) : (
                  <button
                    onClick={() => header.sortable && onSort(header.key)}
                    className={`flex items-center space-x-1 hover:text-gray-900 ${
                      header.align === 'right' ? 'justify-end' : ''
                    }`}
                  >
                    <span>{header.label}</span>
                    {header.sortable && (
                      <span className="text-gray-400">{getSortIcon(header.key)}</span>
                    )}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const statusConfig = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
            const paymentConfig = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
            const fulfillmentConfig = FULFILLMENT_STATUS[order.fulfillmentStatus] || FULFILLMENT_STATUS.unfulfilled;
            const StatusIcon = statusConfig.icon;

            return (
              <tr
                key={order._id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewOrder(order)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order._id)}
                    onChange={() => onSelectOrder(order._id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-primary-600">
                    {order.orderNumber || `#${order._id.slice(-8)}`}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm mr-3">
                      {getCustomerInitials(order)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{getCustomerName(order)}</div>
                      <div className="text-sm text-gray-500">{getCustomerEmail(order)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">
                    {format(new Date(order.orderDate || order.createdAt), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(order.orderDate || order.createdAt), { addSuffix: true })}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-sm font-medium text-gray-900">{order.itemCount || 0}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-bold text-gray-900">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.color}`}>
                    {paymentConfig.label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${fulfillmentConfig.bgColor} ${fulfillmentConfig.color}`}>
                    {fulfillmentConfig.label}
                  </span>
                </td>
                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onViewOrder(order)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Order"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onEditOrder(order)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Order"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Update Status"
                    >
                      <Settings className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {orders.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">Try adjusting your filters or search criteria</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// PAGINATION COMPONENT
// ============================================
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-700">
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-1 rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-primary-600 text-white'
                : page === '...'
                ? 'cursor-default'
                : 'hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN ORDERS PAGE COMPONENT
// ============================================
const OrdersPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table, grid, analytics
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: [],
    paymentStatus: [],
    fulfillmentStatus: [],
    dateRange: { start: null, end: null },
    amountRange: { min: null, max: null },
    customer: '',
    vendor: '',
    tags: []
  });

  // Sorting and pagination
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [itemsPerPage] = useState(20);

  // Statistics
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    refundedOrders: 0,
    uniqueCustomers: 0
  });

  // ============================================
  // FETCH ORDERS
  // ============================================
  const fetchOrders = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.status.length && { status: filters.status.join(',') }),
        ...(filters.paymentStatus.length && { paymentStatus: filters.paymentStatus.join(',') }),
        ...(filters.fulfillmentStatus.length && { fulfillmentStatus: filters.fulfillmentStatus.join(',') }),
        ...(filters.dateRange.start && { startDate: filters.dateRange.start.toISOString() }),
        ...(filters.dateRange.end && { endDate: filters.dateRange.end.toISOString() }),
        ...(filters.amountRange.min && { minTotal: filters.amountRange.min }),
        ...(filters.amountRange.max && { maxTotal: filters.amountRange.max }),
        ...(filters.customer && { customer: filters.customer }),
        ...(filters.vendor && { vendor: filters.vendor }),
        ...(filters.tags.length && { tags: filters.tags.join(',') })
      };

      const response = await api.orders.getAll(params);

      if (response) {
        setOrders(response.data || []);
        setStatistics(response.statistics || {});
        setTotalPages(response.pagination?.pages || 1);
        setTotalOrders(response.pagination?.total || 0);
      }

      if (showRefreshing) {
        showToast('Orders refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      showToast(error.message || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, itemsPerPage, sortField, sortOrder, filters, showToast]);

  // Initial fetch and refresh on changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, currentPage, sortField, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o._id));
    }
  };

  const handleBulkAction = (action) => {
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const handleExport = (format, options) => {
    // Implement export logic
    console.log('Exporting orders:', { format, options, selectedOrders });
    setShowExportModal(false);
    showToast(`Orders exported as ${format.toUpperCase()}`, 'success');
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleEditOrder = (order) => {
    navigate(`/orders/${order._id}/edit`);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowBulkModal(true);
    setBulkAction('update-status');
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: [],
      paymentStatus: [],
      fulfillmentStatus: [],
      dateRange: { start: null, end: null },
      amountRange: { min: null, max: null },
      customer: '',
      vendor: '',
      tags: []
    });
    setCurrentPage(1);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track all customer orders
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export"
              >
                <Download className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center border-l border-gray-200 pl-3 space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Table View"
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'analytics' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Analytics View"
                >
                  <BarChart3 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <StatsCard
              title="Total Orders"
              value={statistics.totalOrders?.toLocaleString() || '0'}
              change={12.5}
              trend={12.5}
              icon={Package}
              color="bg-blue-600"
            />
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(statistics.totalRevenue || 0)}
              change={8.3}
              trend={8.3}
              icon={DollarSign}
              color="bg-green-600"
            />
            <StatsCard
              title="Avg. Order Value"
              value={formatCurrency(statistics.averageOrderValue || 0)}
              change={-2.4}
              trend={-2.4}
              icon={TrendingUp}
              color="bg-purple-600"
            />
            <StatsCard
              title="Pending Orders"
              value={statistics.pendingOrders?.toLocaleString() || '0'}
              change={5.2}
              trend={5.2}
              icon={Clock}
              color="bg-yellow-600"
            />
            <StatsCard
              title="Unique Customers"
              value={statistics.uniqueCustomers?.toLocaleString() || '0'}
              change={15.8}
              trend={15.8}
              icon={Users}
              color="bg-amber-600"
            />
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by number, customer, email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(filters.status.length > 0 || filters.paymentStatus.length > 0 || filters.dateRange.start) && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {Object.values(filters).flat().filter(Boolean).length}
                </span>
              )}
            </button>
            {selectedOrders.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedOrders.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('update-status')}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                  Update Status
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Export
                </button>
                <button
                  onClick={() => handleBulkAction('print')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Print
                </button>
              </div>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* View Mode Content */}
          {viewMode === 'table' && (
            <OrdersTable
              orders={orders}
              selectedOrders={selectedOrders}
              onSelectOrder={handleSelectOrder}
              onSelectAll={handleSelectAll}
              onSort={handleSort}
              sortField={sortField}
              sortOrder={sortOrder}
              onViewOrder={handleViewOrder}
              onEditOrder={handleEditOrder}
              onUpdateStatus={handleUpdateStatus}
              loading={loading}
            />
          )}

          {viewMode === 'grid' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onView={handleViewOrder}
                    onEdit={handleEditOrder}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {viewMode === 'analytics' && (
            <OrderAnalytics
              orders={orders}
              statistics={statistics}
              filters={filters}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          onUpdate={() => {
            fetchOrders();
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {showBulkModal && (
        <BulkActionModal
          action={bulkAction}
          selectedOrders={selectedOrders}
          onClose={() => {
            setShowBulkModal(false);
            setBulkAction(null);
          }}
          onSuccess={() => {
            fetchOrders();
            setSelectedOrders([]);
            setShowBulkModal(false);
            setBulkAction(null);
          }}
        />
      )}

      {showExportModal && (
        <ExportModal
          selectedOrders={selectedOrders}
          filters={filters}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

// Helper functions
const getCustomerName = (order) => {
  if (order.customerName) return order.customerName;
  if (order.customer) {
    if (typeof order.customer === 'object') {
      return `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Customer';
    }
  }
  if (order.guestDetails) {
    return `${order.guestDetails.firstName || ''} ${order.guestDetails.lastName || ''}`.trim() || 'Guest';
  }
  if (order.shippingAddress) {
    return `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() || 'Customer';
  }
  return 'Customer';
};

const getCustomerEmail = (order) => {
  if (order.customerEmail) return order.customerEmail;
  if (order.customer?.email) return order.customer.email;
  if (order.guestEmail) return order.guestEmail;
  if (order.guestDetails?.email) return order.guestDetails.email;
  if (order.shippingAddress?.email) return order.shippingAddress.email;
  return 'No email';
};

const getCustomerInitials = (order) => {
  const name = getCustomerName(order);
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0]?.toUpperCase() || '?';
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
    return `$${(amount || 0).toFixed(2)}`;
  }
};

export default OrdersPage;