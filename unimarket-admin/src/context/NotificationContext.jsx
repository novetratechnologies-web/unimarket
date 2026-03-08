// admin/src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../api/api' // Fixed import
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
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const pollingIntervalRef = useRef(null)
  
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const MAX_RECONNECT_ATTEMPTS = 5

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return
    
    try {
      console.log('📡 Fetching unread count...')
      const response = await api.notifications.getUnreadCount()
      console.log('📨 Unread count response:', response)
      
      if (response?.success) {
        setUnreadCount(response.count || 0)
      } else if (response?.count !== undefined) {
        setUnreadCount(response.count)
      } else if (response?.unreadCount !== undefined) {
        setUnreadCount(response.unreadCount)
      }
    } catch (error) {
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
      
      let notificationsList = []
      let unread = 0
      
      if (response?.success) {
        notificationsList = response.notifications || []
        unread = response.unreadCount !== undefined ? response.unreadCount : 
                 response.count !== undefined ? response.count : 0
      } else if (response?.notifications) {
        notificationsList = response.notifications
        unread = response.unreadCount || response.count || 0
      } else if (Array.isArray(response)) {
        notificationsList = response
        unread = response.filter(n => !n.isRead).length
      } else if (response?.data) {
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

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      console.log('📡 Polling stopped')
    }
  }, [])

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return
    
    console.log('📡 Starting polling fallback')
    fetchUnreadCount()
    
    pollingIntervalRef.current = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // Poll every 30 seconds
    
    return () => stopPolling()
  }, [fetchUnreadCount, stopPolling])

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || !user) return
    
    // Close existing connection
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    const token = localStorage.getItem('admin_access_token')
    if (!token) {
      console.log('📡 No token, using polling')
      startPolling()
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000'
    
    console.log('📡 Connecting to WebSocket...', wsUrl)
    
    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      query: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true
    })

    socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)
      reconnectAttempts.current = 0
      stopPolling()
      
      // Join user rooms
      if (user?.id) {
        socket.emit('join', `user:${user.id}`)
        socket.emit('join', `user-${user.id}`)
      }
      
      if (user?.role) {
        socket.emit('join', `role:${user.role}`)
        socket.emit('join', `role-${user.role}`)
      }
      
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        socket.emit('join', 'admins')
      }
    })

    socket.on('notification', (data) => {
      console.log('📨 New notification:', data)
      
      setUnreadCount(prev => prev + 1)
      
      setNotifications(prev => {
        // Don't add duplicates
        if (prev.some(n => n._id === data._id)) return prev
        return [data, ...prev].slice(0, 50)
      })
      
      showToast({
        title: data?.title || 'New Notification',
        description: data?.message || '',
        type: data?.priority === 'high' || data?.priority === 'urgent' ? 'warning' : 'info',
        duration: 5000
      })
    })

    socket.on('notification:read', (data) => {
      console.log('📨 Notification read:', data)
      
      setNotifications(prev =>
        prev.map(n => 
          n._id === data.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    })

    socket.on('notifications:read', (data) => {
      console.log('📨 Multiple notifications read:', data)
      
      if (data?.notificationIds) {
        setNotifications(prev =>
          prev.map(n => 
            data.notificationIds.includes(n._id) 
              ? { ...n, isRead: true, readAt: new Date().toISOString() } 
              : n
          )
        )
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount)
        }
      }
    })

    socket.on('notifications:all-read', () => {
      console.log('📨 All notifications marked as read')
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    })

    socket.on('notification:archived', (data) => {
      console.log('📨 Notification archived:', data)
      
      setNotifications(prev => prev.filter(n => n._id !== data.id))
    })

    socket.on('notification:deleted', (data) => {
      console.log('📨 Notification deleted:', data)
      
      setNotifications(prev => prev.filter(n => n._id !== data.id))
    })

    socket.on('notifications:cleared', () => {
      console.log('📨 All notifications cleared')
      setNotifications([])
      setUnreadCount(0)
    })

    socket.on('connected', (data) => {
      console.log('📨 Connection confirmed:', data)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      setIsConnected(false)
      
      if (reason === 'io server disconnect' || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log('📡 Falling back to polling')
        startPolling()
      }
    })

    socket.on('connect_error', (error) => {
      console.log('⚠️ WebSocket connection error:', error.message)
      reconnectAttempts.current++
      
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log('📡 Max reconnect attempts reached, falling back to polling')
        socket.disconnect()
        startPolling()
      }
    })

    socketRef.current = socket
  }, [isAuthenticated, user, showToast, startPolling, stopPolling])

  // Mark a single notification as read
  const markAsRead = useCallback(async (id) => {
    if (!isAuthenticated) return
    
    try {
      await api.notifications.markAsRead(id)
      
      setNotifications(prev =>
        prev.map(n => 
          n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
      
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
      
      const wasUnread = notifications.find(n => n._id === id)?.isRead === false
      setNotifications(prev => prev.filter(n => n._id !== id))
      
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

  // WebSocket connection
  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket()
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      stopPolling()
    }
  }, [isAuthenticated, connectWebSocket, stopPolling])

  const value = {
    unreadCount,
    setUnreadCount,
    notifications,
    setNotifications,
    loading,
    isConnected,
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