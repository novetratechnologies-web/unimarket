import React, { useState, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  Smartphone,
  MoreHorizontal,
  ChevronRight,
  DollarSign,
  Percent
} from 'lucide-react'

const COLORS = {
  card: '#3B82F6',
  paypal: '#1E40AF',
  stripe: '#7C3AED',
  bank: '#10B981',
  cash: '#F59E0B',
  wallet: '#8B5CF6',
  other: '#6B7280'
}

const PAYMENT_METHOD_ICONS = {
  card: CreditCard,
  paypal: Wallet,
  stripe: TrendingUp,
  bank: Banknote,
  cash: Banknote,
  wallet: Smartphone,
  other: MoreHorizontal
}

const PAYMENT_METHOD_LABELS = {
  card: 'Credit/Debit Card',
  paypal: 'PayPal',
  stripe: 'Stripe',
  bank: 'Bank Transfer',
  cash: 'Cash',
  wallet: 'Digital Wallet',
  other: 'Other'
}

const RevenueBreakdown = ({ 
  paymentMethods = [], 
  categories = [],
  showChart = true,
  timeframe = 'monthly'
}) => {
  const [view, setView] = useState('payment') // 'payment' or 'category'
  const [chartType, setChartType] = useState('pie') // 'pie' or 'bar'

  // Process payment methods data
  const processedPaymentData = useMemo(() => {
    if (!paymentMethods.length) {
      // Return sample data for development
      return [
        { method: 'card', amount: 45231.89, count: 1234, percentage: 45.5 },
        { method: 'paypal', amount: 21342.67, count: 567, percentage: 21.5 },
        { method: 'stripe', amount: 15678.34, count: 345, percentage: 15.8 },
        { method: 'bank', amount: 9876.54, count: 234, percentage: 9.9 },
        { method: 'cash', amount: 4321.23, count: 123, percentage: 4.4 },
        { method: 'wallet', amount: 2345.67, count: 67, percentage: 2.4 },
        { method: 'other', amount: 567.89, count: 12, percentage: 0.5 }
      ]
    }
    
    // Calculate percentages if not provided
    const total = paymentMethods.reduce((sum, m) => sum + (m.amount || 0), 0)
    return paymentMethods.map(m => ({
      ...m,
      percentage: m.percentage || (total > 0 ? ((m.amount / total) * 100) : 0)
    })).sort((a, b) => b.amount - a.amount)
  }, [paymentMethods])

  // Process category data
  const processedCategoryData = useMemo(() => {
    if (!categories.length) {
      // Return sample data for development
      return [
        { name: 'Electronics', count: 345, revenue: 25432.89, percentage: 32.4 },
        { name: 'Clothing', count: 567, revenue: 18765.43, percentage: 23.9 },
        { name: 'Home & Garden', count: 234, revenue: 12345.67, percentage: 15.7 },
        { name: 'Books', count: 456, revenue: 8765.43, percentage: 11.2 },
        { name: 'Sports', count: 123, revenue: 6543.21, percentage: 8.3 },
        { name: 'Toys', count: 234, revenue: 4321.09, percentage: 5.5 },
        { name: 'Other', count: 89, revenue: 2345.67, percentage: 3.0 }
      ]
    }
    
    // Calculate percentages if not provided
    const total = categories.reduce((sum, c) => sum + (c.revenue || 0), 0)
    return categories.map(c => ({
      ...c,
      percentage: c.percentage || (total > 0 ? ((c.revenue / total) * 100) : 0)
    })).sort((a, b) => b.revenue - a.revenue)
  }, [categories])

  // Calculate totals
  const totals = useMemo(() => {
    const paymentTotal = processedPaymentData.reduce((sum, m) => sum + (m.amount || 0), 0)
    const categoryTotal = processedCategoryData.reduce((sum, c) => sum + (c.revenue || 0), 0)
    const paymentCount = processedPaymentData.reduce((sum, m) => sum + (m.count || 0), 0)
    
    return {
      paymentTotal,
      categoryTotal,
      paymentCount,
      avgOrderValue: paymentCount > 0 ? paymentTotal / paymentCount : 0
    }
  }, [processedPaymentData, processedCategoryData])

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {data.method ? PAYMENT_METHOD_LABELS[data.method] : data.name}
          </p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium text-gray-900">
              ${data.amount?.toLocaleString() || data.revenue?.toLocaleString()}
            </span>
          </p>
          {data.count && (
            <p className="text-sm text-gray-600">
              Orders: <span className="font-medium text-gray-900">{data.count.toLocaleString()}</span>
            </p>
          )}
          <p className="text-sm text-gray-600">
            Share: <span className="font-medium text-gray-900">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Render pie chart
  const renderPieChart = (data, dataKey, nameKey) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          innerRadius={60}
          paddingAngle={2}
          dataKey={dataKey}
          nameKey={nameKey}
          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.method ? COLORS[entry.method] : `#${Math.floor(Math.random()*16777215).toString(16)}`}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry) => {
            const item = data.find(d => 
              d.method === value || d.name === value
            )
            return (
              <span className="text-sm text-gray-700">
                {value} ({item?.percentage.toFixed(1)}%)
              </span>
            )
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )

  // Render bar chart
  const renderBarChart = (data, dataKey, xAxisKey) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey={xAxisKey === 'method' ? (d) => PAYMENT_METHOD_LABELS[d.method] : 'name'}
          tick={{ fontSize: 12, fill: '#6B7280' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey={dataKey} 
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.method ? COLORS[entry.method] : `#${Math.floor(Math.random()*16777215).toString(16)}`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  // Render payment method list
  const renderPaymentList = () => (
    <div className="mt-4 space-y-3">
      {processedPaymentData.map((method, index) => {
        const Icon = PAYMENT_METHOD_ICONS[method.method] || CreditCard
        return (
          <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3`} style={{ backgroundColor: `${COLORS[method.method]}20` }}>
                <Icon className="h-4 w-4" style={{ color: COLORS[method.method] }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {PAYMENT_METHOD_LABELS[method.method]}
                </p>
                <p className="text-xs text-gray-500">
                  {method.count?.toLocaleString()} orders
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                ${method.amount?.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {method.percentage?.toFixed(1)}%
              </p>
            </div>
          </div>
        )
      })}
      
      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Total Revenue</span>
          <span className="text-lg font-bold text-gray-900">
            ${totals.paymentTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Average Order Value</span>
          <span className="text-base font-semibold text-gray-900">
            ${totals.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )

  // Render category list
  const renderCategoryList = () => (
    <div className="mt-4 space-y-3">
      {processedCategoryData.map((category, index) => (
        <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-900">{category.name}</p>
            <p className="text-xs text-gray-500">
              {category.count?.toLocaleString()} products
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              ${category.revenue?.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {category.percentage?.toFixed(1)}%
            </p>
          </div>
        </div>
      ))}
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Category Revenue</span>
          <span className="text-lg font-bold text-gray-900">
            ${totals.categoryTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
            <p className="text-gray-600 text-sm mt-1">
              Distribution by {view === 'payment' ? 'payment method' : 'product category'}
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <div className="bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('payment')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'payment' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payment
              </button>
              <button
                onClick={() => setView('category')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'category' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Category
              </button>
            </div>
            
            {view === 'payment' && showChart && (
              <div className="bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    chartType === 'pie' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pie
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    chartType === 'bar' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'payment' ? (
          <div className="space-y-6">
            {/* Chart */}
            {showChart && processedPaymentData.length > 0 && (
              <div className="bg-white rounded-lg">
                {chartType === 'pie' 
                  ? renderPieChart(processedPaymentData, 'amount', 'method')
                  : renderBarChart(processedPaymentData, 'amount', 'method')
                }
              </div>
            )}
            
            {/* Payment Method List */}
            {renderPaymentList()}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Category Chart */}
            {showChart && processedCategoryData.length > 0 && (
              <div className="bg-white rounded-lg">
                {renderBarChart(processedCategoryData, 'revenue', 'name')}
              </div>
            )}
            
            {/* Category List */}
            {renderCategoryList()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-sm text-gray-600">
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Revenue
              </span>
            </div>
            <div className="flex items-center">
              <Percent className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-sm text-gray-600">
                {view === 'payment' 
                  ? `${processedPaymentData.length} methods` 
                  : `${processedCategoryData.length} categories`}
              </span>
            </div>
          </div>
          
          <button className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default RevenueBreakdown