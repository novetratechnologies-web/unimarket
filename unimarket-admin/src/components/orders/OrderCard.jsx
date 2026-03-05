// admin/src/components/orders/OrderCard.jsx
import React from 'react';
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  ChevronRight,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300'
  },
  processing: {
    icon: Package,
    label: 'Processing',
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
    icon: Truck,
    label: 'Shipped',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300'
  },
  delivered: {
    icon: CheckCircle,
    label: 'Delivered',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300'
  }
};

const OrderCard = ({ order, onView, onEdit, onUpdateStatus }) => {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const getCustomerName = () => {
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

  const getCustomerInitials = () => {
    const name = getCustomerName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || '?';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group">
      {/* Header with Status */}
      <div className={`p-4 border-b border-gray-100 ${statusConfig.bgColor} bg-opacity-30 rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
            </div>
            <span className={`text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <div className="relative">
            <button className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Order Number and Customer */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {order.orderNumber || `#${order._id?.slice(-8)}`}
            </h3>
            <div className="flex items-center mt-1">
              <div className="w-6 h-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 font-medium text-xs mr-2">
                {getCustomerInitials()}
              </div>
              <span className="text-sm text-gray-600">{getCustomerName()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(order.total, order.currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {order.itemCount || 0} items
            </div>
          </div>
        </div>

        {/* Date and Payment */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(order.orderDate || order.createdAt), { addSuffix: true })}
          </div>
          <div className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            <span className={`px-2 py-0.5 rounded-full ${
              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
              order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {order.paymentStatus || 'Pending'}
            </span>
          </div>
        </div>

        {/* Products Preview */}
        {order.items && order.items.length > 0 && (
          <div className="mb-4">
            <div className="flex -space-x-2 overflow-hidden">
              {order.items.slice(0, 3).map((item, index) => (
                <div
                  key={index}
                  className="inline-block w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                  title={item.productSnapshot?.name || item.product?.name}
                >
                  {item.productSnapshot?.name?.[0] || 'P'}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="inline-block w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onView(order)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Order"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => onEdit(order)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Order"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => onUpdateStatus(order)}
            className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <span>Update Status</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Footer with additional info */}
      {(order.vendors?.length > 1 || order.tags?.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 rounded-b-xl">
          <div className="flex items-center space-x-2">
            {order.vendors?.length > 1 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {order.vendors.length} vendors
              </span>
            )}
            {order.tags?.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {order.tags?.length > 2 && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                +{order.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;