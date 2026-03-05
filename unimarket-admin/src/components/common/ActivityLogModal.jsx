// admin/src/components/common/ActivityLogModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Clock,
  LogIn,
  LogOut,
  Smartphone,
  Globe,
  MapPin,
  Fingerprint,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Monitor,
  Tablet,
  Phone,
  Laptop,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  User,
  Mail,
  Lock,
  Unlock,
  Key,
  KeyRound,
  AlertTriangle,
  Info,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  Wifi as WifiIcon,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  WifiHigh,
  WifiLow,
  WifiZero,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

const ActivityLogModal = ({ customer, onClose }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    status: 'all'
  });
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });

  useEffect(() => {
    fetchActivityLogs();
  }, [pagination.page]);

  useEffect(() => {
    applyFilters();
  }, [activities, filters, dateRange]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching activities for customer:', customer?._id, customer?.email);
      
      if (!customer?._id) {
        console.error('❌ No customer ID provided');
        setLoading(false);
        return;
      }

      const response = await api.get(`/admin/activities/user/${customer._id}`, {
        params: {
          days: 30, // Get last 30 days
          limit: 100 // Get up to 100 activities
        }
      });

      console.log('📡 API Response:', response);

      if (response?.success) {
        // The response structure from your backend
        const timeline = response.data?.timeline || [];
        const userInfo = response.data?.user;
        
        // Flatten timeline activities and add user info
        const allActivities = timeline.flatMap(day => 
          day.activities.map(activity => ({
            ...activity,
            user: userInfo,
            userEmail: userInfo?.email,
            timestamp: activity.time,
            createdAt: activity.time,
            type: activity.action || activity.type || 'activity',
            status: activity.status || 'info',
            action: activity.action,
            resourceType: activity.resourceType
          }))
        ) || [];
        
        console.log('📊 Processed activities:', allActivities.length);
        setActivities(allActivities);
        setFilteredActivities(allActivities);
        
        setPagination(prev => ({
          ...prev,
          total: response.data?.totalActivities || allActivities.length,
          pages: Math.ceil((response.data?.totalActivities || allActivities.length) / prev.limit)
        }));
      } else {
        console.error('❌ API response not successful:', response);
        showToast('Failed to fetch activity logs', 'error');
      }
    } catch (error) {
      console.error('❌ Failed to fetch activity logs:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      showToast(error.message || 'Failed to fetch activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(a => a.type === filters.type || a.action === filters.type);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      filtered = filtered.filter(a => {
        const activityDate = new Date(a.timestamp);
        switch (filters.dateRange) {
          case 'today':
            return activityDate >= today;
          case 'yesterday':
            return activityDate >= yesterday && activityDate < today;
          case 'week':
            return activityDate >= weekAgo;
          case 'month':
            return activityDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Custom date range
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(a => {
        const activityDate = new Date(a.timestamp);
        return activityDate >= new Date(dateRange.start) && activityDate <= new Date(dateRange.end);
      });
    }

    setFilteredActivities(filtered);
  };

  const handleRefresh = async () => {
    await fetchActivityLogs();
    showToast('Activity logs refreshed', 'success');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredActivities, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `activity-${customer?.email || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Activity logs exported', 'success');
  };

  const getActivityIcon = (type) => {
    const actionType = type?.toLowerCase() || '';
    
    if (actionType.includes('login')) return <LogIn className="h-4 w-4 text-green-600" />;
    if (actionType.includes('logout')) return <LogOut className="h-4 w-4 text-orange-600" />;
    if (actionType.includes('device')) return <Smartphone className="h-4 w-4 text-blue-600" />;
    if (actionType.includes('security') || actionType.includes('2fa') || actionType.includes('password')) 
      return <Shield className="h-4 w-4 text-purple-600" />;
    if (actionType.includes('profile') || actionType.includes('user')) 
      return <User className="h-4 w-4 text-indigo-600" />;
    if (actionType.includes('order')) return <ShoppingCart className="h-4 w-4 text-amber-600" />;
    if (actionType.includes('payment') || actionType.includes('payout')) 
      return <CreditCard className="h-4 w-4 text-emerald-600" />;
    if (actionType.includes('create')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (actionType.includes('update') || actionType.includes('edit')) 
      return <Edit className="h-4 w-4 text-blue-600" />;
    if (actionType.includes('delete')) return <Trash2 className="h-4 w-4 text-red-600" />;
    if (actionType.includes('view') || actionType.includes('read')) 
      return <Eye className="h-4 w-4 text-blue-600" />;
    
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getActivityColor = (type) => {
    const actionType = type?.toLowerCase() || '';
    
    if (actionType.includes('login')) return 'text-green-600 bg-green-100';
    if (actionType.includes('logout')) return 'text-orange-600 bg-orange-100';
    if (actionType.includes('device')) return 'text-blue-600 bg-blue-100';
    if (actionType.includes('security')) return 'text-purple-600 bg-purple-100';
    if (actionType.includes('profile')) return 'text-indigo-600 bg-indigo-100';
    if (actionType.includes('order')) return 'text-amber-600 bg-amber-100';
    if (actionType.includes('payment')) return 'text-emerald-600 bg-emerald-100';
    if (actionType.includes('create')) return 'text-green-600 bg-green-100';
    if (actionType.includes('update')) return 'text-blue-600 bg-blue-100';
    if (actionType.includes('delete')) return 'text-red-600 bg-red-100';
    if (actionType.includes('view')) return 'text-blue-600 bg-blue-100';
    
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
      case 'failure':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor className="h-3 w-3" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('android') && ua.includes('mobile')) {
      return <Phone className="h-3 w-3" />;
    }
    if (ua.includes('ipad') || ua.includes('tablet')) {
      return <Tablet className="h-3 w-3" />;
    }
    if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) {
      return <Laptop className="h-3 w-3" />;
    }
    return <Monitor className="h-3 w-3" />;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '—';
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm:ss a');
    } catch {
      return '—';
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '—';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '—';
    }
  };

  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    const browsers = [
      { name: 'Chrome', pattern: /chrome/i },
      { name: 'Firefox', pattern: /firefox/i },
      { name: 'Safari', pattern: /safari/i },
      { name: 'Edge', pattern: /edge/i },
      { name: 'Opera', pattern: /opera|opr/i },
      { name: 'IE', pattern: /msie|trident/i }
    ];

    for (const browser of browsers) {
      if (browser.pattern.test(userAgent)) {
        return browser.name;
      }
    }
    return 'Unknown';
  };

  const getOSInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    const osList = [
      { name: 'Windows', pattern: /windows/i },
      { name: 'macOS', pattern: /macintosh|mac os x/i },
      { name: 'iOS', pattern: /iphone|ipad|ipod/i },
      { name: 'Android', pattern: /android/i },
      { name: 'Linux', pattern: /linux/i }
    ];

    for (const os of osList) {
      if (os.pattern.test(userAgent)) {
        return os.name;
      }
    }
    return 'Unknown';
  };

  const getActivityTypeDisplay = (activity) => {
    if (activity.action) {
      return activity.action.charAt(0).toUpperCase() + activity.action.slice(1).replace(/_/g, ' ');
    }
    if (activity.type) {
      return activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
    }
    return 'Activity';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with blur */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4 relative">
            <div className="absolute inset-0 opacity-10" 
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` 
                }}
              />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Activity Log</h3>
                    <p className="text-sm text-white/80 mt-0.5">
                      {customer?.firstName || ''} {customer?.lastName || ''} • {customer?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefresh}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors group relative"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4 text-white" />
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Refresh
                    </span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors group relative"
                    title="Export"
                  >
                    <Download className="h-4 w-4 text-white" />
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Export
                    </span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mt-4 relative z-10">
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <p className="text-xs text-white/70">Total Activities</p>
                  <p className="text-sm font-semibold text-white">{activities.length}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <p className="text-xs text-white/70">Logins</p>
                  <p className="text-sm font-semibold text-white">
                    {activities.filter(a => 
                      (a.type?.toLowerCase().includes('login') || 
                       a.action?.toLowerCase().includes('login'))
                    ).length}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <p className="text-xs text-white/70">Security Events</p>
                  <p className="text-sm font-semibold text-white">
                    {activities.filter(a => 
                      (a.type?.toLowerCase().includes('security') || 
                       a.action?.toLowerCase().includes('security') ||
                       a.action?.toLowerCase().includes('password') ||
                       a.action?.toLowerCase().includes('2fa'))
                    ).length}
                  </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <p className="text-xs text-white/70">Failed Attempts</p>
                  <p className="text-sm font-semibold text-white">
                    {activities.filter(a => 
                      a.status === 'failed' || a.status === 'failure'
                    ).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">All Activities</option>
                <option value="login">Logins</option>
                <option value="logout">Logouts</option>
                <option value="security">Security</option>
                <option value="profile">Profile</option>
                <option value="order">Orders</option>
                <option value="payment">Payments</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
                <option value="view">Viewed</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>

              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end || ''}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {(filters.type !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all' || dateRange.start) && (
                <button
                  onClick={() => {
                    setFilters({ type: 'all', status: 'all', dateRange: 'all' });
                    setDateRange({ start: null, end: null });
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Activity List */}
          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
                <p className="text-gray-500">No activity logs match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredActivities.map((activity, index) => {
                  const isExpanded = expandedActivity === index;
                  
                  return (
                    <div key={index} className="hover:bg-gray-50 transition-colors">
                      <div className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`p-2 rounded-lg ${getActivityColor(activity.type || activity.action)}`}>
                              {getActivityIcon(activity.type || activity.action)}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-medium text-gray-900">
                                  {getActivityTypeDisplay(activity)}
                                </span>
                                {activity.resourceType && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {activity.resourceType}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatDateTime(activity.timestamp)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ({formatRelativeTime(activity.timestamp)})
                                </span>
                              </div>
                              
                              {activity.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {activity.description}
                                </p>
                              )}
                              
                              <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex items-center text-xs text-gray-600">
                                  {getDeviceIcon(activity.userAgent)}
                                  <span className="ml-1">
                                    {getBrowserInfo(activity.userAgent)} on {getOSInfo(activity.userAgent)}
                                  </span>
                                </div>
                                
                                {activity.ipAddress && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Globe className="h-3 w-3 mr-1" />
                                    {activity.ipAddress}
                                  </div>
                                )}
                                
                                <div className="flex items-center text-xs">
                                  {getStatusIcon(activity.status)}
                                  <span className={`ml-1 ${
                                    activity.status === 'success' ? 'text-green-600' :
                                    activity.status === 'failed' || activity.status === 'failure' ? 'text-red-600' :
                                    activity.status === 'warning' ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`}>
                                    {activity.status || 'info'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setExpandedActivity(isExpanded ? null : index)}
                            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pl-11">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Device Info */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Device Information
                                  </h4>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="text-gray-500">User Agent:</span>{' '}
                                      <span className="text-gray-900 break-all">{activity.userAgent || '—'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Device:</span>{' '}
                                      <span className="text-gray-900">
                                        {activity.deviceInfo || 'Unknown'}
                                      </span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Browser:</span>{' '}
                                      <span className="text-gray-900">{getBrowserInfo(activity.userAgent)}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">OS:</span>{' '}
                                      <span className="text-gray-900">{getOSInfo(activity.userAgent)}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Location Info */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Location Information
                                  </h4>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="text-gray-500">IP Address:</span>{' '}
                                      <span className="text-gray-900">{activity.ipAddress || '—'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Location:</span>{' '}
                                      <span className="text-gray-900">{activity.location || 'Unknown'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">ISP:</span>{' '}
                                      <span className="text-gray-900">{activity.isp || '—'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Timezone:</span>{' '}
                                      <span className="text-gray-900">{activity.timezone || '—'}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Session Info */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Session Information
                                  </h4>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="text-gray-500">Session ID:</span>{' '}
                                      <span className="text-gray-900">{activity.sessionId || '—'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Duration:</span>{' '}
                                      <span className="text-gray-900">{activity.duration || '—'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Pages Viewed:</span>{' '}
                                      <span className="text-gray-900">{activity.pagesViewed || 0}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Actions:</span>{' '}
                                      <span className="text-gray-900">{activity.actions || 0}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Security Info */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Security Information
                                  </h4>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="text-gray-500">Auth Method:</span>{' '}
                                      <span className="text-gray-900">{activity.authMethod || '—'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">2FA Used:</span>{' '}
                                      <span className="text-gray-900">{activity.twoFactor ? 'Yes' : 'No'}</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Risk Score:</span>{' '}
                                      <span className={`text-sm font-medium ${
                                        (activity.riskScore || 0) < 30 ? 'text-green-600' :
                                        (activity.riskScore || 0) < 70 ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>
                                        {activity.riskScore || 0}%
                                      </span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="text-gray-500">Flags:</span>{' '}
                                      <span className="text-gray-900">
                                        {activity.flags?.length ? activity.flags.join(', ') : 'None'}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Metadata */}
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Additional Data
                                  </h4>
                                  <pre className="text-xs bg-white p-3 rounded-lg border border-gray-200 overflow-auto max-h-40">
                                    {JSON.stringify(activity.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredActivities.length} of {activities.length} activities
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
  );
};

export default ActivityLogModal;