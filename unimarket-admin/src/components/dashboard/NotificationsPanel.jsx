// admin/src/components/dashboard/NotificationsPanel.jsx
import React from 'react';
import { Bell, CheckCheck, Archive, X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../api/api'; // Fix import path

const NotificationsPanel = ({ 
  notifications = [], 
  onClose, 
  onMarkAllRead,
  onNotificationClick,
  onRefresh // Add refresh callback
}) => {
  const queryClient = useQueryClient();

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      // Use the correct API method
      await api.notifications.markAsRead(id);
      
      // Refresh notifications
      if (onRefresh) {
        await onRefresh();
      } else {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      
      // Show success toast if you have toast system
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Failed to mark as read:', error);
    }
  };

  const handleArchive = async (id, e) => {
    e.stopPropagation();
    try {
      await api.notifications.archive(id);
      
      if (onRefresh) {
        await onRefresh();
      } else {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      
      console.log('✅ Notification archived');
    } catch (error) {
      console.error('❌ Failed to archive:', error);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.notifications.markAllAsRead();
      
      if (onRefresh) {
        await onRefresh();
      } else {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      
      if (onMarkAllRead) {
        onMarkAllRead();
      }
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (priority === 'high' || priority === 'critical') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (priority === 'medium') {
      return <Bell className="h-4 w-4 text-yellow-500" />;
    }
    if (type === 'order_created') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Bell className="h-4 w-4 text-blue-500" />;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (!notifications.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-80 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-8 text-center">
          <Bell className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No new notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-80 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Bell className="h-4 w-4 mr-2 text-primary-600" />
          Notifications
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleMarkAllRead}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Mark all as read"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
        {notifications.map((notification) => (
          <div 
            key={notification._id}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
              !notification.isRead ? 'bg-blue-50/30' : ''
            }`}
            onClick={() => onNotificationClick?.(notification)}
          >
            <div className="flex gap-3">
              {/* Icon with priority indicator */}
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                {!notification.isRead && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 ${getPriorityColor(notification.priority)} rounded-full ring-2 ring-white`} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm font-medium ${
                    !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {notification.title || notification.type}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {notification.message || notification.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  {notification.priority === 'high' && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      High
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2 mt-2 ml-11">
              {!notification.isRead && (
                <button
                  onClick={(e) => handleMarkAsRead(notification._id, e)}
                  className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded hover:bg-primary-100 transition-colors"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={(e) => handleArchive(notification._id, e)}
                className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={() => {/* Navigate to all notifications */}}
          className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-1.5 hover:bg-primary-50 rounded-lg transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationsPanel;