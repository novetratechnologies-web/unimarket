// admin/src/services/customerService.js
import api from '../api/api';

class CustomerService {
  /**
   * Get all customers with filters
   */
  async getCustomers(params = {}) {
    try {
      const response = await api.get('/admin/users', { params });
      return response;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id) {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(data) {
    try {
      const response = await api.post('/admin/users', data);
      return response;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(id, data) {
    try {
      const response = await api.put(`/admin/users/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id) {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId, params = {}) {
    try {
      const response = await api.get(`/admin/users/${customerId}/orders`, { params });
      return response;
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    try {
      const response = await api.get('/admin/users/stats');
      return response;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }

  /**
   * Bulk update customers
   */
  async bulkUpdateCustomers(data) {
    try {
      const response = await api.post('/admin/users/bulk', data);
      return response;
    } catch (error) {
      console.error('Error bulk updating customers:', error);
      throw error;
    }
  }

  /**
   * Export customers
   */
  async exportCustomers(params = {}) {
    try {
      const response = await api.get('/admin/users/export', { 
        params,
        responseType: 'blob' 
      });
      return response;
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw error;
    }
  }
}

export default new CustomerService();