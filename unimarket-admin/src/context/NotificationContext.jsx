// admin/src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/api' // Fixed import - should be from '../api' not '../api/api'
import { useAuth } from './AuthContext'
import { useToast } from '../hooks/useToast'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return
    
    try {
      console.log('📡 Fetching unread count...')
      const response = await api.notifications.getUnreadCount()
      console.log('📨 Unread count response:', response)
      
      // Handle different response structures
      if (response?.success) {
        // Response has { success: true, count: 5 }
        setUnreadCount(response.count || 0)
      } else if (response?.count !== undefined) {
        // Direct response with count
        setUnreadCount(response.count)
      } else if (response?.unreadCount !== undefined) {
        // Response has unreadCount
        setUnreadCount(response.unreadCount)
      }
    } catch (error) {
      // Don't log 401 errors during initial load
      if (error.status !== 401) {
        console.error('Failed to fetch unread count:', error)
      }
    }
  }, [isAuthenticated, user])

  // Fetch notifications
  const fetchNotifications = useCallback(async (limit = 10) => {
    if (!isAuthenticated || !user) return
    
    try {
      setLoading(true)
      console.log('📡 Fetching notifications...')
      
      const response = await api.notifications.getAll({
        limit,
        unreadOnly: false,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      console.log('📨 Notifications response:', response)
      
      // Handle different response structures
      let notificationsList = []
      let unread = 0
      
      if (response?.success) {
        // Standard response with success flag
        notificationsList = response.notifications || []
        unread = response.unreadCount !== undefined ? response.unreadCount : 
                 response.count !== undefined ? response.count : 0
      } else if (response?.notifications) {
        // Response has notifications property
        notificationsList = response.notifications
        unread = response.unreadCount || response.count || 0
      } else if (Array.isArray(response)) {
        // Response is the array itself
        notificationsList = response
        unread = response.filter(n => !n.isRead).length
      } else if (response?.data) {
        // Response wrapped in data property
        notificationsList = response.data.notifications || response.data || []
        unread = response.data.unreadCount || response.data.count || 0
      }
      
      setNotifications(notificationsList)
      
      if (unread > 0) {
        setUnreadCount(unread)
      }
    } catch (error) {
      if (error.status !== 401) {
        console.error('Failed to fetch notifications:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  // Mark a single notification as read
  const markAsRead = useCallback(async (id) => {
    if (!isAuthenticated) return
    
    try {
      await api.notifications.markAsRead(id)
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => 
          n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [isAuthenticated])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      await api.notifications.markAllAsRead()
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      
      setUnreadCount(0)
      
      showToast({
        title: 'Success',
        description: 'All notifications marked as read',
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [isAuthenticated, showToast])

  // Archive a notification
  const archiveNotification = useCallback(async (id) => {
    if (!isAuthenticated) return
    
    try {
      await api.notifications.archive(id)
      
      // Remove from list
      setNotifications(prev => prev.filter(n => n._id !== id))
      
      // Update unread count if it was unread
      const wasUnread = notifications.find(n => n._id === id)?.isRead === false
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
    } catch (error) {
      console.error('Failed to archive notification:', error)
    }
  }, [isAuthenticated, notifications])

  // Refresh everything
  const refreshNotifications = useCallback(() => {
    fetchUnreadCount()
    fetchNotifications()
  }, [fetchUnreadCount, fetchNotifications])

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
      fetchNotifications()
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications])

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const token = localStorage.getItem('admin_access_token')
    if (!token) return

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'
    const ws = new WebSocket(`${wsUrl}?token=${token}`)

    ws.onopen = () => {
      console.log('🔌 WebSocket connected for notifications')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message:', data)
        
        if (data.type === 'notification') {
          // New notification received
          setUnreadCount(prev => prev + 1)
          
          // Add to notifications list
          setNotifications(prev => [data.notification, ...prev].slice(0, 50))
          
          showToast({
            title: data.notification?.title || 'New Notification',
            description: data.notification?.message || '',
            type: data.notification?.priority === 'high' ? 'warning' : 'info'
          })
        } else if (data.type === 'notification:read') {
          // Update local state
          setNotifications(prev =>
            prev.map(n => 
              n._id === data.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
            )
          )
          setUnreadCount(prev => Math.max(0, prev - 1))
        } else if (data.type === 'notifications:all-read') {
          setNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
          )
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected')
    }

    setSocket(ws)

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [isAuthenticated, user, showToast])

  // Polling fallback (only if WebSocket fails)
  useEffect(() => {
    if (!isAuthenticated || socket?.readyState === WebSocket.OPEN) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 60000) // Only fetch unread count, not full list

    return () => clearInterval(interval)
  }, [isAuthenticated, socket, fetchUnreadCount])

  const value = {
    unreadCount,
    setUnreadCount,
    notifications,
    setNotifications,
    loading,
    refreshNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}