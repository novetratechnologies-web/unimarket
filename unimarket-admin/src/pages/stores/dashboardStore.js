import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // METRICS VISIBILITY STATE
      // ============================================
      hiddenMetrics: [],
      
      toggleMetric: (metricId) => {
        set((state) => {
          const isHidden = state.hiddenMetrics.includes(metricId)
          return {
            hiddenMetrics: isHidden
              ? state.hiddenMetrics.filter(id => id !== metricId)
              : [...state.hiddenMetrics, metricId]
          }
        })
      },
      
      showAllMetrics: () => set({ hiddenMetrics: [] }),
      
      hideAllMetrics: () => {
        const allMetrics = [
          'revenue', 'orders', 'products', 'customers', 
          'conversion', 'aov', 'refundRate', 'satisfaction'
        ]
        set({ hiddenMetrics: allMetrics })
      },
      
      resetMetrics: () => set({ hiddenMetrics: [] }),

      // ============================================
      // VIEW STATE
      // ============================================
      selectedView: 'overview',
      
      setSelectedView: (view) => set({ selectedView: view }),

      // ============================================
      // USER PREFERENCES
      // ============================================
      preferences: {
        enableRealtime: true,
        autoRefresh: true,
        refreshInterval: 30000,
        defaultTimeRange: 'monthly',
        showComparison: true,
        compactMode: false,
        permissions: [],
        theme: 'light',
        notifications: true,
        chartType: 'line',
        chartColors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
        density: 'comfortable', // comfortable, compact
        showAnnotations: true,
        enableForecasting: false
      },
      
      updatePreferences: (newPrefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPrefs }
        }))
      },
      
      toggleRealtime: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            enableRealtime: !state.preferences.enableRealtime
          }
        }))
      },
      
      toggleTheme: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            theme: state.preferences.theme === 'light' ? 'dark' : 'light'
          }
        }))
      },
      
      setChartType: (type) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            chartType: type
          }
        }))
      },

      // ============================================
      // DASHBOARD LAYOUT STATE (for drag & drop)
      // ============================================
      layout: [
        { i: 'stats', x: 0, y: 0, w: 12, h: 1, minW: 12, maxW: 12 },
        { i: 'quickActions', x: 0, y: 1, w: 12, h: 1, minW: 12, maxW: 12 },
        { i: 'chart', x: 0, y: 2, w: 8, h: 2, minW: 6, maxW: 12 },
        { i: 'topProducts', x: 8, y: 2, w: 4, h: 2, minW: 3, maxW: 6 },
        { i: 'recentOrders', x: 0, y: 4, w: 6, h: 2, minW: 4, maxW: 12 },
        { i: 'revenueBreakdown', x: 6, y: 4, w: 6, h: 2, minW: 4, maxW: 12 },
        { i: 'customerInsights', x: 0, y: 6, w: 4, h: 2, minW: 3, maxW: 6 },
        { i: 'activityFeed', x: 4, y: 6, w: 4, h: 2, minW: 3, maxW: 6 },
        { i: 'systemHealth', x: 8, y: 6, w: 4, h: 2, minW: 3, maxW: 6 }
      ],
      
      updateLayout: (newLayout) => set({ layout: newLayout }),
      
      resetLayout: () => {
        set({
          layout: [
            { i: 'stats', x: 0, y: 0, w: 12, h: 1, minW: 12, maxW: 12 },
            { i: 'quickActions', x: 0, y: 1, w: 12, h: 1, minW: 12, maxW: 12 },
            { i: 'chart', x: 0, y: 2, w: 8, h: 2, minW: 6, maxW: 12 },
            { i: 'topProducts', x: 8, y: 2, w: 4, h: 2, minW: 3, maxW: 6 },
            { i: 'recentOrders', x: 0, y: 4, w: 6, h: 2, minW: 4, maxW: 12 },
            { i: 'revenueBreakdown', x: 6, y: 4, w: 6, h: 2, minW: 4, maxW: 12 },
            { i: 'customerInsights', x: 0, y: 6, w: 4, h: 2, minW: 3, maxW: 6 },
            { i: 'activityFeed', x: 4, y: 6, w: 4, h: 2, minW: 3, maxW: 6 },
            { i: 'systemHealth', x: 8, y: 6, w: 4, h: 2, minW: 3, maxW: 6 }
          ]
        })
      },

      // ============================================
      // DATE RANGE PRESETS
      // ============================================
      datePresets: {
        today: { label: 'Today', days: 0, value: 'today' },
        yesterday: { label: 'Yesterday', days: 1, value: 'yesterday' },
        last7Days: { label: 'Last 7 Days', days: 7, value: 'last7Days' },
        last30Days: { label: 'Last 30 Days', days: 30, value: 'last30Days' },
        last90Days: { label: 'Last 90 Days', days: 90, value: 'last90Days' },
        thisMonth: { label: 'This Month', days: 'month', value: 'thisMonth' },
        lastMonth: { label: 'Last Month', days: 'lastMonth', value: 'lastMonth' },
        thisYear: { label: 'This Year', days: 'year', value: 'thisYear' },
        custom: { label: 'Custom', days: 'custom', value: 'custom' }
      },
      
      selectedDatePreset: 'last30Days',
      
      setDatePreset: (preset) => set({ selectedDatePreset: preset }),

      // ============================================
      // CHART PREFERENCES
      // ============================================
      chartPreferences: {
        showGrid: true,
        showLegend: true,
        smoothLines: true,
        stackedBars: false,
        chartType: 'line',
        showMarkers: false,
        fillArea: false,
        animation: true,
        tooltipMode: 'single', // single, all
        yAxisScale: 'linear', // linear, log
        comparison: 'previous_period' // previous_period, previous_year, custom
      },
      
      updateChartPreferences: (prefs) => {
        set((state) => ({
          chartPreferences: { ...state.chartPreferences, ...prefs }
        }))
      },

      // ============================================
      // FILTERS STATE
      // ============================================
      filters: {
        vendor: null,
        category: null,
        status: null,
        paymentMethod: null,
        search: ''
      },
      
      setFilter: (key, value) => {
        set((state) => ({
          filters: { ...state.filters, [key]: value }
        }))
      },
      
      resetFilters: () => {
        set({
          filters: {
            vendor: null,
            category: null,
            status: null,
            paymentMethod: null,
            search: ''
          }
        })
      },

      // ============================================
      // NOTIFICATIONS STATE
      // ============================================
      notifications: [],
      
      addNotification: (notification) => {
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              id: Date.now(),
              read: false,
              timestamp: new Date().toISOString(),
              ...notification
            }
          ].slice(-50) // Keep only last 50 notifications
        }))
      },
      
      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }))
      },
      
      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }))
      },
      
      clearNotifications: () => set({ notifications: [] }),

      // ============================================
      // DASHBOARD STATE RESET
      // ============================================
      resetToDefaults: () => {
        set({
          hiddenMetrics: [],
          selectedView: 'overview',
          preferences: {
            enableRealtime: true,
            autoRefresh: true,
            refreshInterval: 30000,
            defaultTimeRange: 'monthly',
            showComparison: true,
            compactMode: false,
            permissions: get().preferences.permissions,
            theme: 'light',
            notifications: true,
            chartType: 'line',
            chartColors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
            density: 'comfortable',
            showAnnotations: true,
            enableForecasting: false
          },
          selectedDatePreset: 'last30Days',
          chartPreferences: {
            showGrid: true,
            showLegend: true,
            smoothLines: true,
            stackedBars: false,
            chartType: 'line',
            showMarkers: false,
            fillArea: false,
            animation: true,
            tooltipMode: 'single',
            yAxisScale: 'linear',
            comparison: 'previous_period'
          },
          filters: {
            vendor: null,
            category: null,
            status: null,
            paymentMethod: null,
            search: ''
          }
        })
      },

      // ============================================
      // ANALYTICS & TRACKING
      // ============================================
      userActions: [],
      
      trackAction: (action) => {
        set((state) => ({
          userActions: [
            ...state.userActions,
            {
              ...action,
              timestamp: new Date().toISOString()
            }
          ].slice(-100) // Keep last 100 actions
        }))
      },
      
      clearUserActions: () => set({ userActions: [] })
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        // Only persist these fields
        hiddenMetrics: state.hiddenMetrics,
        preferences: {
          ...state.preferences,
          permissions: [] // Don't persist permissions
        },
        selectedDatePreset: state.selectedDatePreset,
        chartPreferences: state.chartPreferences,
        layout: state.layout,
        filters: state.filters
      }),
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migrate from version 0 to 1
          return {
            ...persistedState,
            chartPreferences: {
              showGrid: true,
              showLegend: true,
              smoothLines: true,
              stackedBars: false,
              chartType: 'line',
              showMarkers: false,
              fillArea: false,
              animation: true,
              tooltipMode: 'single',
              yAxisScale: 'linear',
              comparison: 'previous_period',
              ...persistedState.chartPreferences
            }
          }
        }
        return persistedState
      }
    }
  )
)

