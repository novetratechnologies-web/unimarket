import React, { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  Eye,
  EyeOff,
  MoreVertical,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

const MetricCard = ({
  id,
  title,
  value,
  formattedValue,
  change,
  trend = 'stable',
  icon: Icon,
  color = 'text-blue-600',
  bgColor = 'bg-blue-50',
  suffix,
  tooltip,
  isHidden = false,
  onToggle,
  onRefresh,
  onExport,
  isLoading = false,
  error = null,
  chart,
  sparklineData,
  comparison,
  target,
  metadata
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Format change value
  const formattedChange = typeof change === 'number' 
    ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` 
    : change

  // Determine trend color and icon
  const getTrendConfig = () => {
    if (trend === 'up' || change > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        text: 'Increased'
      }
    } else if (trend === 'down' || change < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Decreased'
      }
    } else {
      return {
        icon: Minus,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        text: 'No change'
      }
    }
  }

  const trendConfig = getTrendConfig()
  const TrendIcon = trendConfig.icon

  // Render sparkline chart
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) return null

    const max = Math.max(...sparklineData)
    const min = Math.min(...sparklineData)
    const range = max - min || 1

    return (
      <div className="flex items-end space-x-0.5 h-8 mt-2">
        {sparklineData.map((value, index) => {
          const height = ((value - min) / range) * 100
          return (
            <div
              key={index}
              className="flex-1 bg-primary-200 rounded-t transition-all duration-300 hover:bg-primary-400"
              style={{ height: `${Math.max(15, height)}%` }}
            />
          )
        })}
      </div>
    )
  }

  // Render target progress
  const renderTarget = () => {
    if (!target) return null

    const percentage = (value / target) * 100
    const isAchieved = value >= target

    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600">Target</span>
          <span className="font-medium text-gray-900">
            {formattedValue} / {typeof target === 'number' 
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(target)
              : target
            }
          </span>
        </div>
        <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
              isAchieved ? 'bg-green-500' : 'bg-primary-600'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {percentage.toFixed(1)}% achieved
          {isAchieved && ' 🎉'}
        </p>
      </div>
    )
  }

  // Render comparison
  const renderComparison = () => {
    if (!comparison) return null

    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">vs previous period</span>
          <div className="flex items-center">
            {comparison.trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : comparison.trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            ) : (
              <Minus className="h-3 w-3 text-gray-500 mr-1" />
            )}
            <span className={`font-medium ${
              comparison.trend === 'up' ? 'text-green-600' :
              comparison.trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {comparison.value > 0 ? '+' : ''}{comparison.value}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (isHidden) {
    return (
      <div className="card relative bg-gray-50 border border-gray-200">
        <div className="flex items-center justify-between h-32">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{title} is hidden</p>
              <button
                onClick={onToggle}
                className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center"
              >
                <Eye className="h-3 w-3 mr-1" />
                Show metric
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-primary-600 animate-spin" />
            <span className="text-sm text-gray-600">Updating...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-red-50/90 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center p-4">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={onRefresh}
              className="text-xs bg-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          {/* Icon */}
          <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          
          {/* Title & Value */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              {tooltip && (
                <div className="relative group/tooltip">
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-20">
                    {tooltip}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {formattedValue || value}
              </span>
              {suffix && (
                <span className="text-xs text-gray-500">{suffix}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-40">
                {onRefresh && (
                  <button
                    onClick={() => {
                      onRefresh()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 text-gray-500" />
                    Refresh
                  </button>
                )}
                {onExport && (
                  <button
                    onClick={() => {
                      onExport()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2 text-gray-500" />
                    Export
                  </button>
                )}
                {onToggle && (
                  <button
                    onClick={() => {
                      onToggle()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <EyeOff className="h-4 w-4 mr-2 text-gray-500" />
                    Hide metric
                  </button>
                )}
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => {
                    setShowDetails(!showDetails)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {showDetails ? 'Hide' : 'Show'} details
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change Indicator */}
      <div className="flex items-center space-x-2 mt-1">
        <div className={`flex items-center px-2 py-1 rounded-full ${trendConfig.bgColor}`}>
          <TrendIcon className={`h-3.5 w-3.5 ${trendConfig.color} mr-1`} />
          <span className={`text-xs font-medium ${trendConfig.color}`}>
            {formattedChange}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          vs last period
        </span>
      </div>

      {/* Sparkline Chart */}
      {sparklineData && renderSparkline()}

      {/* Additional Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-slideDown">
          {/* Metadata */}
          {metadata && (
            <div className="space-y-2 text-xs">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-medium text-gray-900">
                    {typeof value === 'number' 
                      ? value.toLocaleString(undefined, { 
                          maximumFractionDigits: 2 
                        })
                      : value
                    }
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Target Progress */}
          {renderTarget()}

          {/* Comparison */}
          {renderComparison()}

          {/* Chart */}
          {chart && (
            <div className="mt-3">
              {chart}
            </div>
          )}
        </div>
      )}

      {/* Hover Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </div>
  )
}

// Pre-configured metric card variants
export const RevenueMetricCard = (props) => (
  <MetricCard
    {...props}
    icon={TrendingUp}
    color="text-emerald-600"
    bgColor="bg-emerald-50"
  />
)

export const OrdersMetricCard = (props) => (
  <MetricCard
    {...props}
    icon={ShoppingCart}
    color="text-blue-600"
    bgColor="bg-blue-50"
  />
)

export const CustomersMetricCard = (props) => (
  <MetricCard
    {...props}
    icon={Users}
    color="text-purple-600"
    bgColor="bg-purple-50"
  />
)

export const ProductsMetricCard = (props) => (
  <MetricCard
    {...props}
    icon={Package}
    color="text-orange-600"
    bgColor="bg-orange-50"
  />
)

// Example usage with different configurations
export const MetricCardExamples = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
    {/* Basic Metric */}
    <MetricCard
      title="Total Revenue"
      value={45231.89}
      formattedValue="$45,231"
      change={20.1}
      trend="up"
      icon={TrendingUp}
      color="text-emerald-600"
      bgColor="bg-emerald-50"
      suffix="this month"
      tooltip="Gross revenue including all sales"
    />

    {/* With Sparkline */}
    <MetricCard
      title="Daily Orders"
      value={234}
      formattedValue="234"
      change={12.3}
      trend="up"
      icon={ShoppingCart}
      color="text-blue-600"
      bgColor="bg-blue-50"
      sparklineData={[45, 52, 48, 53, 49, 55, 58, 62, 59, 64, 61, 67, 70, 68, 72, 75, 73, 78, 82, 85, 83, 88, 92, 89, 94, 91, 97, 95, 98, 102]}
    />

    {/* With Target */}
    <MetricCard
      title="Customer Acquisition"
      value={432}
      formattedValue="432"
      change={8.7}
      trend="up"
      icon={Users}
      color="text-purple-600"
      bgColor="bg-purple-50"
      target={500}
      suffix="new customers"
    />

    {/* With Comparison */}
    <MetricCard
      title="Conversion Rate"
      value={3.2}
      formattedValue="3.2%"
      change={-0.5}
      trend="down"
      icon={TrendingDown}
      color="text-red-600"
      bgColor="bg-red-50"
      comparison={{
        value: -0.5,
        trend: 'down'
      }}
    />

    {/* With Metadata */}
    <MetricCard
      title="Average Order Value"
      value={89.24}
      formattedValue="$89.24"
      change={4.32}
      trend="up"
      icon={DollarSign}
      color="text-yellow-600"
      bgColor="bg-yellow-50"
      metadata={{
        min: '$12.50',
        max: '$450.00',
        median: '$67.80',
        totalOrders: '2,351'
      }}
    />

    {/* Loading State */}
    <MetricCard
      title="Loading Example"
      value={0}
      formattedValue="---"
      change={0}
      trend="stable"
      icon={RefreshCw}
      color="text-gray-600"
      bgColor="bg-gray-50"
      isLoading={true}
    />

    {/* Error State */}
    <MetricCard
      title="Error Example"
      value={0}
      formattedValue="---"
      change={0}
      trend="stable"
      icon={AlertCircle}
      color="text-red-600"
      bgColor="bg-red-50"
      error="Failed to load data"
      onRefresh={() => console.log('Refresh')}
    />

    {/* Hidden State */}
    <MetricCard
      title="Hidden Metric"
      value={0}
      formattedValue="---"
      change={0}
      trend="stable"
      icon={EyeOff}
      color="text-gray-600"
      bgColor="bg-gray-50"
      isHidden={true}
      onToggle={() => console.log('Toggle')}
    />
  </div>
)

export default MetricCard