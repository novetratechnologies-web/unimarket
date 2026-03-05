import React, { useMemo } from 'react'
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  HardDrive
} from 'lucide-react'

const SystemHealth = ({ metrics = {}, realtime = {} }) => {
  const health = useMemo(() => ({
    status: metrics.status || 'healthy',
    uptime: metrics.uptime || 99.98,
    responseTime: {
      avg: metrics.responseTime?.avg || 245,
      p95: metrics.responseTime?.p95 || 520,
      p99: metrics.responseTime?.p99 || 890
    },
    errorRate: metrics.errorRate || 0.12,
    apiCalls: metrics.apiCalls?.total || 1245678,
    cacheHitRate: metrics.cacheHitRate || 86.5,
    storage: {
      database: metrics.storage?.database || 2345,
      uploads: metrics.storage?.uploads || 1876,
      logs: metrics.storage?.logs || 543
    }
  }), [metrics])

  const services = useMemo(() => [
    { name: 'API Gateway', status: 'operational', latency: 45, uptime: 99.99 },
    { name: 'Database', status: 'operational', latency: 12, uptime: 99.99 },
    { name: 'Redis Cache', status: 'operational', latency: 2, uptime: 100 },
    { name: 'Storage Service', status: 'operational', latency: 85, uptime: 99.95 },
    { name: 'Email Service', status: 'operational', latency: 230, uptime: 99.90 },
    { name: 'Payment Gateway', status: 'operational', latency: 320, uptime: 99.97 }
  ], [])

  const getStatusColor = (status) => {
    switch(status) {
      case 'operational': return 'text-green-600 bg-green-50'
      case 'degraded': return 'text-yellow-600 bg-yellow-50'
      case 'outage': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'operational': return <CheckCircle className="h-4 w-4" />
      case 'degraded': return <AlertTriangle className="h-4 w-4" />
      case 'outage': return <XCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-3 ${
            health.status === 'healthy' ? 'bg-green-500 animate-pulse' : 
            health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <div>
            <p className="text-sm font-medium text-gray-900">System Status</p>
            <p className="text-xs text-gray-500 capitalize">{health.status}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{health.uptime}%</p>
          <p className="text-xs text-gray-500">Uptime</p>
        </div>
      </div>

      {/* Response Times */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Response Time</h4>
          <span className="text-xs text-gray-500">Last 24h</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Average</p>
            <p className="text-lg font-bold text-gray-900">{health.responseTime.avg}ms</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">P95</p>
            <p className="text-lg font-bold text-gray-900">{health.responseTime.p95}ms</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">P99</p>
            <p className="text-lg font-bold text-gray-900">{health.responseTime.p99}ms</p>
          </div>
        </div>
      </div>

      {/* Error Rate & Cache */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              health.errorRate < 0.5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {health.errorRate}%
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">{health.errorRate}%</p>
          <p className="text-xs text-gray-600 mt-1">Error Rate</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Database className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {health.cacheHitRate}%
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">{health.cacheHitRate}%</p>
          <p className="text-xs text-gray-600 mt-1">Cache Hit Rate</p>
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Services</h4>
          <span className="text-xs text-gray-500">6 running</span>
        </div>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-1 rounded ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                </div>
                <span className="text-sm text-gray-900 ml-2">{service.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500">{service.latency}ms</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  service.status === 'operational' ? 'bg-green-50 text-green-700' : 
                  service.status === 'degraded' ? 'bg-yellow-50 text-yellow-700' : 
                  'bg-red-50 text-red-700'
                }`}>
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Usage */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <HardDrive className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">Storage Usage</span>
          </div>
          <span className="text-xs text-gray-500">{(health.storage.database + health.storage.uploads + health.storage.logs).toLocaleString()} MB</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Database</span>
              <span className="text-gray-900 font-medium">{health.storage.database} MB</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Uploads</span>
              <span className="text-gray-900 font-medium">{health.storage.uploads} MB</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-600 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Logs</span>
              <span className="text-gray-900 font-medium">{health.storage.logs} MB</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full" style={{ width: '25%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      {realtime && Object.keys(realtime).length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">Real-time Metrics</span>
            <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600">Active Users</p>
              <p className="text-base font-semibold text-gray-900">{realtime.activeUsers || 0}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600">Orders Today</p>
              <p className="text-base font-semibold text-gray-900">{realtime.ordersToday || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemHealth