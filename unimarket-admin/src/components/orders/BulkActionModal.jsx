// admin/src/components/orders/BulkActionModal.jsx
import React, { useState } from 'react';
import {
  X,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Tag,
  Trash2,
  Download,
  Printer,
  Send,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

const BulkActionModal = ({ action, selectedOrders, onClose, onSuccess }) => {
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [tags, setTags] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!selectedOrders.length) {
      showToast('No orders selected', 'error');
      return;
    }

    try {
      setLoading(true);

      switch (action) {
        case 'update-status':
          if (!status) {
            showToast('Please select a status', 'error');
            return;
          }
          await api.orders.bulkUpdate({
            orderIds: selectedOrders,
            action: 'update-status',
            data: { status, note }
          });
          showToast(`Updated ${selectedOrders.length} orders to ${status}`, 'success');
          break;

        case 'update-payment':
          if (!paymentStatus) {
            showToast('Please select a payment status', 'error');
            return;
          }
          await api.orders.bulkUpdate({
            orderIds: selectedOrders,
            action: 'update-payment-status',
            data: { paymentStatus, note }
          });
          showToast(`Updated payment status for ${selectedOrders.length} orders`, 'success');
          break;

        case 'add-tags':
          if (!tags) {
            showToast('Please enter tags', 'error');
            return;
          }
          await api.orders.bulkUpdate({
            orderIds: selectedOrders,
            action: 'add-tags',
            data: { tags: tags.split(',').map(t => t.trim()) }
          });
          showToast(`Added tags to ${selectedOrders.length} orders`, 'success');
          break;

        case 'remove-tags':
          if (!tags) {
            showToast('Please enter tags', 'error');
            return;
          }
          await api.orders.bulkUpdate({
            orderIds: selectedOrders,
            action: 'remove-tags',
            data: { tags: tags.split(',').map(t => t.trim()) }
          });
          showToast(`Removed tags from ${selectedOrders.length} orders`, 'success');
          break;

        case 'delete':
          if (!confirmDelete) {
            showToast('Please confirm deletion', 'error');
            return;
          }
          await api.orders.bulkUpdate({
            orderIds: selectedOrders,
            action: 'delete',
            data: { reason }
          });
          showToast(`Deleted ${selectedOrders.length} orders`, 'success');
          break;

        case 'export':
          // Handle export separately
          break;

        case 'print':
          // Handle print separately
          break;

        case 'send-notification':
          await api.post('/orders/bulk/notify', {
            orderIds: selectedOrders,
            message: note
          });
          showToast(`Sent notifications for ${selectedOrders.length} orders`, 'success');
          break;
      }

      onSuccess();
    } catch (error) {
      showToast(error.message || 'Failed to perform bulk action', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'update-status': return 'Update Order Status';
      case 'update-payment': return 'Update Payment Status';
      case 'add-tags': return 'Add Tags to Orders';
      case 'remove-tags': return 'Remove Tags from Orders';
      case 'delete': return 'Delete Orders';
      case 'export': return 'Export Orders';
      case 'print': return 'Print Orders';
      case 'send-notification': return 'Send Notification';
      default: return 'Bulk Action';
    }
  };

  const getIcon = () => {
    switch (action) {
      case 'update-status': return Package;
      case 'update-payment': return DollarSign;
      case 'add-tags':
      case 'remove-tags': return Tag;
      case 'delete': return Trash2;
      case 'export': return Download;
      case 'print': return Printer;
      case 'send-notification': return Send;
      default: return AlertCircle;
    }
  };

  const Icon = getIcon();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <p className="mt-2 text-sm text-white text-opacity-90">
              {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {action === 'update-status' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            )}

            {action === 'update-payment' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="partially_refunded">Partially Refunded</option>
                </select>
              </div>
            )}

            {(action === 'add-tags' || action === 'remove-tags') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="urgent, international, gift"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            {action === 'delete' && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This action will permanently delete {selectedOrders.length} order
                        {selectedOrders.length !== 1 ? 's' : ''}. This cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for deletion (optional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Duplicate orders, test data"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="confirmDelete"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="confirmDelete" className="ml-2 text-sm text-gray-700">
                    I understand this action cannot be undone
                  </label>
                </div>
              </>
            )}

            {(action === 'send-notification' || action === 'update-status' || action === 'update-payment') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows="3"
                  placeholder="Add a note about this action..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            {action === 'export' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Export options will be handled in the export modal.
                </p>
              </div>
            )}

            {action === 'print' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Print options will open in a new window.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (action === 'delete' && !confirmDelete)}
              className={`px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
            >
              {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {action === 'delete' ? 'Delete Orders' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;