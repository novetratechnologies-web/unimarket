// admin/src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  ArrowUpRight,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  Wallet,
  Star,
  Store,
  Zap,
  Clock,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Gift,
  Settings,
  LogOut,
  Filter,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  FileText,
  Printer,
  Mail,
  Bell,
  Search,
  Grid,
  List,
  ChevronDown,
  MoreVertical,
  Loader2,
  History,
  Plus,
  Edit,
  Trash2,
  Eye as ViewIcon,
  Copy,
  ExternalLink,
  Home,
  Users as UsersIcon,
  ShoppingBag,
  Truck,
  CreditCard,
  DollarSign as DollarIcon,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  Target,
  Award,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  Server,
  Database,
  Cloud,
  Shield as ShieldIcon,
  Lock,
  Unlock,
  Key,
  UserPlus,
  UserMinus,
  UserCheck,
  Mail as MailIcon,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  HelpCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radio,
  ToggleLeft,
  ToggleRight,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Upload,
  Download as DownloadIcon,
  Save,
  Trash,
  Edit as EditIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, formatDistance, formatRelative } from 'date-fns';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// API & Store
import api from '../api/api';
import { useDashboardStore } from '../pages/stores/dashboardStore';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';

// Lazy load components for better performance
const StatCard = lazy(() => import('../components/dashboard/StatCard'));
const SalesChart = lazy(() => import('../components/dashboard/SalesChart'));
const RecentOrders = lazy(() => import('../components/dashboard/RecentOrders'));
const TopProducts = lazy(() => import('../components/dashboard/TopProducts'));
const ActivityFeed = lazy(() => import('../components/dashboard/ActivityFeed'));
const CustomerInsights = lazy(() => import('../components/dashboard/CustomerInsights'));
const SystemHealth = lazy(() => import('../components/dashboard/SystemHealth'));
const DateRangePicker = lazy(() => import('../components/dashboard/DateRangePicker'));
const LoadingSkeleton = lazy(() => import('../components/LoadingSkeleton'));
const QuickActions = lazy(() => import('../components/dashboard/QuickActions'));
const NotificationsPanel = lazy(() => import('../components/dashboard/NotificationsPanel'));
const RevenueBreakdown = lazy(() => import('../components/dashboard/RevenueBreakdown'));
const VendorPerformance = lazy(() => import('../components/dashboard/VendorPerformance'));
const GoalProgress = lazy(() => import('../components/dashboard/GoalProgress'));
const ProductCategories = lazy(() => import('../components/dashboard/ProductCategories'));
const TrafficSources = lazy(() => import('../components/dashboard/TrafficSources'));
const DeviceBreakdown = lazy(() => import('../components/dashboard/DeviceBreakdown'));
const GeographicDistribution = lazy(() => import('../components/dashboard/GeographicDistribution'));
const PerformanceMetrics = lazy(() => import('../components/dashboard/PerformanceMetrics'));
const RecentActivity = lazy(() => import('../components/dashboard/RecentActivity'));
const PendingActions = lazy(() => import('../components/dashboard/PendingActions'));
const WelcomeBanner = lazy(() => import('../components/dashboard/WelcomeBanner'));
const QuickStats = lazy(() => import('../components/dashboard/QuickStats'));

// ============================================
// CONSTANTS
// ============================================
const TIME_RANGES = {
  today: { label: 'Today', value: 'today', days: 0, interval: 'hour' },
  yesterday: { label: 'Yesterday', value: 'yesterday', days: 1, interval: 'hour' },
  last7: { label: 'Last 7 Days', value: 'last7', days: 7, interval: 'day' },
  last30: { label: 'Last 30 Days', value: 'last30', days: 30, interval: 'day' },
  last90: { label: 'Last 90 Days', value: 'last90', days: 90, interval: 'week' },
  thisMonth: { label: 'This Month', value: 'thisMonth', days: 'month', interval: 'week' },
  lastMonth: { label: 'Last Month', value: 'lastMonth', days: 'lastMonth', interval: 'week' },
  thisYear: { label: 'This Year', value: 'thisYear', days: 365, interval: 'month' }
};

const CHART_COLORS = {
  revenue: '#3B82F6',
  orders: '#10B981',
  customers: '#8B5CF6',
  products: '#F59E0B',
  refunds: '#EF4444',
  profit: '#8B5CF6',
  sales: '#3B82F6',
  visitors: '#8B5CF6',
  conversion: '#10B981'
};

const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const LAYOUT_OPTIONS = {
  GRID: 'grid',
  LIST: 'list'
};

