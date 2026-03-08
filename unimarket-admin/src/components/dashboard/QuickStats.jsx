import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign,  // ✅ Make sure this is imported
  Clock,
  Calendar,
  Zap,
  Award,
  Star,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';

const QuickStats = ({ stats = null, loading = false }) => {
  // Default mock data with safe defaults
  const defaultStats = {
    today: {
      visitors: 1234,
      orders: 89,
      revenue: 12450,
      conversion: 3.2
    },
    yesterday: {
      visitors: 1156,
      orders: 78,
      revenue: 11230,
      conversion: 2.9
    },
    week: {
      visitors: 8450,
      orders: 567,
      revenue: 78900,
      growth: 12.5
    },
    month: {
      visitors: 32450,
      orders: 2345,
      revenue: 345600,
      growth: 8.3
    },
    topStats: [
      { label: 'Avg. Order Value', value: 142.50, change: 5.2, trend: 'up', icon: DollarSign },
      { label: 'Customer Lifetime', value: '28 days', change: 2.1, trend: 'up', icon: Clock },
      { label: 'Repeat Rate', value: '34%', change: -1.5, trend: 'down', icon: Users },
      { label: 'Satisfaction', value: '4.8/5', change: 0.3, trend: 'up', icon: Star }
    ],
    alerts: [
      { type: 'warning', message: 'Low stock on 5 products', count: 5 },
      { type: 'success', message: '3 new orders received', count: 3 },
      { type: 'info', message: '2 vendors pending approval', count: 2 }
    ]
  };

  // Merge with provided stats and ensure all required properties exist
  const data = {
    today: stats?.today || defaultStats.today,
    yesterday: stats?.yesterday || defaultStats.yesterday,
    week: stats?.week || defaultStats.week,
    month: stats?.month || defaultStats.month,
    topStats: stats?.topStats || defaultStats.topStats,
    alerts: stats?.alerts || defaultStats.alerts
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-6 w-24 bg-gray-300 rounded animate-pulse mb-2"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, trend: 'up' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      trend: change >= 0 ? 'up' : 'down'
    };
  };

  // Safe access with fallbacks
  const todayVisitors = data.today?.visitors || 0;
  const yesterdayVisitors = data.yesterday?.visitors || 0;
  const todayOrders = data.today?.orders || 0;
  const yesterdayOrders = data.yesterday?.orders || 0;
  const todayRevenue = data.today?.revenue || 0;
  const yesterdayRevenue = data.yesterday?.revenue || 0;
  const todayConversion = data.today?.conversion || 3.2;
  
  const todayVsYesterday = calculateChange(todayVisitors, yesterdayVisitors);
  const ordersChange = calculateChange(todayOrders, yesterdayOrders);
  const revenueChange = calculateChange(todayRevenue, yesterdayRevenue);

  // Safe access for topStats
  const avgOrderValue = data.topStats[0]?.value || 142.50;
  const avgOrderChange = data.topStats[0]?.change || 5.2;
  const customerLifetime = data.topStats[1]?.value || '28 days';
  const customerLifetimeChange = data.topStats[1]?.change || 2.1;
  const repeatRate = data.topStats[2]?.value || '34%';
  const repeatRateChange = data.topStats[2]?.change || -1.5;
  const satisfaction = data.topStats[3]?.value || '4.8/5';
  const satisfactionChange = data.topStats[3]?.change || 0.3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Visitors */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              todayVsYesterday.trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {todayVsYesterday.trend === 'up' ? '+' : '-'}{todayVsYesterday.value}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(todayVisitors)}
          </div>
          <div className="text-sm text-gray-600">Today's Visitors</div>
          <div className="text-xs text-gray-500 mt-2">
            vs {formatNumber(yesterdayVisitors)} yesterday
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              ordersChange.trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {ordersChange.trend === 'up' ? '+' : '-'}{ordersChange.value}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(todayOrders)}
          </div>
          <div className="text-sm text-gray-600">Today's Orders</div>
          <div className="text-xs text-gray-500 mt-2">
            vs {formatNumber(yesterdayOrders)} yesterday
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              revenueChange.trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {revenueChange.trend === 'up' ? '+' : '-'}{revenueChange.value}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(todayRevenue)}
          </div>
          <div className="text-sm text-gray-600">Today's Revenue</div>
          <div className="text-xs text-gray-500 mt-2">
            vs {formatCurrency(yesterdayRevenue)} yesterday
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
              +0.3%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {todayConversion}%
          </div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
          <div className="text-xs text-gray-500 mt-2">
            Target: 3.5%
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Weekly Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">This Week</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{formatNumber(data.week?.visitors || 0)}</div>
          <div className="text-xs text-gray-600">visitors</div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3" /> {data.week?.growth || 0}%
            </span>
            <span className="text-gray-500">vs last week</span>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">This Month</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(data.month?.revenue || 0)}</div>
          <div className="text-xs text-gray-600">revenue</div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3" /> {data.month?.growth || 0}%
            </span>
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">Avg Order</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(avgOrderValue)}</div>
          <div className="text-xs text-gray-600">per order</div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3" /> +{avgOrderChange}%
            </span>
          </div>
        </div>

        {/* Customer Lifetime */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-600">Lifetime</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{customerLifetime}</div>
          <div className="text-xs text-gray-600">avg customer</div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3" /> +{customerLifetimeChange}%
            </span>
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.topStats.map((stat, index) => {
          const Icon = stat.icon || DollarSign;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="h-6 w-6 bg-gray-100 rounded flex items-center justify-center">
                  <Icon className="h-3 w-3 text-gray-600" />
                </div>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change || 0}%
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-900">{stat.value || 0}</div>
              <div className="text-xs text-gray-500">{stat.label || ''}</div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Quick Alerts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.alerts.map((alert, index) => (
              <div
                key={index}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                  alert.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  alert.type === 'success' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}
              >
                {alert.count && (
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                    alert.type === 'warning' ? 'bg-yellow-600 text-white' :
                    alert.type === 'success' ? 'bg-green-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {alert.count}
                  </span>
                )}
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bars */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Monthly Goal</span>
            <span className="font-medium text-gray-900">78%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full" style={{ width: '78%' }} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Quarterly Target</span>
            <span className="font-medium text-gray-900">45%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
      </div>

      {/* Achievement Badge */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-600" />
          <div>
            <div className="text-sm font-medium text-gray-900">Gold Status Unlocked!</div>
            <div className="text-xs text-gray-600">You've reached 1000 orders milestone</div>
          </div>
        </div>
        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
      </div>
    </motion.div>
  );
};

export default QuickStats;