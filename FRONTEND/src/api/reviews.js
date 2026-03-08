// src/api/reviews.js
import { apiCall } from './index';

const reviewsAPI = {
  // ============================================
  // REVIEWS - Product reviews
  // ============================================

  /**
   * Get reviews for a product
   * @param {string} productId - Product ID
   * @param {Object} params - Pagination & filter params
   * @returns {Promise} List of reviews
   */
  getProductReviews: (productId, params) => 
    apiCall('GET', `/products/${productId}/reviews`, null, { params }),

  /**
   * Get review summary for a product
   * @param {string} productId - Product ID
   * @returns {Promise} Review statistics (average, counts, etc.)
   */
  getReviewSummary: (productId) => 
    apiCall('GET', `/products/${productId}/reviews/summary`),

  /**
   * Get user's own reviews
   * @param {Object} params - Pagination params
   * @returns {Promise} User's reviews
   */
  getMyReviews: (params) => apiCall('GET', '/user/reviews', null, { params }),

  /**
   * Create a new review
   * @param {Object} reviewData
   * @param {string} reviewData.productId - Product ID
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.title - Review title
   * @param {string} reviewData.comment - Review comment
   * @param {Array} reviewData.images - Optional review images
   * @returns {Promise} Created review
   */
  create: (reviewData) => apiCall('POST', '/reviews', reviewData),

  /**
   * Update a review
   * @param {string} id - Review ID
   * @param {Object} reviewData - Updated review data
   * @returns {Promise} Updated review
   */
  update: (id, reviewData) => apiCall('PUT', `/reviews/${id}`, reviewData),

  /**
   * Delete a review
   * @param {string} id - Review ID
   * @returns {Promise} Deletion result
   */
  delete: (id) => apiCall('DELETE', `/reviews/${id}`),

  /**
   * Mark a review as helpful
   * @param {string} id - Review ID
   * @returns {Promise} Updated helpful count
   */
  markHelpful: (id) => apiCall('POST', `/reviews/${id}/helpful`),

  /**
   * Unmark a review as helpful
   * @param {string} id - Review ID
   * @returns {Promise} Updated helpful count
   */
  unmarkHelpful: (id) => apiCall('DELETE', `/reviews/${id}/helpful`),

  /**
   * Report a review
   * @param {string} id - Review ID
   * @param {string} reason - Report reason
   * @returns {Promise} Report result
   */
  report: (id, reason) => apiCall('POST', `/reviews/${id}/report`, { reason }),

  /**
   * Get review by ID
   * @param {string} id - Review ID
   * @returns {Promise} Review details
   */
  getById: (id) => apiCall('GET', `/reviews/${id}`),

  /**
   * Get review images
   * @param {string} id - Review ID
   * @returns {Promise} Review images
   */
  getImages: (id) => apiCall('GET', `/reviews/${id}/images`),

  /**
   * Upload review images
   * @param {string} id - Review ID
   * @param {FormData} formData - Form data with images
   * @returns {Promise} Updated review with images
   */
  uploadImages: (id, formData) => apiCall('POST', `/reviews/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  /**
   * Delete review image
   * @param {string} id - Review ID
   * @param {string} imageId - Image ID
   * @returns {Promise} Updated review
   */
  deleteImage: (id, imageId) => apiCall('DELETE', `/reviews/${id}/images/${imageId}`),
};

export default reviewsAPI;