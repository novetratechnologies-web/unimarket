import { useState, useCallback } from 'react'

// Simple toast hook - you can replace this with a proper toast library
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback(({ title, description, type = 'info', duration = 5000 }) => {
    const id = Date.now()
    const toast = { id, title, description, type, duration }
    
    setToasts((prev) => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Toast - ${type}]:`, { title, description })
    }
    
    return id
  }, [])

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return {
    toasts,
    showToast,
    hideToast,
    success: (title, description) => showToast({ title, description, type: 'success' }),
    error: (title, description) => showToast({ title, description, type: 'error' }),
    warning: (title, description) => showToast({ title, description, type: 'warning' }),
    info: (title, description) => showToast({ title, description, type: 'info' })
  }
}