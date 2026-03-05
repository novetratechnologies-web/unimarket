// admin/src/components/notifications/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, X, Clock, AlertCircle, ShoppingCart, Package, DollarSign, Users, Shield, Info, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'
import { formatDistanceToNow, isAfter, subDays } from 'date-fns'
import api from '../../api/api'

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [localNotifications, setLocalNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  
  const { 
    unreadCount, 
    setUnreadCount, 
    notifications: contextNotifications,
    refreshNotifications 
  } = useNotifications()

  // Use context notifications when available, otherwise use local
  useEffect(() => {
    if (contextNotifications && contextNotifications.length > 0) {
      // Filter out notifications older than 7 days
      const sevenDaysAgo = subDays(new Date(), 7)
      const filtered = contextNotifications.filter(n => 
        isAfter(new Date(n.createdAt), sevenDaysAgo)
      )
      setLocalNotifications(filtered)
    }
  }, [contextNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refreshNotifications()
    }
  }, [isOpen, refreshNotifications])

  const fetchMore = async () => {
    try {
      setLoading(true)
      const response = await api.notifications.getAll({
        page: page + 1,
        limit: 10
      })
      
      if (response?.success) {
        const newNotifications = response.notifications || []
        setLocalNotifications(prev => [...prev, ...newNotifications])
        setHasMore(response.pagination?.page < response.pagination?.pages)
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to fetch more:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation()
    try {
      await api.notifications.markAsRead(notificationId)
      
      setLocalNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        )
      )
      
      // Update unread count in context
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead()
      
      setLocalNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      )
      
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation()
    try {
      await api.notifications.delete(notificationId)
      
      const deleted = localNotifications.find(n => n._id === notificationId)
      setLocalNotifications(prev => prev.filter(n => n._id !== notificationId))
      
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id, { stopPropagation: () => {} })
    }
    
    if (notification.link) {
      navigate(notification.link)
    } else if (notification.relatedTo?.entityType && notification.relatedTo?.entityId) {
      navigate(`/admin/${notification.relatedTo.entityType}s/${notification.relatedTo.entityId}`)
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type, priority) => {
    const iconMap = {
      'order_created': ShoppingCart,
      'order_shipped': Package,
      'order_delivered': Package,
      'order_cancelled': Package,
      'payment_received': DollarSign,
      'payment_failed': DollarSign,
      'payout_processed': DollarSign,
      'user_registered': Users,
      'vendor_registered': Users,
      'system_alert': AlertCircle,
      'security_alert': Shield
    }

    const IconComponent = iconMap[type] || Info
    
    const colorMap = {
      'low': 'text-gray-500',
      'normal': 'text-blue-500',
      'high': 'text-orange-500',
      'urgent': 'text-red-500',
      'critical': 'text-red-600'
    }

    return <IconComponent className={`h-5 w-5 ${colorMap[priority] || 'text-blue-500'}`} />
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      'low': 'bg-gray-100 text-gray-700',
      'normal': 'bg-blue-100 text-blue-700',
      'high': 'bg-orange-100 text-orange-700',
      'urgent': 'bg-red-100 text-red-700',
      'critical': 'bg-red-200 text-red-800 animate-pulse'
    }
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[priority] || styles.normal}`}>
        {priority}
      </span>
    )
  }

  // Sort: unread first, then by date
  const sortedNotifications = [...localNotifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slide-down">
          <div className="relative px-6 py-5 bg-gradient-to-r from-gray-700 to-gray-800">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-white" />
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-1">No notifications</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              sortedNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getPriorityBadge(notification.priority)}
                        
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        
                        {notification.category && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {notification.category}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex justify-end gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification._id, e)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification._id, e)}
                          className="text-xs text-gray-400 hover:text-red-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {hasMore && sortedNotifications.length > 0 && (
              <button
                onClick={fetchMore}
                disabled={loading}
                className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => {
                navigate('/admin/notifications')
                setIsOpen(false)
              }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default NotificationBell