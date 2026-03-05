// ============================================
// components/dashboard/RecentActivity.jsx
// ============================================
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


import {
  ShoppingCart,
  Search,
  Package,
  Users,
  Store,
  DollarSign,
  CreditCard,
  UserPlus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Filter,
  Download,
  Eye,
  MoreVertical,
  MessageCircle,
  Star,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Mail,
  Phone,
  Calendar,
  Tag,
  Truck,
  Archive,
  Settings
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useInView } from 'react-intersection-observer';

// ============================================
// CONSTANTS
// ============================================
const ACTIVITY_TYPES = {
  ORDER_CREATED: {
    icon: ShoppingCart,
    label: 'Order Created',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  ORDER_UPDATED: {
    icon: Edit,
    label: 'Order Updated',
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  ORDER_COMPLETED: {
    icon: CheckCircle,
    label: 'Order Completed',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  ORDER_CANCELLED: {
    icon: AlertCircle,
    label: 'Order Cancelled',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  PRODUCT_ADDED: {
    icon: Package,
    label: 'Product Added',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200'
  },
  PRODUCT_UPDATED: {
    icon: Edit,
    label: 'Product Updated',
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200'
  },
  PRODUCT_DELETED: {
    icon: Trash2,
    label: 'Product Removed',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  PRODUCT_LOW_STOCK: {
    icon: AlertCircle,
    label: 'Low Stock Alert',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200'
  },
  VENDOR_ADDED: {
    icon: Store,
    label: 'Vendor Added',
    color: 'bg-teal-500',
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-200'
  },
  VENDOR_UPDATED: {
    icon: Edit,
    label: 'Vendor Updated',
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-200'
  },
  PAYMENT_RECEIVED: {
    icon: DollarSign,
    label: 'Payment Received',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200'
  },
  PAYMENT_PROCESSED: {
    icon: CreditCard,
    label: 'Payment Processed',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  PAYMENT_FAILED: {
    icon: AlertCircle,
    label: 'Payment Failed',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  CUSTOMER_REGISTERED: {
    icon: UserPlus,
    label: 'New Customer',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200'
  },
  CUSTOMER_UPDATED: {
    icon: Edit,
    label: 'Customer Updated',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-200'
  },
  REVIEW_ADDED: {
    icon: Star,
    label: 'New Review',
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  SUPPORT_TICKET: {
    icon: MessageCircle,
    label: 'Support Ticket',
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200'
  },
  SHIPMENT_CREATED: {
    icon: Truck,
    label: 'Shipment Created',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  SHIPMENT_DELIVERED: {
    icon: CheckCircle,
    label: 'Shipment Delivered',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  SYSTEM_ALERT: {
    icon: AlertCircle,
    label: 'System Alert',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  DEFAULT: {
    icon: Bell,
    label: 'Activity',
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200'
  }
};

const ACTIVITY_SEVERITY = {
  INFO: { label: 'Info', color: 'bg-blue-100 text-blue-700' },
  SUCCESS: { label: 'Success', color: 'bg-green-100 text-green-700' },
  WARNING: { label: 'Warning', color: 'bg-yellow-100 text-yellow-700' },
  ERROR: { label: 'Error', color: 'bg-red-100 text-red-700' }
};

// ============================================
// ACTIVITY ITEM COMPONENT
// ============================================
const ActivityItem = ({ activity, onAction, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const type = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.DEFAULT;
  const Icon = type.icon;

  // Format timestamp
  const timeAgo = useMemo(() => {
    const date = new Date(activity.timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  }, [activity.timestamp]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, backgroundColor: '#F9FAFB' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`h-10 w-10 rounded-xl ${type.lightColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${type.textColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {type.label}
            </span>
            {activity.severity && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                ACTIVITY_SEVERITY[activity.severity]?.color || 'bg-gray-100 text-gray-700'
              }`}>
                {activity.severity}
              </span>
            )}
            {activity.important && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Important
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">
            {activity.description}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            
            {activity.user && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {activity.user}
                </span>
              </>
            )}
            
            {activity.ip && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>IP: {activity.ip}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activity.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onAction && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onAction(activity);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-gray-100 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              {activity.details && Object.entries(activity.details).map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="ml-2 text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>

            {activity.metadata && (
              <pre className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Effect */}
      <AnimatePresence>
        {isHovered && !isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-2 border-primary-200 rounded-xl pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================
// ACTIVITY TIMELINE COMPONENT
// ============================================
const ActivityTimeline = ({ activities }) => {
  const groupedActivities = useMemo(() => {
    const groups = {};
    
    activities.forEach(activity => {
      const date = format(new Date(activity.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = {
          date: new Date(activity.timestamp),
          activities: []
        };
      }
      groups[date].activities.push(activity);
    });
    
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }, [activities]);

  return (
    <div className="space-y-6">
      {groupedActivities.map((group) => (
        <div key={group.date.toISOString()}>
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
              {isToday(group.date) ? 'Today' : 
               isYesterday(group.date) ? 'Yesterday' : 
               format(group.date, 'MMMM d, yyyy')}
            </h4>
          </div>
          
          <div className="space-y-3">
            {group.activities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                index={index}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// ACTIVITY STATS COMPONENT
// ============================================
const ActivityStats = ({ activities, onFilterChange }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const today = activities.filter(a => 
      isToday(new Date(a.timestamp))
    ).length;
    
    const thisWeek = activities.filter(a => {
      const date = new Date(a.timestamp);
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return date > weekAgo;
    }).length;

    const byType = {};
    activities.forEach(activity => {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
    });

    return { today, thisWeek, total: activities.length, byType };
  }, [activities]);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.today}</div>
        <div className="text-xs text-gray-500">Today</div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.thisWeek}</div>
        <div className="text-xs text-gray-500">This Week</div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-xs text-gray-500">Total</div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const RecentActivity = ({
  activities = [],
  onRefresh,
  onExport,
  onAction,
  isLoading = false,
  className = '',
  title = 'Recent Activity',
  showHeader = true,
  showStats = true,
  showFilters = true,
  maxItems = 50,
  realtime = true
}) => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list, timeline, compact
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.type === filter);
    }

    // Apply selected types filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(a => selectedTypes.includes(a.type));
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.description.toLowerCase().includes(query) ||
        a.user?.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query)
      );
    }

    // Apply date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      if (dateRange === 'today') {
        cutoff.setHours(0, 0, 0, 0);
        filtered = filtered.filter(a => new Date(a.timestamp) >= cutoff);
      } else if (dateRange === 'week') {
        cutoff.setDate(cutoff.getDate() - 7);
        filtered = filtered.filter(a => new Date(a.timestamp) >= cutoff);
      } else if (dateRange === 'month') {
        cutoff.setMonth(cutoff.getMonth() - 1);
        filtered = filtered.filter(a => new Date(a.timestamp) >= cutoff);
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit items
    return filtered.slice(0, maxItems);
  }, [activities, filter, selectedTypes, searchQuery, dateRange, maxItems]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExport = () => {
    onExport?.(filteredActivities);
  };

  // Get unique activity types for filter
  const activityTypes = useMemo(() => {
    const types = new Set(activities.map(a => a.type));
    return Array.from(types);
  }, [activities]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-primary-600" />
                {title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track all activities across your platform
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                  title="List view"
                >
                  <div className="space-y-0.5">
                    <div className="w-3 h-0.5 bg-current rounded-sm" />
                    <div className="w-3 h-0.5 bg-current rounded-sm" />
                    <div className="w-3 h-0.5 bg-current rounded-sm" />
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'timeline' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                  title="Timeline view"
                >
                  <Calendar className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'compact' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                  }`}
                  title="Compact view"
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm" />
                    <div className="w-1.5 h-1.5 bg-current rounded-sm" />
                  </div>
                </button>
              </div>

              {/* Auto Refresh Toggle */}
              {realtime && (
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-colors ${
                    autoRefresh ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Auto refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Export Button */}
              {onExport && (
                <button
                  onClick={handleExport}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          {showStats && <ActivityStats activities={filteredActivities} />}

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                {activityTypes.map(type => (
                  <option key={type} value={type}>
                    {ACTIVITY_TYPES[type]?.label || type}
                  </option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>

              {/* Clear Filters */}
              {(searchQuery || filter !== 'all' || dateRange !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                    setDateRange('all');
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity List */}
      <div className="p-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ActivityIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h4>
            <p className="text-gray-500 max-w-md mx-auto">
              Activities will appear here as they happen across your platform.
            </p>
          </div>
        ) : viewMode === 'timeline' ? (
          <ActivityTimeline activities={filteredActivities} />
        ) : viewMode === 'compact' ? (
          <div className="space-y-2">
            {filteredActivities.map((activity, index) => {
              const type = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.DEFAULT;
              const Icon = type.icon;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg ${type.lightColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${type.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {activity.important && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onAction={onAction}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredActivities.length === maxItems && activities.length > maxItems && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            Showing {maxItems} of {activities.length} activities
          </p>
        </div>
      )}
    </div>
  );
};

// Helper component for ActivityIcon
const ActivityIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

export default RecentActivity;