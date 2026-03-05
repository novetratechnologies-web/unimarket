// admin/src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Filter,
  Check,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  DollarSign,
  Users,
  Shield,
  Settings
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    pagination,
    filters,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    archive,
    deleteNotification,
    updateFilters
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filterPanel, setFilterPanel] = useState(false);
  const navigate = useNavigate();

  const getPriorityBadge = (priority) => {
    const config = {
      urgent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
      normal: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Normal' },
      low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Low' }
    };
    return config[priority] || config.normal;
  };

  const getTypeIcon = (type) => {
    if (type.includes('order')) return Package;
    if (type.includes('payment')) return DollarSign;
    if (type.includes('product')) return Package;
    if (type.includes('vendor')) return Users;
    if (type.includes('security')) return Shield;
    if (type.includes('system')) return Settings;
    return Bell;
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n._id));
    }
  };

  const handleBulkAction = async (action) => {
    switch (action) {
      case 'read':
        await Promise.all(selectedNotifications.map(id => markAsRead(id)));
        setSelectedNotifications([]);
        break;
      case 'archive':
        await Promise.all(selectedNotifications.map(id => archive(id)));
        setSelectedNotifications([]);
        break;
      case 'delete':
        await Promise.all(selectedNotifications.map(id => deleteNotification(id)));
        setSelectedNotifications([]);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="h-6 w-6 mr-2 text-primary-600" />
                Notifications
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread • {pagination.total} total notifications
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchNotifications(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setFilterPanel(!filterPanel)}
                className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${
                  filterPanel ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="mt-4 flex items-center space-x-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <span className="text-sm font-medium text-primary-700">
                {selectedNotifications.length} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="px-3 py-1.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center border border-gray-300"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark as Read
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center border border-gray-300"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1.5 bg-white text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center border border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {filterPanel && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => updateFilters({ type: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="order">Orders</option>
                  <option value="payment">Payments</option>
                  <option value="product">Products</option>
                  <option value="vendor">Vendors</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => updateFilters({ priority: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.unreadOnly ? 'unread' : 'all'}
                  onChange={(e) => updateFilters({ unreadOnly: e.target.value === 'unread' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread Only</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => updateFilters({ type: null, priority: null, unreadOnly: false })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon = getTypeIcon(notification.type);
                const priority = getPriorityBadge(notification.priority);
                const isSelected = selectedNotifications.includes(notification._id);

                return (
                  <div
                    key={notification._id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification._id));
                            } else {
                              setSelectedNotifications(prev => [...prev, notification._id]);
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className={`p-3 rounded-xl ${priority.bg}`}>
                        <Icon className={`h-6 w-6 ${priority.text}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3">
                              <h4 className={`text-base ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                                {notification.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
                                {priority.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            
                            {/* Metadata */}
                            {notification.data && Object.keys(notification.data).length > 0 && (
                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                {Object.entries(notification.data).map(([key, value]) => (
                                  <span key={key} className="capitalize">
                                    {key}: <span className="font-medium">{value}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Timestamps */}
                            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-400">
                              <span title={format(new Date(notification.createdAt), 'PPpp')}>
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </span>
                              {notification.readAt && (
                                <span title={format(new Date(notification.readAt), 'PPpp')}>
                                  Read {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4 text-gray-500" />
                              </button>
                            )}
                            <button
                              onClick={() => archive(notification._id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {pagination.page < pagination.pages && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;