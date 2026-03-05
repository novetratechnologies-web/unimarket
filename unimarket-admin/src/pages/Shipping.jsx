import React, { useState } from 'react'
import { 
  Truck,
  Package,
  Globe,
  Clock,
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Download,
  BarChart3
} from 'lucide-react'

const Shipping = () => {
  const [activeTab, setActiveTab] = useState('zones')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'zones', label: 'Shipping Zones' },
    { id: 'rates', label: 'Shipping Rates' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'carriers', label: 'Carriers' },
  ]

  const shippingZones = [
    { id: 1, name: 'United States', countries: ['US'], rates: 3, status: 'active' },
    { id: 2, name: 'Canada', countries: ['CA'], rates: 2, status: 'active' },
    { id: 3, name: 'Europe', countries: ['DE', 'FR', 'ES', 'IT', 'NL'], rates: 4, status: 'active' },
    { id: 4, name: 'United Kingdom', countries: ['GB'], rates: 2, status: 'active' },
    { id: 5, name: 'Australia', countries: ['AU'], rates: 1, status: 'inactive' },
    { id: 6, name: 'Asia', countries: ['JP', 'KR', 'SG', 'HK'], rates: 3, status: 'active' },
  ]

  const shippingRates = [
    { id: 1, name: 'Standard Shipping', zone: 'United States', price: '$4.99', delivery: '3-5 days', minOrder: '$0', maxOrder: 'No limit' },
    { id: 2, name: 'Express Shipping', zone: 'United States', price: '$9.99', delivery: '1-2 days', minOrder: '$0', maxOrder: 'No limit' },
    { id: 3, name: 'Free Shipping', zone: 'United States', price: '$0.00', delivery: '5-7 days', minOrder: '$50', maxOrder: 'No limit' },
    { id: 4, name: 'International Standard', zone: 'Europe', price: '$14.99', delivery: '7-14 days', minOrder: '$0', maxOrder: 'No limit' },
    { id: 5, name: 'International Express', zone: 'Europe', price: '$29.99', delivery: '3-5 days', minOrder: '$100', maxOrder: 'No limit' },
    { id: 6, name: 'Local Delivery', zone: 'United States', price: '$2.99', delivery: '1 day', minOrder: '$0', maxOrder: '25 miles' },
  ]

  const carriers = [
    { id: 1, name: 'UPS', status: 'active', tracking: true, api: true },
    { id: 2, name: 'FedEx', status: 'active', tracking: true, api: true },
    { id: 3, name: 'USPS', status: 'active', tracking: true, api: false },
    { id: 4, name: 'DHL', status: 'inactive', tracking: true, api: true },
    { id: 5, name: 'Local Courier', status: 'active', tracking: false, api: false },
  ]

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-error">Inactive</span>
    )
  }

  const getTrackingBadge = (hasTracking) => {
    return hasTracking ? (
      <span className="badge badge-success">Tracking Available</span>
    ) : (
      <span className="badge badge-warning">No Tracking</span>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping</h1>
            <p className="text-gray-600">Configure shipping zones, rates, and carriers</p>
          </div>
          <button className="btn-primary flex items-center justify-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Shipping Zone
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shipping Zones</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">6</p>
              <p className="text-sm text-gray-500 mt-1">Active zones</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shipping Rates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">15</p>
              <p className="text-sm text-gray-500 mt-1">Configured rates</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Delivery</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">3.2 days</p>
              <p className="text-sm text-gray-500 mt-1">Delivery time</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shipping Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">$4,250</p>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <Truck className="h-6 w-6 text-orange-600" />
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
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'zones' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search shipping zones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select className="input-field">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
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

          {/* Zones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shippingZones.map((zone) => (
              <div key={zone.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-50 mr-3">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                      <p className="text-sm text-gray-600">{zone.countries.length} countries</p>
                    </div>
                  </div>
                  {getStatusBadge(zone.status)}
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    Countries:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {zone.countries.map((country) => (
                      <span 
                        key={country}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    {zone.rates} shipping rate{zone.rates !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rates' && (
        <div className="space-y-6">
          {/* Rates Table */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Shipping Method</th>
                    <th className="table-header">Zone</th>
                    <th className="table-header">Price</th>
                    <th className="table-header">Delivery Time</th>
                    <th className="table-header">Min Order</th>
                    <th className="table-header">Max Order</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shippingRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{rate.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rate.zone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-gray-900">{rate.price}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {rate.delivery}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rate.minOrder}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rate.maxOrder}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="card">
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Package Tracking</h3>
              <p className="text-gray-600 mb-6">Track shipments and manage delivery status</p>
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter tracking number..."
                    className="input-field pr-24"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-4 py-2">
                    Track
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'carriers' && (
        <div className="space-y-6">
          {/* Carriers Table */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Carrier</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Tracking</th>
                    <th className="table-header">API Integration</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {carriers.map((carrier) => (
                    <tr key={carrier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <Truck className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="font-medium text-gray-900">{carrier.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(carrier.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTrackingBadge(carrier.tracking)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {carrier.api ? (
                          <span className="badge badge-success">Integrated</span>
                        ) : (
                          <span className="badge badge-warning">Manual</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                            <Edit className="h-4 w-4" />
                          </button>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={carrier.status === 'active'}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Carrier */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Carrier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrier Name
                </label>
                <input type="text" className="input-field" placeholder="Enter carrier name" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking URL
                </label>
                <input type="text" className="input-field" placeholder="https://carrier.com/track/{{tracking}}" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input type="password" className="input-field" placeholder="Enter API key" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <button className="btn-primary">
                <Plus className="h-5 w-5 mr-2" />
                Add Carrier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Analytics */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Shipping Costs</h4>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="text-sm font-semibold text-gray-900">$1,250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Month</span>
                <span className="text-sm text-gray-900">$1,120</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Change</span>
                <span className="text-sm font-semibold text-green-600">+11.6%</span>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Delivery Performance</h4>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">On-time Delivery</span>
                <span className="text-sm font-semibold text-green-600">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delayed Shipments</span>
                <span className="text-sm font-semibold text-red-600">3.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg. Delivery Time</span>
                <span className="text-sm font-semibold text-gray-900">3.2 days</span>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Shipping Methods Usage</h4>
              <Truck className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Standard Shipping</span>
                <span className="text-sm font-semibold text-gray-900">65%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Express Shipping</span>
                <span className="text-sm font-semibold text-gray-900">25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Free Shipping</span>
                <span className="text-sm font-semibold text-gray-900">10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shipping