// ============================================
// FETCH WITH TIMEOUT UTILITY
// ============================================
const fetchWithTimeout = async (promise, timeoutMs = 8000) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  return Promise.race([promise, timeout]);
};

// ============================================
// DASHBOARD COMPONENT
// ============================================
const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { user, checkAuth, logout, hasPermission } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [timeRange, setTimeRange] = useLocalStorage('dashboard-timeRange', 'last30');
  const [dateRange, setDateRange] = useState(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), 30));
    return { start, end };
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [authVerified, setAuthVerified] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [viewMode, setViewMode] = useLocalStorage('dashboard-viewMode', LAYOUT_OPTIONS.GRID);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [fullscreenWidget, setFullscreenWidget] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loadingError, setLoadingError] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  
  // Activity feed filters
  const [activityFilters, setActivityFilters] = useState({
    types: [],
    categories: [],
    severities: []
  });
  const [activityLimit] = useState(10);
  const [autoRefreshActivity] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // ============================================
  // ZUSTAND STORE
  // ============================================
  const { 
    hiddenMetrics, 
    toggleMetric, 
    preferences,
    updatePreferences
  } = useDashboardStore();

  // ============================================
  // WEBSOCKET CONNECTION FOR REAL-TIME UPDATES
  // ============================================
  const { connectionStatus } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
    enabled: preferences?.enableRealtime && authVerified,
    onMessage: (data) => {
      handleWebSocketMessage(data);
    },
    onReconnect: () => {
      showToast({
        title: 'Reconnected',
        description: 'Real-time connection restored',
        type: 'success'
      });
    }
  });

  // ============================================
  // AUTHENTICATION CHECK
  // ============================================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isValid = await checkAuth();
        
        if (!isValid) {
          console.log('⛔ Not authenticated, redirecting...');
          navigate('/login', { 
            replace: true, 
            state: { from: '/dashboard', reason: 'auth_required' }
          });
          return;
        }

        setAuthVerified(true);
        setAuthError(null);
        
        console.log('✅ Auth verified for:', user?.email);
        
      } catch (error) {
        console.error('❌ Auth verification failed:', error);
        
        if (error.response?.status === 401) {
          api.clearAuth();
          await logout();
          navigate('/login', { 
            replace: true, 
            state: { sessionExpired: true } 
          });
        } else {
          setAuthError('Unable to verify session. Some features may be limited.');
          setAuthVerified(true);
        }
      }
    };

    verifyAuth();
  }, [checkAuth, navigate, logout, user?.email]);

  // ============================================
  // FETCH DASHBOARD STATS
  // ============================================
  const { 
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    dataUpdatedAt: statsUpdatedAt
  } = useQuery({
    queryKey: ['dashboard', 'stats', timeRange, dateRange.start, dateRange.end],
    queryFn: async () => {
      console.log('📡 Fetching dashboard stats...');
      try {
        const response = await fetchWithTimeout(
          api.dashboard.getStats({
            period: timeRange,
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString()
          })
        );
        return response?.data || {};
      } catch (error) {
        console.error('Stats fetch timeout/error:', error);
        setLoadingError('Failed to load dashboard stats. Retrying...');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: authVerified,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchInterval: preferences?.autoRefresh ? preferences?.refreshInterval : false,
  });

// ============================================
// FETCH REVENUE ANALYTICS
// ============================================
const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
  queryKey: ['dashboard', 'revenue', timeRange, dateRange.start, dateRange.end],
  queryFn: async () => {
    try {
      const response = await fetchWithTimeout(
        api.dashboard.getRevenue({
          interval: TIME_RANGES[timeRange]?.interval || 'day',
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      );
      // ✅ Fixed: response.data.timeline (not response?.data?.timeline)
      return response?.data?.timeline || [];
    } catch (error) {
      console.error('Revenue fetch error:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
  enabled: authVerified && !!stats,
});

// ============================================
// FETCH SALES ANALYTICS
// ============================================
const { data: salesData = [], isLoading: salesLoading } = useQuery({
  queryKey: ['dashboard', 'sales', timeRange, dateRange.start, dateRange.end],
  queryFn: async () => {
    try {
      const response = await fetchWithTimeout(
        api.dashboard.getSales({
          type: 'overview',
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      );
      // ✅ Fixed: response.data.data (first data is from API wrapper, second is from controller)
      return response?.data?.data || [];
    } catch (error) {
      console.error('Sales fetch error:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
  enabled: authVerified && !!stats,
});

// ============================================
// FETCH RECENT ORDERS
// ============================================
const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
  queryKey: ['dashboard', 'recentOrders', dateRange.start, dateRange.end],
  queryFn: async () => {
    try {
      const response = await fetchWithTimeout(
        api.dashboard.getRecentOrders({  // Use the new method
          limit: 10,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      );
      
      console.log('📦 Recent orders response:', response);
      
      // Handle the response based on your backend structure
      let ordersData = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (Array.isArray(response)) {
        ordersData = response;
      }
      
      return ordersData;
    } catch (error) {
      console.error('Recent orders fetch error:', error);
      return [];
    }
  },
  staleTime: 60000,
  refetchInterval: preferences?.enableRealtime ? 30000 : false,
  enabled: authVerified
});
// ============================================
// FETCH TOP PRODUCTS
// ============================================
const { data: topProducts = [], isLoading: productsLoading } = useQuery({
  queryKey: ['dashboard', 'topProducts', timeRange, dateRange.start, dateRange.end],
  queryFn: async () => {
    try {
      // ✅ Fixed: Using api.dashboard.getTopProducts() instead of api.products.getAll()
      const response = await fetchWithTimeout(
        api.dashboard.getTopProducts({
          limit: 10,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      );
      // ✅ Fixed: response.data.data (depends on your API response structure)
      return response?.data?.data || [];
    } catch (error) {
      console.error('Products fetch error:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
  enabled: authVerified
});

// ============================================
// FETCH CUSTOMER INSIGHTS
// ============================================
const { 
  data: customerData = {}, 
  isLoading: customerLoading,
  error: customerError,
  refetch: refetchCustomers
} = useQuery({
  queryKey: ['dashboard', 'customers', timeRange, dateRange.start, dateRange.end],
  queryFn: async () => {
    console.log('📡 Fetching customer insights...');
    
    try {
      const response = await fetchWithTimeout(
        api.dashboard.getUsers({
          type: 'overview',
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      );
      console.log('✅ Customer insights received:', response);
      // ✅ Fixed: response.data.data (depends on your API response structure)
      return response?.data?.data || {};
    } catch (err) {
      console.error('❌ Failed to fetch customer insights:', err);
      return {};
    }
  },
  staleTime: 5 * 60 * 1000,
  enabled: authVerified && hasPermission('customers.view'),
  retry: 2
});

// ============================================
// FETCH VENDOR PERFORMANCE
// ============================================
const { data: vendorsData = [], isLoading: vendorsLoading } = useQuery({
  queryKey: ['dashboard', 'vendors', timeRange, dateRange.start, dateRange.end],
  queryFn: async () => {
    try {
      const response = await fetchWithTimeout(
        api.dashboard.getVendors({
          type: 'top',
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      );
      // ✅ Fixed: response.data.data (depends on your API response structure)
      return response?.data?.data || [];
    } catch (error) {
      console.error('Vendors fetch error:', error);
      return [];
    }
  },
  staleTime: 5 * 60 * 1000,
  enabled: authVerified && hasPermission('vendors.view')
});

// ============================================
// FETCH SYSTEM HEALTH
// ============================================
const { data: systemHealth = { status: 'healthy' } } = useQuery({
  queryKey: ['dashboard', 'systemHealth'],
  queryFn: async () => {
    try {
      const response = await fetchWithTimeout(
        api.dashboard.getPerformance({
          type: 'overview'
        })
      );
      // ✅ Fixed: response.data.data (depends on your API response structure)
      return response?.data?.data || { status: 'healthy' };
    } catch (error) {
      console.error('System health fetch error:', error);
      return { status: 'healthy' };
    }
  },
  staleTime: 60000,
  refetchInterval: 60000,
  enabled: authVerified && hasPermission('system.view')
});

// ============================================
// FETCH PRODUCT CATEGORIES
// ============================================
const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
  queryKey: ['dashboard', 'categories'],
  queryFn: async () => {
    console.log('📡 Fetching categories from dashboard API...');
    
    try {
      const response = await fetchWithTimeout(
        api.dashboard.getCategories({
          limit: 10,
          sortBy: 'productCount',
          sortOrder: 'desc'
        }),
        8000
      );
      
      console.log('📦 Categories response:', response);
      
      // Handle response based on your API structure
      let categories = [];
      if (response?.data && Array.isArray(response.data)) {
        categories = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      } else if (Array.isArray(response)) {
        categories = response;
      }
      
      console.log(`✅ Loaded ${categories.length} categories`);
      return categories;
      
    } catch (error) {
      console.error('❌ Categories fetch error:', error);
      return [];
    }
  },
  staleTime: 30 * 60 * 1000, // 30 minutes
  enabled: authVerified,
  retry: 2,
  retryDelay: 1000
});

// ============================================
// FETCH NOTIFICATIONS
// ============================================
const { 
  data: notificationsData, 
  refetch: refetchNotifications,
  isLoading: notificationsLoading
} = useQuery({
  queryKey: ['notifications', 'recent'],
  queryFn: async () => {
    try {
      const response = await fetchWithTimeout(
        api.notifications.getAll({ 
          limit: 10,
          unreadOnly: true
        }),
        5000
      );
      
      console.log('🔍 Notifications API response:', response);
      
      let notifications = [];
      let unreadCount = 0;
      
      if (response) {
        // ✅ Fixed: Handle different response structures
        if (response.success && response.data) {
          // Standard API wrapper
          notifications = response.data.notifications || [];
          unreadCount = response.data.unreadCount || 0;
        } else if (response.notifications) {
          // Direct notifications object
          notifications = response.notifications;
          unreadCount = response.unreadCount || 0;
        } else if (Array.isArray(response)) {
          // Array response
          notifications = response;
          unreadCount = response.length;
        }
      }
      
      return {
        notifications,
        unreadCount
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  },
  staleTime: 30000,
  refetchInterval: 60000,
  enabled: authVerified,
  retry: 1
});

const notifications = notificationsData?.notifications || [];
const unreadCount = notificationsData?.unreadCount || 0;
  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetchWithTimeout(
          api.activities?.getAll?.({ 
            search: debouncedSearch, 
            limit: 5 
          }),
          3000
        );
        setSearchResults(response?.data || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  // ============================================
  // HANDLE WEBSOCKET MESSAGES
  // ============================================
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'NEW_ORDER':
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentOrders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'revenue'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'sales'] });
        showToast({
          title: 'New Order',
          description: `Order #${data.orderId} received`,
          type: 'info'
        });
        break;
        
      case 'STATS_UPDATE':
        queryClient.setQueryData(['dashboard', 'stats'], (oldData) => ({
          ...oldData,
          ...data.stats
        }));
        break;
        
      case 'ALERT':
        setActiveAlerts(prev => [...prev, data.alert]);
        showToast({
          title: data.alert.title,
          description: data.alert.message,
          type: data.alert.severity
        });
        break;
        
      case 'ACTIVITY':
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        break;
        
      case 'NOTIFICATION':
        refetchNotifications();
        showToast({
          title: data.notification.title,
          description: data.notification.message,
          type: 'info'
        });
        break;
        
      default:
        break;
    }
  }, [queryClient, showToast, refetchNotifications]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLoadingError(null);
    try {
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['activities'] })
      ]);
      
      showToast({ 
        title: 'Dashboard Updated', 
        description: 'Latest data loaded successfully', 
        type: 'success'
      });
    } catch (error) {
      showToast({ 
        title: 'Refresh Failed', 
        description: 'Some data could not be loaded', 
        type: 'warning' 
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, showToast]);

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
    const config = TIME_RANGES[range];
    
    if (config) {
      const end = endOfDay(new Date());
      let start;
      
      switch (range) {
        case 'today':
          start = startOfDay(new Date());
          break;
        case 'yesterday':
          start = startOfDay(subDays(new Date(), 1));
          break;
        case 'thisMonth':
          start = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
          break;
        case 'lastMonth':
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          start = startOfDay(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1));
          end.setDate(0); // Last day of previous month
          break;
        default:
          start = startOfDay(subDays(new Date(), config.days));
      }
      
      setDateRange({ start, end });
    }
  }, [setTimeRange]);

  const handleExport = useCallback(async (format = 'csv') => {
    setIsExporting(true);
    try {
      showToast({
        title: 'Export Started',
        description: `Preparing ${format.toUpperCase()} export...`,
        type: 'info'
      });
      
      const response = await fetchWithTimeout(
        api.dashboard.exportReport?.({
          reportType: 'dashboard',
          format,
          timeRange,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
      );
      
      if (response) {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `dashboard-export-${format(new Date(), 'yyyy-MM-dd')}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      showToast({
        title: 'Export Complete',
        description: `Dashboard data exported as ${format.toUpperCase()}`,
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Export Failed',
        description: error.message,
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  }, [timeRange, dateRange, showToast]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetchWithTimeout(api.notifications.markAllAsRead());
      await refetchNotifications();
      showToast({
        title: 'Success',
        description: 'All notifications marked as read',
        type: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        type: 'error'
      });
    }
  }, [refetchNotifications, showToast]);

  const toggleWidgetFullscreen = (widgetId) => {
    setFullscreenWidget(fullscreenWidget === widgetId ? null : widgetId);
  };

  const handleActivityClick = useCallback((activity, link) => {
    if (link) {
      navigate(link);
    } else if (activity?.resourceId && activity?.resourceType) {
      navigate(`/admin/${activity.resourceType}s/${activity.resourceId}`);
    }
  }, [navigate]);

  // ============================================
  // MEMOIZED DATA
  // ============================================
  const statsData = useMemo(() => {
    if (!stats) return null;

    return {
      overview: [
        {
          id: 'revenue',
          title: 'Total Revenue',
          value: stats?.overview?.totalRevenue || 0,
          formattedValue: new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD', 
            notation: 'compact',
            maximumFractionDigits: 1
          }).format(stats?.overview?.totalRevenue || 0),
          change: stats?.trends?.revenue?.percentage || 0,
          trend: stats?.trends?.revenue?.direction || 'up',
          icon: DollarSign,
          color: 'from-emerald-500 to-teal-500',
          bgColor: 'bg-emerald-50',
          tooltip: 'Total revenue including all sales',
          sparkline: stats?.metrics?.revenueSparkline || []
        },
        {
          id: 'orders',
          title: 'Total Orders',
          value: stats?.overview?.totalOrders || 0,
          formattedValue: new Intl.NumberFormat('en-US', { 
            notation: 'compact' 
          }).format(stats?.overview?.totalOrders || 0),
          change: stats?.trends?.orders?.percentage || 0,
          trend: stats?.trends?.orders?.direction || 'up',
          icon: ShoppingCart,
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          tooltip: 'Total number of orders placed',
          sparkline: stats?.metrics?.ordersSparkline || []
        },
        {
          id: 'customers',
          title: 'Active Customers',
          value: stats?.overview?.activeCustomers || 0,
          formattedValue: new Intl.NumberFormat('en-US', { 
            notation: 'compact' 
          }).format(stats?.overview?.activeCustomers || 0),
          change: stats?.trends?.customers?.percentage || 0,
          trend: stats?.trends?.customers?.direction || 'up',
          icon: Users,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50',
          tooltip: 'Customers who made a purchase',
          sparkline: stats?.metrics?.customersSparkline || []
        },
        {
          id: 'conversion',
          title: 'Conversion Rate',
          value: stats?.overview?.conversionRate || 0,
          formattedValue: `${(stats?.overview?.conversionRate || 0).toFixed(1)}%`,
          change: stats?.trends?.conversion?.percentage || 0,
          trend: stats?.trends?.conversion?.direction || 'up',
          icon: TrendingUp,
          color: 'from-orange-500 to-red-500',
          bgColor: 'bg-orange-50',
          tooltip: 'Percentage of visitors who purchase',
          sparkline: stats?.metrics?.conversionSparkline || []
        }
      ],
      performance: [
        {
          id: 'aov',
          title: 'Avg. Order Value',
          value: stats?.overview?.averageOrderValue || 0,
          formattedValue: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(stats?.overview?.averageOrderValue || 0),
          change: stats?.trends?.aov?.percentage || 0,
          trend: stats?.trends?.aov?.direction || 'up',
          icon: Wallet,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          target: stats?.goals?.aov || 100,
          progress: ((stats?.overview?.averageOrderValue || 0) / (stats?.goals?.aov || 100)) * 100
        },
        {
          id: 'profit',
          title: 'Net Profit',
          value: stats?.overview?.netProfit || 0,
          formattedValue: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact'
          }).format(stats?.overview?.netProfit || 0),
          change: stats?.trends?.profit?.percentage || 0,
          trend: stats?.trends?.profit?.direction || 'up',
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          target: stats?.goals?.profit || 50000,
          progress: ((stats?.overview?.netProfit || 0) / (stats?.goals?.profit || 50000)) * 100
        },
        {
          id: 'satisfaction',
          title: 'Customer Satisfaction',
          value: stats?.overview?.satisfactionScore || 0,
          formattedValue: `${(stats?.overview?.satisfactionScore || 0).toFixed(1)}/5`,
          change: stats?.trends?.satisfaction?.percentage || 0,
          trend: stats?.trends?.satisfaction?.direction || 'up',
          icon: Star,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          target: 5,
          progress: ((stats?.overview?.satisfactionScore || 0) / 5) * 100
        },
        {
          id: 'retention',
          title: 'Retention Rate',
          value: stats?.overview?.retentionRate || 0,
          formattedValue: `${(stats?.overview?.retentionRate || 0).toFixed(1)}%`,
          change: stats?.trends?.retention?.percentage || 0,
          trend: stats?.trends?.retention?.direction || 'up',
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          target: 80,
          progress: stats?.overview?.retentionRate || 0
        }
      ]
    };
  }, [stats]);

  // ============================================
  // QUICK ACTIONS BASED ON PERMISSIONS
  // ============================================
  const quickActions = useMemo(() => [
    { 
      label: 'Add Product', 
      icon: Package, 
      onClick: () => navigate('/products/add'),
      color: 'from-blue-500 to-blue-600',
      permission: 'products.create',
      shortcut: '⌘P',
      description: 'Create a new product'
    },
    { 
      label: 'Create Order', 
      icon: ShoppingCart, 
      onClick: () => navigate('/orders/create'),
      color: 'from-green-500 to-green-600',
      permission: 'orders.create',
      shortcut: '⌘O',
      description: 'Process a new order'
    },
    { 
      label: 'Add Vendor', 
      icon: Store, 
      onClick: () => navigate('/vendors/add'),
      color: 'from-purple-500 to-purple-600',
      permission: 'vendors.create',
      shortcut: '⌘V',
      description: 'Onboard a new vendor'
    },
    { 
      label: 'View Reports', 
      icon: BarChart3, 
      onClick: () => navigate('/analytics'),
      color: 'from-orange-500 to-orange-600',
      permission: 'reports.view',
      shortcut: '⌘R',
      description: 'View detailed analytics'
    },
    { 
      label: 'Process Payouts', 
      icon: Wallet, 
      onClick: () => navigate('/vendors/payouts'),
      color: 'from-indigo-500 to-indigo-600',
      permission: 'payouts.process',
      shortcut: '⌘W',
      description: 'Process vendor payouts'
    },
    { 
      label: 'Generate Report', 
      icon: FileText, 
      onClick: () => handleExport('pdf'),
      color: 'from-pink-500 to-pink-600',
      permission: 'reports.generate',
      shortcut: '⌘G',
      description: 'Export dashboard data'
    }
  ].filter(action => !action.permission || hasPermission(action.permission)), [navigate, hasPermission, handleExport]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (!authVerified || (statsLoading && !stats)) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <LoadingSkeleton />
      </Suspense>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (authError || (statsError && !stats)) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[600px] p-8"
      >
        <div className="bg-red-50 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-600 mb-6">{authError || statsError?.message || loadingError}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setLoadingError(null);
                refetchStats();
              }} 
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout} 
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      }
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS}
          className="space-y-6 p-4 lg:p-6 bg-gray-50 min-h-screen"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  {connectionStatus === 'connected' ? (
                    <Activity className="h-6 w-6 text-green-400" />
                  ) : (
                    <Activity className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl lg:text-3xl font-bold">Dashboard Overview</h1>
                    {connectionStatus === 'connected' && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                        <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mt-1">
                    Welcome back, {user?.firstName || user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* View Tabs */}
                <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setSelectedView('overview')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedView === 'overview' 
                        ? 'bg-white text-gray-900' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setSelectedView('analytics')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedView === 'analytics' 
                        ? 'bg-white text-gray-900' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setSelectedView('reports')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedView === 'reports' 
                        ? 'bg-white text-gray-900' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Reports
                  </button>
                </div>

                {/* Search */}
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                  />
                  
                  {/* Search Results */}
                  <AnimatePresence>
                    {showSearchResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                      >
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-0"
                            onClick={() => {
                              if (result.link) navigate(result.link);
                              setShowSearchResults(false);
                              setSearchQuery('');
                            }}
                          >
                            <History className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{result.description}</div>
                              <div className="text-xs text-gray-500">
                                {result.userEmail} • {formatDistance(new Date(result.createdAt), new Date(), { addSuffix: true })}
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors relative"
                    disabled={notificationsLoading}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 z-50"
                      >
                        <Suspense fallback={
                          <div className="bg-white rounded-xl shadow-xl p-4 w-80">
                            <div className="animate-pulse space-y-3">
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                              <div className="h-12 bg-gray-100 rounded"></div>
                              <div className="h-12 bg-gray-100 rounded"></div>
                            </div>
                          </div>
                        }>
                          <NotificationsPanel
                            notifications={notifications}
                            onClose={() => setShowNotifications(false)}
                            onMarkAllRead={handleMarkAllRead}
                            onRefresh={refetchNotifications}
                            onNotificationClick={(notification) => {
                              setShowNotifications(false);
                              if (notification.link) {
                                navigate(notification.link);
                              } else if (notification.data?.link) {
                                navigate(notification.data.link);
                              } else if (notification.resourceId && notification.resourceType) {
                                navigate(`/admin/${notification.resourceType}s/${notification.resourceId}`);
                              }
                            }}
                          />
                        </Suspense>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Time Range Selector */}
                <select 
                  value={timeRange} 
                  onChange={(e) => handleTimeRangeChange(e.target.value)} 
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(TIME_RANGES).map(([key, { label }]) => (
                    <option key={key} value={key} className="bg-gray-800">{label}</option>
                  ))}
                </select>

                {/* Date Range Picker */}
                <Suspense fallback={<div className="h-10 w-40 bg-white/10 rounded-xl animate-pulse" />}>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                  />
                </Suspense>

                {/* Refresh Button */}
                <button 
                  onClick={handleRefresh} 
                  disabled={isRefreshing} 
                  className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>

                {/* Export Dropdown */}
                <div className="relative group">
                  <button 
                    className="p-2 bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button 
                      onClick={() => handleExport('csv')} 
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      disabled={isExporting}
                    >
                      Export as CSV
                    </button>
                    <button 
                      onClick={() => handleExport('json')} 
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      disabled={isExporting}
                    >
                      Export as JSON
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout} 
                  className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      alert.severity === 'error' ? 'bg-red-500/20 text-red-300' :
                      alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    <AlertCircle className="h-3 w-3" />
                    {alert.message}
                    <button
                      onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                      className="ml-1 hover:opacity-70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Loading Error Banner */}
            {loadingError && (
              <div className="mt-4 p-3 bg-yellow-500/20 text-yellow-300 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{loadingError}</span>
                <button
                  onClick={() => setLoadingError(null)}
                  className="ml-auto hover:opacity-70"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <Suspense fallback={<div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />}>
            <QuickActions actions={quickActions} />
          </Suspense>

          {/* Welcome Banner for first-time users */}
          {!stats?.overview?.totalOrders && (
            <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
              <WelcomeBanner user={user} />
            </Suspense>
          )}

          {/* Main Content - Overview View */}
          {selectedView === 'overview' && (
            <>
              {/* Stats Grid */}
              {statsData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsData.overview.map((stat, index) => (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <StatCard 
                        {...stat} 
                        isHidden={hiddenMetrics.includes(stat.id)}
                        onToggle={() => toggleMetric(stat.id)}
                        onFullscreen={() => toggleWidgetFullscreen(stat.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Quick Stats (smaller metrics) */}
              <Suspense fallback={<div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />}>
                <QuickStats stats={stats} />
              </Suspense>

              {/* Goal Progress */}
              {stats?.goals && stats.goals.length > 0 && (
                <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
                  <GoalProgress goals={stats.goals} />
                </Suspense>
              )}

              {/* Main Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary-600" />
                          Revenue Analytics
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">Track your revenue over time</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select 
                          value={selectedMetric}
                          onChange={(e) => setSelectedMetric(e.target.value)}
                          className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="revenue">Revenue</option>
                          <option value="orders">Orders</option>
                          <option value="customers">Customers</option>
                          <option value="profit">Profit</option>
                        </select>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                          <button 
                            onClick={() => setViewMode(LAYOUT_OPTIONS.GRID)}
                            className={`p-2 rounded-lg transition-colors ${
                              viewMode === LAYOUT_OPTIONS.GRID ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                            }`}
                            title="Grid view"
                          >
                            <Grid className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setViewMode(LAYOUT_OPTIONS.LIST)}
                            className={`p-2 rounded-lg transition-colors ${
                              viewMode === LAYOUT_OPTIONS.LIST ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                            }`}
                            title="List view"
                          >
                            <List className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <Suspense fallback={<div className="h-[350px] bg-gray-100 rounded-xl animate-pulse" />}>
                      <SalesChart 
                        data={revenueData} 
                        period={timeRange}
                        height={350}
                        color={CHART_COLORS[selectedMetric]}
                        loading={revenueLoading}
                      />
                    </Suspense>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5 text-primary-600" />
                          Recent Orders
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">Latest transactions</p>
                      </div>
                      <button 
                        onClick={() => navigate('/orders')}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        View All
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                    <Suspense fallback={<div className="space-y-4"><div className="h-16 bg-gray-100 rounded-xl animate-pulse" /></div>}>
                      <RecentOrders 
                        orders={recentOrders} 
                        loading={ordersLoading}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>

              {/* Secondary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Feed */}
                <Suspense fallback={<div className="h-[500px] bg-gray-100 rounded-2xl animate-pulse" />}>
                  <ActivityFeed 
                    limit={activityLimit}
                    showViewAll={true}
                    autoRefresh={autoRefreshActivity}
                    refreshInterval={30000}
                    onActivityClick={handleActivityClick}
                    filterTypes={activityFilters.types}
                    filterCategories={activityFilters.categories}
                    filterSeverity={activityFilters.severities}
                    showFilters={showFilters}
                    className="h-full"
                  />
                </Suspense>

                {/* Top Products */}
                <Suspense fallback={<div className="h-[500px] bg-gray-100 rounded-2xl animate-pulse" />}>
                  <TopProducts 
                    products={topProducts} 
                    loading={productsLoading}
                  />
                </Suspense>
              </div>

              {/* Pending Actions */}
              <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
                <PendingActions stats={stats} />
              </Suspense>

              {/* Customer Insights */}
              {hasPermission('customers.view') && (
                <div className="w-full">
                  <Suspense fallback={<div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />}>
                    <CustomerInsights 
                      data={customerData}
                      loading={customerLoading}
                      timeRange={timeRange}
                    />
                  </Suspense>
                </div>
              )}

              {/* Performance Metrics */}
              {statsData?.performance && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsData.performance.map((metric, index) => (
                    <motion.div
                      key={metric.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`h-12 w-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                            <metric.icon className={`h-6 w-6 ${metric.color}`} />
                          </div>
                          <span className={`text-sm font-medium ${
                            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.trend === 'up' ? '+' : ''}{metric.change}%
                          </span>
                        </div>
                        <h4 className="text-sm text-gray-600 mb-1">{metric.title}</h4>
                        <div className="text-2xl font-bold text-gray-900 mb-3">{metric.formattedValue}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(metric.progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>Target: {metric.target}{metric.title.includes('Rate') ? '%' : ''}</span>
                          <span>{Math.min(metric.progress, 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Analytics View */}
          {selectedView === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <Suspense fallback={<div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />}>
                  <RevenueBreakdown data={revenueData} loading={revenueLoading} />
                </Suspense>

                {/* Product Categories */}
                <Suspense fallback={<div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />}>
                  <ProductCategories data={categoriesData} />
                </Suspense>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Sources */}
                <Suspense fallback={<div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />}>
                  <TrafficSources />
                </Suspense>

                {/* Device Breakdown */}
                <Suspense fallback={<div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />}>
                  <DeviceBreakdown />
                </Suspense>
              </div>

              {/* Geographic Distribution */}
              <Suspense fallback={<div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />}>
                <GeographicDistribution />
              </Suspense>

              {/* Vendor Performance */}
              {hasPermission('vendors.view') && (
                <Suspense fallback={<div className="h-[400px] bg-gray-100 rounded-2xl animate-pulse" />}>
                  <VendorPerformance data={vendorsData} loading={vendorsLoading} />
                </Suspense>
              )}
            </div>
          )}

          {/* Reports View */}
          {selectedView === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Generate Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Sales Report', icon: BarChart3, color: 'blue', description: 'Detailed sales analysis' },
                    { name: 'Tax Report', icon: FileText, color: 'green', description: 'Tax collection summary' },
                    { name: 'Inventory Report', icon: Package, color: 'purple', description: 'Stock level report' },
                    { name: 'Customer Report', icon: Users, color: 'orange', description: 'Customer analytics' },
                    { name: 'Vendor Report', icon: Store, color: 'pink', description: 'Vendor performance' },
                    { name: 'Payout Report', icon: Wallet, color: 'indigo', description: 'Payout history' }
                  ].map((report, index) => (
                    <button
                      key={index}
                      onClick={() => handleExport('pdf')}
                      className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all text-left group"
                    >
                      <div className={`h-10 w-10 bg-${report.color}-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <report.icon className={`h-5 w-5 text-${report.color}-600`} />
                      </div>
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Health */}
          {hasPermission('system.view') && (
            <Suspense fallback={<div className="h-[200px] bg-gray-100 rounded-2xl animate-pulse" />}>
              <SystemHealth data={systemHealth} />
            </Suspense>
          )}

          {/* Performance Metrics - Always visible */}
          <Suspense fallback={<div className="h-[300px] bg-gray-100 rounded-2xl animate-pulse" />}>
            <PerformanceMetrics data={stats} />
          </Suspense>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 pt-6 border-t">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Last updated: {statsUpdatedAt ? format(statsUpdatedAt, 'HH:mm:ss') : 'N/A'}</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${systemHealth?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`} />
                <span>
                  {systemHealth?.status === 'healthy' ? 'All systems operational' : 'System issues detected'}
                </span>
              </div>
              {connectionStatus !== 'connected' && (
                <>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>Reconnecting...</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/settings')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <span className="text-xs">v{import.meta.env.VITE_APP_VERSION || '2.0.0'}</span>
            </div>
          </div>
        </motion.div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default Dashboard;