// ============================================
// CUSTOM HOOKS
// ============================================

/**
 * Hook for checking user permissions
 */
export const usePermissions = () => {
  const { preferences } = useDashboardStore()
  
  return {
    hasPermission: (permission) => {
      return preferences.permissions?.includes(permission) ?? false
    },
    
    hasAnyPermission: (permissions) => {
      return permissions.some(p => preferences.permissions?.includes(p) ?? false)
    },
    
    hasAllPermissions: (permissions) => {
      return permissions.every(p => preferences.permissions?.includes(p) ?? false)
    },
    
    permissions: preferences.permissions || []
  }
}

/**
 * Hook for dashboard metrics visibility
 */
export const useDashboardMetrics = () => {
  const { hiddenMetrics, toggleMetric, showAllMetrics, hideAllMetrics, resetMetrics } = useDashboardStore()
  
  return {
    isMetricHidden: (metricId) => hiddenMetrics.includes(metricId),
    hiddenMetrics,
    toggleMetric,
    showAllMetrics,
    hideAllMetrics,
    resetMetrics
  }
}

/**
 * Hook for date range management
 */
export const useDateRange = () => {
  const { datePresets, selectedDatePreset, setDatePreset } = useDashboardStore()
  
  const getDateRangeFromPreset = (presetValue) => {
    const now = new Date()
    const end = new Date()
    let start = new Date()
    
    switch(presetValue) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() - 1)
        end.setHours(23, 59, 59, 999)
        break
      case 'last7Days':
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'last30Days':
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'last90Days':
        start.setDate(start.getDate() - 90)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      default:
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
    }
    
    return { start, end }
  }
  
  return {
    datePresets,
    selectedDatePreset,
    setDatePreset,
    getDateRangeFromPreset
  }
}

