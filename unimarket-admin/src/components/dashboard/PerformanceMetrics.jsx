// admin/src/components/dashboard/PerformanceMetrics.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Server, 
  Database, 
  Clock, 
  Zap, 
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Cpu,
  HardDrive,
  Wifi,
  Shield
} from 'lucide-react';

const PerformanceMetrics = ({ data = null, loading = false }) => {
  const [timeRange, setTimeRange] = useState('hour');

  // Default mock data with the correct structure
  const defaultData = {
    status: 'healthy',
    uptime: 99.98,
    responseTimes: {  // Changed from responseTime to responseTimes
      average: 245,
      p95: 450,
      p99: 800,
      max: 1200
    },
    requests: {
      total: 15234,
      perSecond: 12.5,
      success: 15102,
      failed: 132,
      successRate: 99.13
    },
    database: {
      connections: 42,
      queriesPerSecond: 85,
      avgQueryTime: 120,
      cacheHitRate: 87.5,
      size: '2.4 GB',
      indexes: 24
    },
    api: {
      endpoints: 48,
      avgResponseTime: 210,
      errorRate: 0.87,
      slowEndpoints: 3,
      responseTimes: {  // Add this for API response times
        average: 210,
        p95: 380,
        p99: 650
      }
    },
    cache: {
      hitRate: 92.3,
      memory: '156 MB',
      keys: 2345,
      evictions: 12
    },
    resources: {
      cpu: 42,
      memory: 58,
      disk: 34,
      network: 23
    }
  };

  // Merge with API data
  const metrics = {
    ...defaultData,
    ...(data || {}),
    // Ensure nested objects exist
    responseTimes: data?.api?.responseTimes || defaultData.responseTimes,
    api: {
      ...defaultData.api,
      ...(data?.api || {})
    },
    database: {
      ...defaultData.database,
      ...(data?.database || {})
    },
    requests: {
      ...defaultData.requests,
      ...(data?.requests || {})
    },
    cache: {
      ...defaultData.cache,
      ...(data?.cache || {})
    },
    resources: {
      ...defaultData.resources,
      ...(data?.resources || {})
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const formatTime = (ms) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            System Performance
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Real-time metrics and system health
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getStatusColor(metrics.status)}`}>
            {getHealthIcon(metrics.status)}
            <span className="text-sm font-medium capitalize">{metrics.status}</span>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {['hour', 'day', 'week'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Uptime</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.uptime}%</div>
          <div className="text-xs text-gray-600 mt-1">Last 30 days</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Response Time</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatTime(metrics.responseTimes?.average)}</div>
          <div className="text-xs text-gray-600 mt-1">P95: {formatTime(metrics.responseTimes?.p95)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Database className="h-4 w-4" />
            <span className="text-xs font-medium">DB Queries</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics.database?.queriesPerSecond)}/s</div>
          <div className="text-xs text-gray-600 mt-1">Cache: {metrics.database?.cacheHitRate}%</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <Server className="h-4 w-4" />
            <span className="text-xs font-medium">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.requests?.successRate}%</div>
          <div className="text-xs text-gray-600 mt-1">{formatNumber(metrics.requests?.failed)} failed</div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Resource Usage</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Cpu className="h-3 w-3" /> CPU
              </span>
              <span className="font-medium text-gray-900">{metrics.resources?.cpu}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.resources?.cpu || 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Database className="h-3 w-3" /> Memory
              </span>
              <span className="font-medium text-gray-900">{metrics.resources?.memory}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.resources?.memory || 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <HardDrive className="h-3 w-3" /> Disk
              </span>
              <span className="font-medium text-gray-900">{metrics.resources?.disk}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.resources?.disk || 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Wifi className="h-3 w-3" /> Network
              </span>
              <span className="font-medium text-gray-900">{metrics.resources?.network}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.resources?.network || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Performance */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary-600" />
            API Performance
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Endpoints</span>
              <span className="font-medium text-gray-900">{metrics.api?.endpoints || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="font-medium text-gray-900">{formatTime(metrics.api?.avgResponseTime)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Error Rate</span>
              <span className={`font-medium ${(metrics.api?.errorRate || 0) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.api?.errorRate || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Slow Endpoints</span>
              <span className={`font-medium ${(metrics.api?.slowEndpoints || 0) > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                {metrics.api?.slowEndpoints || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Database Performance */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-primary-600" />
            Database Performance
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active Connections</span>
              <span className="font-medium text-gray-900">{metrics.database?.connections || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Avg Query Time</span>
              <span className="font-medium text-gray-900">{formatTime(metrics.database?.avgQueryTime)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Cache Hit Rate</span>
              <span className="font-medium text-green-600">{metrics.database?.cacheHitRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Database Size</span>
              <span className="font-medium text-gray-900">{metrics.database?.size || '0 MB'}</span>
            </div>
          </div>
        </div>

        {/* Cache Performance */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary-600" />
            Cache Performance
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Hit Rate</span>
              <span className="font-medium text-green-600">{metrics.cache?.hitRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Memory Usage</span>
              <span className="font-medium text-gray-900">{metrics.cache?.memory || '0 MB'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Keys</span>
              <span className="font-medium text-gray-900">{formatNumber(metrics.cache?.keys)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Evictions</span>
              <span className="font-medium text-gray-900">{formatNumber(metrics.cache?.evictions)}</span>
            </div>
          </div>
        </div>

        {/* Request Metrics */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary-600" />
            Request Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-medium text-gray-900">{formatNumber(metrics.requests?.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Requests/sec</span>
              <span className="font-medium text-gray-900">{metrics.requests?.perSecond || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Successful</span>
              <span className="font-medium text-green-600">{formatNumber(metrics.requests?.success)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Failed</span>
              <span className="font-medium text-red-600">{formatNumber(metrics.requests?.failed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Time Distribution */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Response Time Distribution</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">Avg</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${((metrics.responseTimes?.average || 0) / (metrics.responseTimes?.max || 1000)) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-900 w-16">{formatTime(metrics.responseTimes?.average)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">P95</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-yellow-600 rounded-full"
                style={{ width: `${((metrics.responseTimes?.p95 || 0) / (metrics.responseTimes?.max || 1000)) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-900 w-16">{formatTime(metrics.responseTimes?.p95)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">P99</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-orange-600 rounded-full"
                style={{ width: `${((metrics.responseTimes?.p99 || 0) / (metrics.responseTimes?.max || 1000)) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-900 w-16">{formatTime(metrics.responseTimes?.p99)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-12">Max</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-red-600 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <span className="text-xs font-medium text-gray-900 w-16">{formatTime(metrics.responseTimes?.max)}</span>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Metrics
        </button>
      </div>
    </motion.div>
  );
};

export default PerformanceMetrics;