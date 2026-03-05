import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  RefreshCw,
  MoreVertical,
  Calendar,
  DollarSign,
  User,
  Package
} from 'lucide-react'

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

  const statuses = [
    { value: 'all', label: 'All Orders', color: 'gray', icon: Package },
    { value: 'pending', label: 'Pending', color: 'yellow', icon: Clock },
    { value: 'processing', label: 'Processing', color: 'blue', icon: RefreshCw },
    { value: 'shipped', label: 'Shipped', color: 'purple', icon: Truck },
    { value: 'delivered', label: 'Delivered', color: 'green', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'red', icon: XCircle },
  ]

  const orders = [
    {
      id: 'ORD-001',
      customer: 'John Smith',
      email: 'john@example.com',
      date: '2024-01-15',
      amount: '$129.99',
      status: 'delivered',
      items: 3,
      payment: 'Paid'
    },
    {
      id: 'ORD-002',
      customer: 'Sarah Johnson',
      email: 'sarah@example.com',
      date: '2024-01-14',
      amount: '$89.50',
      status: 'shipped',
      items: 2,
      payment: 'Paid'
    },
    {
      id: 'ORD-003',
      customer: 'Mike Wilson',
      email: 'mike@example.com',
      date: '2024-01-14',
      amount: '$245.75',
      status: 'processing',
      items: 5,
      payment: 'Pending'
    },
    {
      id: 'ORD-004',
      customer: 'Emma Davis',
      email: 'emma@example.com',
      date: '2024-01-13',
      amount: '$67.99',
      status: 'pending',
      items: 1,
      payment: 'Paid'
    },
    {
      id: 'ORD-005',
      customer: 'Robert Brown',
      email: 'robert@example.com',
      date: '2024-01-13',
      amount: '$199.99',
      status: 'cancelled',
      items: 2,
      payment: 'Refunded'
    },
    {
      id: 'ORD-006',
      customer: 'Lisa Taylor',
      email: 'lisa@example.com',
      date: '2024-01-12',
      amount: '$156.25',
      status: 'delivered',
      items: 4,
      payment: 'Paid'
    },
  ]

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    }
    
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <span className={`badge flex items-center ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPaymentBadge = (payment) => {
    const color = payment === 'Paid' ? 'bg-green-100 text-green-800' : 
                  payment === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
    
    return (
      <span className={`badge ${color}`}>
        {payment}
      </span>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage and track customer orders</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-primary">
              <Download className="h-5 w-5 mr-2" />
              Export Orders
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {statuses.map((status) => {
          const Icon = status.icon
          return (
            <div key={status.value} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">125</p>
                </div>
                <div className={`p-2 rounded-lg bg-${status.color}-50`}>
                  <Icon className={`h-5 w-5 text-${status.color}-600`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by ID, customer, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            
            <button className="btn-secondary flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Order ID</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-600">{order.id}</div>
                    <div className="text-sm text-gray-500">{order.items} items</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <div className="text-sm font-semibold text-gray-900">{order.amount}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentBadge(order.payment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">6</span> of{' '}
              <span className="font-medium">2,351</span> orders
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </button>
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

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Processing</h3>
          <div className="space-y-3">
            <button className="w-full btn-secondary">
              Process Selected Orders
            </button>
            <button className="w-full btn-secondary">
              Print Shipping Labels
            </button>
            <button className="w-full btn-secondary">
              Send Tracking Updates
            </button>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Analytics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-sm font-semibold text-gray-900">$124.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-semibold text-green-600">3.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Refund Rate</span>
              <span className="text-sm font-semibold text-red-600">1.8%</span>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">Order ORD-007 placed</div>
              <div className="text-gray-500">2 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Order ORD-006 shipped</div>
              <div className="text-gray-500">1 hour ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Order ORD-005 cancelled</div>
              <div className="text-gray-500">3 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Orders