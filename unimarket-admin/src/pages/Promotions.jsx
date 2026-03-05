import React, { useState } from 'react'
import { 
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Tag,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Copy,
  BarChart3,
  Users,
  DollarSign
} from 'lucide-react'

const Promotions = () => {
  const [activeTab, setActiveTab] = useState('active')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'active', label: 'Active', count: 8 },
    { id: 'scheduled', label: 'Scheduled', count: 3 },
    { id: 'expired', label: 'Expired', count: 12 },
    { id: 'all', label: 'All Promotions', count: 23 },
  ]

  const promotionTypes = [
    { id: 'discount', label: 'Discount Code', icon: Percent, color: 'blue' },
    { id: 'coupon', label: 'Coupon', icon: Tag, color: 'green' },
    { id: 'campaign', label: 'Campaign', icon: Users, color: 'purple' },
  ]

  const promotions = [
    {
      id: 1,
      name: 'SUMMER25',
      type: 'discount',
      value: '25% off',
      minPurchase: '$50',
      usage: '145/500',
      status: 'active',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      revenue: '$12,450'
    },
    {
      id: 2,
      name: 'FREESHIP',
      type: 'coupon',
      value: 'Free Shipping',
      minPurchase: '$0',
      usage: '89/200',
      status: 'active',
      startDate: '2024-07-01',
      endDate: '2024-07-31',
      revenue: '$8,920'
    },
    {
      id: 3,
      name: 'WELCOME10',
      type: 'discount',
      value: '10% off',
      minPurchase: '$0',
      usage: '324/1000',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      revenue: '$24,150'
    },
    {
      id: 4,
      name: 'BLACKFRIDAY',
      type: 'campaign',
      value: '40% off',
      minPurchase: '$100',
      usage: '892/1000',
      status: 'scheduled',
      startDate: '2024-11-29',
      endDate: '2024-11-30',
      revenue: '$0'
    },
    {
      id: 5,
      name: 'FLASH20',
      type: 'discount',
      value: '20% off',
      minPurchase: '$30',
      usage: '0/100',
      status: 'scheduled',
      startDate: '2024-08-15',
      endDate: '2024-08-20',
      revenue: '$0'
    },
    {
      id: 6,
      name: 'LOYALTY15',
      type: 'coupon',
      value: '15% off',
      minPurchase: '$0',
      usage: '45/45',
      status: 'expired',
      startDate: '2024-05-01',
      endDate: '2024-05-31',
      revenue: '$3,450'
    },
  ]

  const getStatusBadge = (status) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      expired: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    }
    
    const { color, icon: Icon } = config[status]
    
    return (
      <span className={`badge flex items-center ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const config = {
      discount: { color: 'bg-blue-100 text-blue-800', icon: Percent },
      coupon: { color: 'bg-green-100 text-green-800', icon: Tag },
      campaign: { color: 'bg-purple-100 text-purple-800', icon: Users },
    }
    
    const { color, icon: Icon } = config[type]
    const IconComponent = Icon
    
    return (
      <span className={`badge flex items-center ${color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            <p className="text-gray-600">Create and manage discounts, coupons, and campaigns</p>
          </div>
          <button className="btn-primary flex items-center justify-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Promotion
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Promotions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
              <p className="text-sm text-green-600 mt-1">+2 this month</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">$48,970</p>
              <p className="text-sm text-gray-500 mt-1">From promotions</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Discount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">22.5%</p>
              <p className="text-sm text-gray-500 mt-1">Per promotion</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Percent className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Redemption Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">18.4%</p>
              <p className="text-sm text-green-600 mt-1">+3.2% from last month</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  ${activeTab === tab.id 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search promotions by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <select className="input-field">
              <option>All Types</option>
              <option>Discount Code</option>
              <option>Coupon</option>
              <option>Campaign</option>
            </select>
            
            <button className="btn-secondary flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              More Filters
            </button>
            
            <button className="btn-secondary flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Promotion Types */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Promotion</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promotionTypes.map((type) => (
            <div 
              key={type.id}
              className="card cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-200"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-${type.color}-50 mr-4`}>
                  <type.icon className={`h-6 w-6 text-${type.color}-600`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{type.label}</h4>
                  <p className="text-sm text-gray-600">Create a new {type.label.toLowerCase()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Promotion</th>
                <th className="table-header">Type</th>
                <th className="table-header">Value</th>
                <th className="table-header">Usage</th>
                <th className="table-header">Dates</th>
                <th className="table-header">Revenue</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions
                .filter(promo => activeTab === 'all' || promo.status === activeTab)
                .map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                      <div className="text-sm text-gray-500">Min: {promotion.minPurchase}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(promotion.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-gray-900">{promotion.value}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{promotion.usage}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary-600 h-1.5 rounded-full"
                          style={{ 
                            width: `${(parseInt(promotion.usage.split('/')[0]) / parseInt(promotion.usage.split('/')[1]) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="h-3 w-3 mr-1" />
                        {promotion.startDate}
                      </div>
                      <div className="text-gray-500">to {promotion.endDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-gray-900">{promotion.revenue}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(promotion.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">6</span> of{' '}
              <span className="font-medium">23</span> promotions
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm">
                1
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg mr-3">
                <Percent className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Performing</p>
                <p className="text-lg font-bold text-gray-900">SUMMER25</p>
                <p className="text-sm text-gray-500">25% discount</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Most Used</p>
                <p className="text-lg font-bold text-gray-900">WELCOME10</p>
                <p className="text-sm text-gray-500">324 redemptions</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Highest Revenue</p>
                <p className="text-lg font-bold text-gray-900">$24,150</p>
                <p className="text-sm text-gray-500">From WELCOME10</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-50 rounded-lg mr-3">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Order Value</p>
                <p className="text-lg font-bold text-gray-900">$142.50</p>
                <p className="text-sm text-gray-500">With promotions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Promotions