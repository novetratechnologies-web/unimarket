// admin/src/components/dashboard/CustomerInsights.jsx
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Repeat, 
  TrendingUp, 
  Clock,
  ShoppingBag,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  Activity,
  UserCheck,
  UserX,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import api from '../../api/api';
import { formatDistanceToNow, subDays } from 'date-fns';

const CustomerInsights = ({ timeRange = 'last30', startDate, endDate }) => {
  // ============================================
  // FETCH CUSTOMER STATS FROM DASHBOARD API
  // ============================================
  const { 
    data: stats,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard', 'customers', 'stats', timeRange, startDate, endDate],
    queryFn: async () => {
      console.log('📡 Fetching customer stats from dashboard API...');
      
      // Build query params
      const params = {
        timeRange,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };
      
      try {
        // ✅ FIXED: Use dashboard.getUserStats() instead of customers.getStats()
        const response = await api.dashboard.getUserStats(params);
        console.log('✅ Customer stats received:', response);
        
        // Handle different response structures
        if (response?.data) {
          return response.data;
        } else if (response?.success && response?.data) {
          return response.data;
        } else if (response) {
          return response;
        }
        
        // Return empty object if no data
        return {};
      } catch (err) {
        console.error('❌ Failed to fetch customer stats:', err);
        
        // If endpoint doesn't exist, try alternative endpoint
        try {
          console.log('📡 Trying alternative endpoint...');
          // ✅ FIXED: Use dashboard.getDashboardUsers() instead of customers.getAll()
          const altResponse = await api.dashboard.getDashboardUsers({ limit: 1 });
          console.log('✅ Alternative response:', altResponse);
          
          // If we can get users, return empty stats but not error
          return {};
        } catch (altErr) {
          console.error('❌ Alternative also failed:', altErr);
          throw err; // Throw original error
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    placeholderData: {}
  });

  // ============================================
  // FETCH CUSTOMER LIST FOR METRICS
  // ============================================
  const { data: customers = [] } = useQuery({
    queryKey: ['dashboard', 'customers', 'list', timeRange],
    queryFn: async () => {
      try {
        const params = {
          limit: 1000, // Get enough customers for stats
          ...(startDate && { createdAfter: startDate }),
          ...(endDate && { createdBefore: endDate })
        };
        
        // ✅ FIXED: Use dashboard.getDashboardUsers() instead of customers.getAll()
        const response = await api.dashboard.getDashboardUsers(params);
        
        // Extract users array from response
        if (response?.data?.users) {
          return response.data.users;
        } else if (response?.data && Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response?.users && Array.isArray(response.users)) {
          return response.users;
        }
        return [];
      } catch (err) {
        console.error('❌ Failed to fetch customer list:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !stats || Object.keys(stats).length === 0 // Only fetch if stats not available
  });

  // ============================================
  // FETCH RECENT CUSTOMER ACTIVITY
  // ============================================
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['dashboard', 'customers', 'recent', timeRange],
    queryFn: async () => {
      try {
        // ✅ FIXED: Use dashboard.getDashboardUsers() instead of customers.getAll()
        const response = await api.dashboard.getDashboardUsers({ 
          limit: 5,
          sortBy: 'lastActive',
          sortOrder: 'desc'
        });
        
        // Extract users from response
        if (response?.data?.users) {
          return response.data.users;
        } else if (response?.data && Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response?.users && Array.isArray(response.users)) {
          return response.users;
        }
        return [];
      } catch (err) {
        console.error('❌ Failed to fetch recent activity:', err);
        return [];
      }
    },
    staleTime: 30000
  });

  // ============================================
  // CALCULATE METRICS FROM CUSTOMER DATA
  // ============================================
  const metrics = useMemo(() => {
    // If we have stats from backend, use them
    if (stats && Object.keys(stats).length > 0) {
      return {
        total: stats.totalCustomers || stats.total || 0,
        new: stats.newCustomers || stats.new || 0,
        active: stats.activeCustomers || stats.active || 0,
        returning: stats.returningCustomers || stats.returning || 0,
        churned: stats.churnedCustomers || stats.churned || 0,
        ltv: stats.averageLTV || 0,
        aov: stats.averageOrderValue || 0,
        totalSpent: stats.totalRevenue || 0,
        repeatRate: stats.repeatPurchaseRate || 0,
        retentionRate: stats.retentionRate || 0,
        healthScore: stats.healthScore || 0,
        
        trends: stats.trends || {
          total: { percentage: 0, direction: 'up' },
          new: { percentage: 0, direction: 'up' },
          active: { percentage: 0, direction: 'up' }
        },
        
        retention: stats.retention || {
          d7: 0, d30: 0, d60: 0, d90: 0
        },
        
        acquisition: stats.acquisition || {},
        
        demographics: stats.demographics || {
          topLocation: 'N/A',
          topAgeGroup: 'N/A',
          topDevice: 'N/A'
        }
      };
    }
    
    // Otherwise calculate from customer list
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    const total = customers.length;
    const newCustomers = customers.filter(c => 
      c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo
    ).length;
    
    const activeCustomers = customers.filter(c => 
      c.lastActive && new Date(c.lastActive) >= thirtyDaysAgo
    ).length;
    
    const returningCustomers = customers.filter(c => 
      (c.orderCount || 0) > 1
    ).length;
    
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avgLTV = total > 0 ? totalSpent / total : 0;
    
    return {
      total,
      new: newCustomers,
      active: activeCustomers,
      returning: returningCustomers,
      churned: 0,
      ltv: avgLTV,
      aov: 0,
      totalSpent,
      repeatRate: total > 0 ? Math.round((returningCustomers / total) * 100) : 0,
      retentionRate: 0,
      healthScore: 0,
      
      trends: {
        total: { percentage: 0, direction: 'up' },
        new: { percentage: 0, direction: 'up' },
        active: { percentage: 0, direction: 'up' }
      },
      
      retention: {
        d7: 0, d30: 0, d60: 0, d90: 0
      },
      
      acquisition: {},
      
      demographics: {
        topLocation: 'N/A',
        topAgeGroup: 'N/A',
        topDevice: 'N/A'
      }
    };
  }, [stats, customers]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Customer Insights
            </h3>
            <p className="text-gray-600 text-sm mt-1">Loading customer data...</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Customer Insights
            </h3>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-3">Failed to load customer data</p>
          <p className="text-xs text-gray-500 mb-3">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (metrics.total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Customer Insights
            </h3>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No customer data available</p>
          <p className="text-sm text-gray-500">Try adjusting your date range</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Customer Insights
          </h3>
          <p className="text-gray-600 text-sm mt-1">Customer analytics and behavior</p>
        </div>
        <div className="flex items-center gap-2">
          {stats?.lastUpdated && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true })}
            </span>
          )}
          <button 
            onClick={() => refetch()}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <Loader2 className={`h-4 w-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Customers */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-blue-200 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-700" />
            </div>
            {metrics.trends.total?.percentage > 0 && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                metrics.trends.total.direction === 'up' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {metrics.trends.total.direction === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {metrics.trends.total.percentage}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.total.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">Total Customers</p>
        </div>

        {/* New Customers */}
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-green-200 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-green-700" />
            </div>
            {metrics.trends.new?.percentage > 0 && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                metrics.trends.new.direction === 'up' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {metrics.trends.new.direction === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {metrics.trends.new.percentage}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.new.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">New (30d)</p>
        </div>

        {/* Active Customers */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-purple-200 rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4 text-purple-700" />
            </div>
            {metrics.trends.active?.percentage > 0 && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                metrics.trends.active.direction === 'up' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {metrics.trends.active.direction === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {metrics.trends.active.percentage}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.active.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">Active (30d)</p>
        </div>

        {/* Returning Rate */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-orange-200 rounded-lg flex items-center justify-center">
              <Repeat className="h-4 w-4 text-orange-700" />
            </div>
            {metrics.repeatRate > 0 && (
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {metrics.repeatRate}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.returning.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">Returning customers</p>
        </div>
      </div>

      {/* Customer Value Metrics */}
      {(metrics.ltv > 0 || metrics.aov > 0 || metrics.totalSpent > 0) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {metrics.ltv > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 text-gray-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">${metrics.ltv.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Avg LTV</p>
            </div>
          )}
          {metrics.aov > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <ShoppingBag className="h-4 w-4 text-gray-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">${metrics.aov.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Avg Order</p>
            </div>
          )}
          {metrics.totalSpent > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Target className="h-4 w-4 text-gray-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">${metrics.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          )}
        </div>
      )}

      {/* Retention Rates */}
      {(metrics.retention.d7 > 0 || metrics.retention.d30 > 0 || metrics.retention.d90 > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              Customer Retention
            </h4>
            {metrics.retentionRate > 0 && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {metrics.retentionRate}% Overall
              </span>
            )}
          </div>
          <div className="space-y-3">
            {metrics.retention.d7 > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">7 Days</span>
                  <span className="font-medium text-gray-900">{metrics.retention.d7}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.retention.d7}%` }}
                  />
                </div>
              </div>
            )}
            {metrics.retention.d30 > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">30 Days</span>
                  <span className="font-medium text-gray-900">{metrics.retention.d30}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.retention.d30}%` }}
                  />
                </div>
              </div>
            )}
            {metrics.retention.d90 > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">90 Days</span>
                  <span className="font-medium text-gray-900">{metrics.retention.d90}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.retention.d90}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acquisition Channels */}
      {Object.keys(metrics.acquisition).length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
              <BarChart3 className="h-4 w-4 text-primary-600" />
              Acquisition Channels
            </h4>
            <span className="text-xs text-gray-500">Last 30 days</span>
          </div>
          <div className="space-y-2">
            {Object.entries(metrics.acquisition).map(([source, value]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 capitalize">{source}</span>
                <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-900 min-w-[40px] text-right">
                    {value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demographics & Health */}
      <div className="grid grid-cols-2 gap-4">
        {/* Demographics */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h5 className="text-xs font-medium text-gray-700 mb-3 flex items-center gap-1">
            <PieChart className="h-3 w-3" />
            Demographics
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Top Location</span>
              <span className="font-medium text-gray-900">{metrics.demographics.topLocation}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Age Group</span>
              <span className="font-medium text-gray-900">{metrics.demographics.topAgeGroup}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Device</span>
              <span className="font-medium text-gray-900">{metrics.demographics.topDevice}</span>
            </div>
          </div>
        </div>

        {/* Health Score */}
        {metrics.healthScore > 0 && (
          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-primary-700">Health Score</h5>
              <span className={`text-xs px-2 py-1 rounded-full ${
                metrics.healthScore >= 80 ? 'bg-green-100 text-green-700' :
                metrics.healthScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {metrics.healthScore >= 80 ? 'Excellent' :
                 metrics.healthScore >= 60 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-primary-700">{metrics.healthScore}</span>
                  <span className="text-xs text-primary-600 ml-1">/100</span>
                </div>
              </div>
              <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.healthScore}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary-600" />
            Recent Customer Activity
          </h4>
          <div className="space-y-3">
            {recentActivity.slice(0, 3).map((customer) => (
              <div key={customer._id} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {customer.avatar ? (
                    <img src={customer.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {customer.firstName?.[0]}{customer.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last active {formatDistanceToNow(new Date(customer.lastActive || customer.updatedAt || new Date()), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${(customer.totalSpent || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{customer.orderCount || 0} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInsights;