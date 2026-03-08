// admin/src/components/dashboard/PendingActions.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Package,
  Store,
  Users,
  ShoppingCart,
  DollarSign,
  FileText,
  Shield,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

const PendingActions = ({ stats = null, loading = false }) => {
  const [showResolved, setShowResolved] = useState(false);
  const [resolvedItems, setResolvedItems] = useState([]);

  // Default mock data
  const defaultActions = [
    {
      id: '1',
      type: 'vendor',
      title: 'Vendor Approval Pending',
      description: '3 vendors waiting for verification',
      count: 3,
      priority: 'high',
      icon: Store,
      color: 'purple',
      link: '/vendors?status=pending',
      action: 'Review Vendors'
    },
    {
      id: '2',
      type: 'order',
      title: 'Orders to Process',
      description: '12 orders need processing',
      count: 12,
      priority: 'high',
      icon: ShoppingCart,
      color: 'blue',
      link: '/orders?status=pending',
      action: 'Process Orders'
    },
    {
      id: '3',
      type: 'product',
      title: 'Product Approvals',
      description: '8 products awaiting review',
      count: 8,
      priority: 'medium',
      icon: Package,
      color: 'green',
      link: '/products?status=pending',
      action: 'Review Products'
    },
    {
      id: '4',
      type: 'payout',
      title: 'Pending Payouts',
      description: '$12,450 waiting for processing',
      amount: 12450,
      priority: 'medium',
      icon: DollarSign,
      color: 'orange',
      link: '/vendors/payouts?status=pending',
      action: 'Process Payouts'
    },
    {
      id: '5',
      type: 'user',
      title: 'New User Registrations',
      description: '24 users need verification',
      count: 24,
      priority: 'low',
      icon: Users,
      color: 'pink',
      link: '/users?status=pending',
      action: 'Review Users'
    },
    {
      id: '6',
      type: 'dispute',
      title: 'Open Disputes',
      description: '2 disputes require attention',
      count: 2,
      priority: 'critical',
      icon: AlertCircle,
      color: 'red',
      link: '/orders/disputes',
      action: 'Resolve Disputes'
    }
  ];

  const actions = stats?.pendingActions || defaultActions;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalPending = actions.reduce((sum, action) => sum + (action.count || 1), 0);
  const criticalCount = actions.filter(a => a.priority === 'critical').length;
  const highCount = actions.filter(a => a.priority === 'high').length;

  const handleResolve = (actionId) => {
    setResolvedItems([...resolvedItems, actionId]);
    setTimeout(() => {
      setResolvedItems(resolvedItems.filter(id => id !== actionId));
    }, 3000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getIconColor = (color) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      red: 'bg-red-100 text-red-600',
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  const filteredActions = showResolved 
    ? actions 
    : actions.filter(action => !resolvedItems.includes(action.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">Pending Actions</h3>
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">
                {criticalCount} critical
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">
            {totalPending} items require your attention
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`p-2 rounded-lg transition-colors ${
              showResolved ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={showResolved ? 'Hide resolved' : 'Show resolved'}
          >
            {showResolved ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Priority Summary */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{criticalCount}</div>
          <div className="text-xs text-red-600">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{highCount}</div>
          <div className="text-xs text-orange-600">High</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalPending}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{resolvedItems.length}</div>
          <div className="text-xs text-green-600">Resolved</div>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {filteredActions.map((action, index) => {
            const isResolved = resolvedItems.includes(action.id);
            const Icon = action.icon;

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`relative group rounded-xl border transition-all ${
                  isResolved ? 'opacity-50' : 'hover:shadow-md'
                }`}
              >
                {/* Priority Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getPriorityBadge(action.priority)}`} />

                <div className="p-4 pl-5">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconColor(action.color)}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{action.title}</h4>
                        {action.priority && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                            {action.priority}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{action.description}</p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <a
                          href={action.link}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {action.action || 'View Details'}
                          <ChevronRight className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleResolve(action.id)}
                          className="ml-auto text-sm text-gray-400 hover:text-green-600 transition-colors"
                          title="Mark as resolved"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Count Badge */}
                    {action.count && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                          {action.count}
                        </span>
                      </div>
                    )}

                    {/* Amount Badge */}
                    {action.amount && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          ${action.amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resolved Overlay */}
                {isResolved && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center"
                  >
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Resolved</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredActions.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">All caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No pending actions require your attention</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {resolvedItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{resolvedItems.length} items resolved</span>
            <button
              onClick={() => setResolvedItems([])}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </motion.div>
  );
};

export default PendingActions;