// admin/src/components/orders/OrderDetailModal.jsx
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
  CreditCard,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Printer,
  Download,
  Edit,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300'
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300'
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300'
  },
  refunded: {
    label: 'Refunded',
    icon: XCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300'
  }
};

const OrderDetailModal = ({ order, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    customer: true,
    shipping: true,
    payment: true,
    timeline: false
  });
  const { showToast } = useToast();

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy • h:mm a');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await api.orders.updateStatus(order._id, { status: newStatus });
      showToast('Order status updated successfully', 'success');
      onUpdate();
    } catch (error) {
      showToast(error.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendNotification = async () => {
    try {
      setLoading(true);
      await api.post(`/orders/${order._id}/notify`);
      showToast('Notification sent to customer', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to send notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${statusConfig.bgColor}`}>
                <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  Order {order.orderNumber || `#${order._id?.slice(-8)}`}
                  <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Placed on {formatDate(order.orderDate || order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print"
              >
                <Printer className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => handleCopy(order.orderNumber)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy Order Number"
              >
                <Copy className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleSendNotification}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Send Notification"
              >
                <Send className={`h-5 w-5 text-gray-600 ${loading ? 'animate-pulse' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {['details', 'items', 'timeline', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <button
                    onClick={() => toggleSection('customer')}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Customer Information</h3>
                    </div>
                    {expandedSections.customer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {expandedSections.customer && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Name</p>
                        <p className="text-sm font-medium text-gray-900">{getCustomerName(order)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900">{getCustomerEmail(order)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{getCustomerPhone(order)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Customer Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {order.customer ? 'Registered' : 'Guest'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <button
                    onClick={() => toggleSection('shipping')}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                    </div>
                    {expandedSections.shipping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {expandedSections.shipping && order.shippingAddress && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-900">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      {order.shippingAddress.company && (
                        <p className="text-sm text-gray-600">{order.shippingAddress.company}</p>
                      )}
                      <p className="text-sm text-gray-600">{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && (
                        <p className="text-sm text-gray-600">{order.shippingAddress.addressLine2}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                      {order.shippingAddress.phone && (
                        <p className="text-sm text-gray-600 mt-2">Phone: {order.shippingAddress.phone}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <button
                    onClick={() => toggleSection('payment')}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Payment Information</h3>
                    </div>
                    {expandedSections.payment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {expandedSections.payment && (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.subtotal, order.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Shipping</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.shippingTotal, order.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tax</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.taxTotal, order.currency)}
                        </span>
                      </div>
                      {order.discountTotal > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="text-sm">Discount</span>
                          <span className="text-sm font-medium">
                            -{formatCurrency(order.discountTotal, order.currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-gray-200">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-base font-bold text-gray-900">
                          {formatCurrency(order.total, order.currency)}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Status</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                            order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        {order.paymentMethod && (
                          <div className="flex justify-between mt-2">
                            <span className="text-sm text-gray-600">Payment Method</span>
                            <span className="text-sm font-medium text-gray-900">
                              {order.paymentMethodName || order.paymentMethod}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Update */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => handleUpdateStatus(key)}
                          disabled={updating || order.status === key}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                            order.status === key
                              ? `${config.bgColor} ${config.borderColor} cursor-default`
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Order Items</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {order.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {item.productSnapshot?.image && (
                                <img
                                  src={item.productSnapshot.image}
                                  alt={item.productSnapshot.name}
                                  className="w-10 h-10 rounded-lg object-cover mr-3"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.productSnapshot?.name || item.product?.name || 'Product'}
                                </p>
                                {item.variant && (
                                  <p className="text-xs text-gray-500">
                                    {Object.entries(item.variant.options || {}).map(([key, value]) => 
                                      `${key}: ${value}`
                                    ).join(', ')}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">SKU: {item.productSnapshot?.sku || item.product?.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(item.price, order.currency)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {formatCurrency((item.price * item.quantity) - (item.discount || 0), order.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm text-gray-600">Subtotal</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(order.subtotal, order.currency)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm text-gray-600">Shipping</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(order.shippingTotal, order.currency)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm text-gray-600">Tax</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(order.taxTotal, order.currency)}
                        </td>
                      </tr>
                      {order.discountTotal > 0 && (
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right text-sm text-green-600">Discount</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                            -{formatCurrency(order.discountTotal, order.currency)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t border-gray-200">
                        <td colSpan="3" className="px-4 py-3 text-right text-base font-semibold text-gray-900">Total</td>
                        <td className="px-4 py-3 text-right text-base font-bold text-gray-900">
                          {formatCurrency(order.total, order.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Order Timeline</h3>
                <div className="relative pl-8 space-y-6">
                  {/* Order Created */}
                  <div className="relative">
                    <div className="absolute left-0 top-1.5 -ml-8 w-4 h-4 rounded-full bg-green-500 border-4 border-green-100"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Placed</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {/* Payment Received */}
                  {order.paymentStatus === 'paid' && (
                    <div className="relative">
                      <div className="absolute left-0 top-1.5 -ml-8 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Payment Received</p>
                        <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {/* Status Changes */}
                  {order.statusHistory?.map((history, index) => (
                    <div key={index} className="relative">
                      <div className="absolute left-0 top-1.5 -ml-8 w-4 h-4 rounded-full bg-gray-400 border-4 border-gray-200"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          Status changed to {history.status}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(history.changedAt)}</p>
                        {history.note && (
                          <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Shipping Updates */}
                  {order.shippingTracking?.map((tracking, index) => (
                    <div key={index} className="relative">
                      <div className="absolute left-0 top-1.5 -ml-8 w-4 h-4 rounded-full bg-purple-500 border-4 border-purple-100"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tracking.status === 'delivered' ? 'Order Delivered' : 'Order Shipped'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(tracking.shippedAt)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Carrier: {tracking.carrier} • Tracking: {tracking.trackingNumber}
                        </p>
                        {tracking.trackingUrl && (
                          <a
                            href={tracking.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block"
                          >
                            Track Package
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Order Notes</h3>
                
                {/* Add Note Form */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <textarea
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                  ></textarea>
                  <div className="mt-3 flex justify-end">
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Existing Notes */}
                <div className="space-y-3">
                  {order.adminNotes?.map((note, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {note.createdBy?.firstName || 'Admin'}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{note.note}</p>
                      {note.type && (
                        <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs ${
                          note.type === 'info' ? 'bg-blue-100 text-blue-700' :
                          note.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {note.type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Close
            </button>
            <button
              onClick={() => navigate(`/orders/${order._id}/edit`)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Edit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getCustomerName = (order) => {
  if (order.customerName) return order.customerName;
  if (order.customer) {
    if (typeof order.customer === 'object') {
      return `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Customer';
    }
  }
  if (order.guestDetails) {
    return `${order.guestDetails.firstName || ''} ${order.guestDetails.lastName || ''}`.trim() || 'Guest';
  }
  if (order.shippingAddress) {
    return `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() || 'Customer';
  }
  return 'Customer';
};

const getCustomerEmail = (order) => {
  if (order.customerEmail) return order.customerEmail;
  if (order.customer?.email) return order.customer.email;
  if (order.guestEmail) return order.guestEmail;
  if (order.guestDetails?.email) return order.guestDetails.email;
  if (order.shippingAddress?.email) return order.shippingAddress.email;
  return 'N/A';
};

const getCustomerPhone = (order) => {
  if (order.customer?.phone) return order.customer.phone;
  if (order.guestDetails?.phone) return order.guestDetails.phone;
  if (order.shippingAddress?.phone) return order.shippingAddress.phone;
  return 'N/A';
};

export default OrderDetailModal;