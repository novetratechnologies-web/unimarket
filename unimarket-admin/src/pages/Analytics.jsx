import React, { useState } from 'react'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  CreditCard,
  Globe,
  Smartphone,
  PieChart,
  Target
} from 'lucide-react'

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month')
  const [metric, setMetric] = useState('revenue')

  const metrics = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign, value: '$45,231', change: '+20.1%', trend: 'up' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, value: '2,351', change: '+12.3%', trend: 'up' },
    { id: 'customers', label: 'Customers', icon: Users, value: '5,421', change: '+8.7%', trend: 'up' },
    { id: 'avg-order', label: 'Avg. Order', icon: CreditCard, value: '$124.50', change: '+5.2%', trend: 'up' },
  ]

  const trafficSources = [
    { source: 'Organic Search', visits: 15420, percentage: 42, color: 'bg-blue-500' },
    { source: 'Direct', visits: 8920, percentage: 24, color: 'bg-green-500' },
    { source: 'Social Media', visits: 6430, percentage: 18, color: 'bg-purple-500' },
    { source: 'Referral', visits: 4210, percentage: 12, color: 'bg-yellow-500' },
    { source: 'Email', visits: 2890, percentage: 8, color: 'bg-pink-500' },
  ]

  const topProducts = [
    { name: 'Wireless Headphones', sales: 245, revenue: '$21,945', growth: '+24%' },
    { name: 'Smart Watch', sales: 189, revenue: '$37,611', growth: '+18%' },
    { name: 'Fitness Tracker', sales: 156, revenue: '$15,444', growth: '+32%' },
    { name: 'Laptop Stand', sales: 132, revenue: '$6,732', growth: '+12%' },
    { name: 'Phone Case', sales: 128, revenue: '$3,584', growth: '+8%' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track and analyze your store performance</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <button className="btn-secondary flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            
            <button className="btn-primary flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((item) => (
          <div key={item.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{item.value}</p>
                <div className="mt-2 flex items-center">
                  {item.trend === 'up' ? (
                    <span className="inline-flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {item.change}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      {item.change}
                    </span>
                  )}
                  <span className="ml-2 text-sm text-gray-500">from last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary-50">
                <item.icon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
              <p className="text-gray-600">Monthly revenue performance</p>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="input-field text-sm py-1"
              >
                <option value="revenue">Revenue</option>
                <option value="orders">Orders</option>
                <option value="customers">Customers</option>
                <option value="conversion">Conversion Rate</option>
              </select>
            </div>
          </div>
          
          {/* Chart Placeholder */}
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-12 w-12 text-gray-400" />
            <div className="ml-4 text-gray-600">Revenue chart visualization</div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Today</div>
              <div className="text-lg font-semibold text-gray-900">$2,850</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">This Week</div>
              <div className="text-lg font-semibold text-gray-900">$18,450</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">This Month</div>
              <div className="text-lg font-semibold text-gray-900">$45,231</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">This Year</div>
              <div className="text-lg font-semibold text-gray-900">$542,150</div>
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Traffic Sources</h3>
              <p className="text-gray-600">Where your visitors come from</p>
            </div>
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {trafficSources.map((source, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{source.source}</span>
                  <span className="text-sm text-gray-600">{source.visits.toLocaleString()} visits</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${source.color}`}
                    style={{ width: `${source.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{source.percentage}% of total</span>
                  <span className="text-xs text-gray-500">
                    {source.percentage > 20 ? 'High' : source.percentage > 10 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Device Breakdown</h3>
              <p className="text-gray-600">Visitor devices by category</p>
            </div>
            <Smartphone className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Mobile</span>
                <span className="text-sm text-gray-600">62%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: '62%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Desktop</span>
                <span className="text-sm text-gray-600">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: '32%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Tablet</span>
                <span className="text-sm text-gray-600">6%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: '6%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Conversion by Device</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">3.8%</div>
                <div className="text-xs text-gray-500">Mobile</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">4.2%</div>
                <div className="text-xs text-gray-500">Desktop</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">2.1%</div>
                <div className="text-xs text-gray-500">Tablet</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <p className="text-gray-600">Best performing products by revenue</p>
            </div>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header text-left">Product</th>
                  <th className="table-header text-left">Sales</th>
                  <th className="table-header text-left">Revenue</th>
                  <th className="table-header text-left">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{product.sales}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{product.revenue}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.growth.startsWith('+') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <p className="text-gray-600">Key performance indicators</p>
            </div>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                <span className="text-sm font-semibold text-gray-900">3.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: '32%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Cart Abandonment</span>
                <span className="text-sm font-semibold text-gray-900">68.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-red-500" style={{ width: '68%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Customer Retention</span>
                <span className="text-sm font-semibold text-gray-900">45.2%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: '45%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Avg. Session Duration</span>
                <span className="text-sm font-semibold text-gray-900">3m 24s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: '55%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Recommendations</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                <span>Optimize mobile checkout flow</span>
              </li>
              <li className="flex items-start">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-2"></div>
                <span>Increase email marketing frequency</span>
              </li>
              <li className="flex items-start">
                <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5 mr-2"></div>
                <span>Improve product page load times</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics