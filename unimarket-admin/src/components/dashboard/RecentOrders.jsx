// admin/src/components/dashboard/RecentOrders.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ShoppingCart, ChevronRight, Package, Truck, CheckCircle, XCircle } from 'lucide-react';

const RecentOrders = ({ orders = [], loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium">No orders yet</p>
        <p className="text-sm text-gray-500 mt-1">When you receive orders, they'll appear here</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {orders.slice(0, 5).map((order) => (
        <button
          key={order._id}
          onClick={() => navigate(`/orders/${order._id}`)}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
        >
          <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
            {getStatusIcon(order.status)}
          </div>
          
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                #{order.orderNumber || order._id?.slice(-6)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {order.status || 'Pending'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <span>{order.customer?.name || order.customer?.email || 'Guest'}</span>
              <span>•</span>
              <span className="font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total)}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              {formatDistance(new Date(order.createdAt), new Date(), { addSuffix: true })}
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}

      {orders.length > 5 && (
        <button
          onClick={() => navigate('/orders')}
          className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
        >
          View all {orders.length} orders
        </button>
      )}
    </div>
  );
};

export default RecentOrders;