import React, { useState } from 'react'
import { 
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Repeat,
  BarChart3,
  MoreVertical
} from 'lucide-react'

const Payments = () => {
  const [activeTab, setActiveTab] = useState('transactions')
  const [dateRange, setDateRange] = useState('month')

  const tabs = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'methods', label: 'Payment Methods' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'reports', label: 'Reports' },
  ]

  const paymentMethods = [
    { id: 1, name: 'Stripe', type: 'Credit Card', status: 'active', fee: '2.9% + $0.30', processing: '1-2 days' },
    { id: 2, name: 'PayPal', type: 'Digital Wallet', status: 'active', fee: '2.9% + $0.30', processing: 'Instant' },
    { id: 3, name: 'Apple Pay', type: 'Digital Wallet', status: 'active', fee: '2.9%', processing: 'Instant' },
    { id: 4, name: 'Cash on Delivery', type: 'Cash', status: 'active', fee: '0%', processing: 'On Delivery' },
    { id: 5, name: 'Bank Transfer', type: 'Bank', status: 'inactive', fee: '0%', processing: '3-5 days' },
  ]

  const transactions = [
    { id: 'TXN-001', customer: 'John Smith', method: 'Stripe', amount: '$129.99', status: 'completed', date: '2024-01-15', fee: '$4.07' },
    { id: 'TXN-002', customer: 'Sarah Johnson', method: 'PayPal', amount: '$89.50', status: 'completed', date: '2024-01-14', fee: '$2.89' },
    { id: 'TXN-003', customer: 'Mike Wilson', method: 'Apple Pay', amount: '$245.75', status: 'pending', date: '2024-01-14', fee: '$7.12' },
    { id: 'TXN-004', customer: 'Emma Davis', method: 'Cash on Delivery', amount: '$67.99', status: 'completed', date: '2024-01-13', fee: '$0.00' },
    { id: 'TXN-005', customer: 'Robert Brown', method: 'Stripe', amount: '$199.99', status: 'refunded', date: '2024-01-13', fee: '$6.20' },
    { id: 'TXN-006', customer: 'Lisa Taylor', method: 'PayPal', amount: '$156.25', status: 'completed', date: '2024-01-12', fee: '$4.83' },
  ]

  const stats = [
    { title: 'Total Revenue', value: '$45,231.89', change: '+20.1%', trend: 'up' },
    { title: 'Processing Fees', value: '$1,356.95', change: '+18.3%', trend: 'up' },
    { title: 'Avg. Transaction', value: '$124.50', change: '+5.2%', trend: 'up' },
    { title: 'Success Rate', value: '98.7%', change: '+0.5%', trend: 'up' },
  ]

  const getStatusBadge = (status) => {
    const config = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      refunded: { color: 'bg-red-100 text-red-800', icon: Repeat },
      failed: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    }
    
    const { color, icon: Icon } = config[status]
    
    return (
      <span className={`badge flex items-center ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getMethodBadge = (method) => {
    const colors = {
      Stripe: 'bg-blue-100 text-blue-800',
      PayPal: 'bg-yellow-100 text-yellow-800',
      'Apple Pay': 'bg-gray-100 text-gray-800',
      'Cash on Delivery': 'bg-green-100 text-green-800',
      'Bank Transfer': 'bg-purple-100 text-purple-800',
    }
    
    return (
      <span className={`badge ${colors[method]}`}>
        {method}
      </span>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">Manage payment methods and transactions</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button className="btn-primary flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="mt-2 flex items-center">
                  {stat.trend === 'up' ? (
                    <span className="inline-flex items-center text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stat.change}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-600">
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                      {stat.change}
                    </span>
                  )}
                  <span className="ml-2 text-sm text-gray-500">from last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary-50">
                {stat.title.includes('Revenue') && <DollarSign className="h-6 w-6 text-primary-600" />}
                {stat.title.includes('Fees') && <CreditCard className="h-6 w-6 text-primary-600" />}
                {stat.title.includes('Transaction') && <BarChart3 className="h-6 w-6 text-primary-600" />}
                {stat.title.includes('Success') && <CheckCircle className="h-6 w-6 text-primary-600" />}
              </div>
            </div>
          </div>
        ))}
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

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions by ID, customer, or amount..."
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select className="input-field">
                <option>All Status</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>Refunded</option>
                <option>Failed</option>
              </select>
              
              <select className="input-field">
                <option>All Methods</option>
                <option>Stripe</option>
                <option>PayPal</option>
                <option>Apple Pay</option>
                <option>Cash on Delivery</option>
              </select>
              
              <button className="btn-secondary flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                More Filters
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Transaction ID</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Method</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Fee</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-600">{txn.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{txn.customer}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getMethodBadge(txn.method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-gray-900">{txn.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{txn.fee}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{txn.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(txn.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
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
                  <span className="font-medium">2,351</span> transactions
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
        </div>
      )}

      {activeTab === 'methods' && (
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <div key={method.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${
                      method.status === 'active' ? 'bg-green-50' : 'bg-gray-50'
                    } mr-3`}>
                      <CreditCard className={`h-6 w-6 ${
                        method.status === 'active' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.type}</p>
                    </div>
                  </div>
                  {method.status === 'active' ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-error">Inactive</span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium text-gray-900">{method.fee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Time</span>
                    <span className="font-medium text-gray-900">{method.processing}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      Configure
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={method.status === 'active'}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add New Method */}
            <div className="card border-2 border-dashed border-gray-300 hover:border-primary-500 cursor-pointer">
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="p-3 rounded-lg bg-gray-50 mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Add Payment Method</h3>
                <p className="text-sm text-gray-600">Add a new payment method to your store</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="card">
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Management</h3>
              <p className="text-gray-600 mb-6">Manage recurring payments and subscriptions</p>
              <button className="btn-primary">
                Configure Subscriptions
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="card">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Reports</h3>
              <p className="text-gray-600 mb-6">Generate detailed payment analytics and reports</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="btn-primary">
                  Generate Report
                </button>
                <button className="btn-secondary">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="mt-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50 mr-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payment Security</h3>
                <p className="text-sm text-gray-600">Your payments are secured with PCI DSS compliance</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">Secure</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payments