/**
 * Hook for dashboard filters
 */
export const useDashboardFilters = () => {
  const { filters, setFilter, resetFilters } = useDashboardStore()
  
  return {
    filters,
    setFilter,
    resetFilters,
    hasActiveFilters: Object.values(filters).some(v => v !== null && v !== '')
  }
}

/**
 * Hook for notifications
 */
export const useNotifications = () => {
  const { notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } = useDashboardStore()
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  return {
    notifications,
    unreadCount,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications
  }
}

/**
 * Hook for layout management
 */
export const useDashboardLayout = () => {
  const { layout, updateLayout, resetLayout } = useDashboardStore()
  
  return {
    layout,
    updateLayout,
    resetLayout,
    isLayoutDirty: false // You can implement this with a comparison
  }
}

/**
 * Hook for chart preferences
 */
export const useChartPreferences = () => {
  const { chartPreferences, updateChartPreferences } = useDashboardStore()
  
  return {
    ...chartPreferences,
    updateChartPreferences
  }
}

// ============================================
// SELECTORS (for performance optimization)
// ============================================

export const selectHiddenMetrics = (state) => state.hiddenMetrics
export const selectPreferences = (state) => state.preferences
export const selectLayout = (state) => state.layout
export const selectFilters = (state) => state.filters
export const selectNotifications = (state) => state.notifications
export const selectChartPreferences = (state) => state.chartPreferences
export const selectSelectedView = (state) => state.selectedView
export const selectDatePreset = (state) => state.selectedDatePreset

export default useDashboardStore