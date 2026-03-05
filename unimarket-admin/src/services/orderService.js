// services/orderService.js
import api from '../api/api'

export const orderService = {
  // Get all orders (admin/vendor)
  getOrders: async (params = {}) => {
    try {
      // Convert array params to comma-separated strings if needed
      const cleanParams = { ...params }
      
      // Handle status array
      if (Array.isArray(cleanParams.status)) {
        cleanParams.status = cleanParams.status.join(',')
      }
      
      const response = await api.get('/orders', { params: cleanParams })
      return response.data
    } catch (error) {
      console.error('Get orders error:', error)
      throw error
    }
  },

  // Get customer's own orders
  getMyOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders/my-orders', { params })
      return response.data
    } catch (error) {
      console.error('Get my orders error:', error)
      throw error
    }
  },

  // Get vendor orders
  getVendorOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders/vendor', { params })
      return response.data
    } catch (error) {
      console.error('Get vendor orders error:', error)
      throw error
    }
  },

  // Get single order
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`)
      return response.data
    } catch (error) {
      console.error('Get order by id error:', error)
      throw error
    }
  },

  // Get order by order number
  getOrderByNumber: async (orderNumber) => {
    try {
      const response = await api.get(`/orders/number/${orderNumber}`)
      return response.data
    } catch (error) {
      console.error('Get order by number error:', error)
      throw error
    }
  },

  // Update order status
  updateOrderStatus: async (id, data) => {
    try {
      const response = await api.put(`/orders/${id}/status`, data)
      return response.data
    } catch (error) {
      console.error('Update order status error:', error)
      throw error
    }
  },

  // Cancel order
  cancelOrder: async (id) => {
    try {
      const response = await api.post(`/orders/${id}/cancel`)
      return response.data
    } catch (error) {
      console.error('Cancel order error:', error)
      throw error
    }
  }
}