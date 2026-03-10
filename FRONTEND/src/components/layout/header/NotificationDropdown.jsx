// components/layout/header/NotificationDropdown.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  Zap, 
  Package, 
  TrendingUp, 
  Gift, 
  MessageSquare,
  ShoppingBag,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sample notifications data
const notifications = [
  { id: 1, title: "Sale Alert", message: "50% off on electronics!", time: "5 min ago", read: false, icon: <Zap className="w-4 h-4" />, type: "sale" },
  { id: 2, title: "Order Shipped", message: "Your order #12345 has been shipped", time: "2 hours ago", read: false, icon: <Package className="w-4 h-4" />, type: "order" },
  { id: 3, title: "Price Drop", message: "Item in your wishlist is now 20% off", time: "1 day ago", read: true, icon: <TrendingUp className="w-4 h-4" />, type: "price" },
  { id: 4, title: "New Message", message: "You have a new message from seller", time: "2 days ago", read: true, icon: <MessageSquare className="w-4 h-4" />, type: "message" },
];

const NotificationDropdown = ({ isOpen, onToggle, onClose }) => {
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification) => {
    // Handle different notification types
    switch(notification.type) {
      case 'order':
        navigate('/orders');
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'sale':
      case 'price':
        navigate('/offers');
        break;
      default:
        navigate('/notifications');
    }
    onClose();
  };

  const getIconBackground = (type, read) => {
    if (read) return 'bg-gray-100 text-gray-600';
    switch(type) {
      case 'sale': return 'bg-purple-100 text-purple-600';
      case 'order': return 'bg-blue-100 text-blue-600';
      case 'price': return 'bg-green-100 text-green-600';
      case 'message': return 'bg-orange-100 text-orange-600';
      default: return 'bg-teal-100 text-teal-600';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative p-2 rounded-lg hover:bg-gray-50 group transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-5 h-5 text-teal-600 group-hover:animate-pulse" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
              {unreadCount}
            </span>
            <span className="absolute inset-0 rounded-full bg-orange-400 opacity-20 group-hover:animate-ping"></span>
          </>
        ) : (
          <Bell className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-dropdown"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors lg:hidden"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-teal-50/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBackground(notification.type, notification.read)}`}>
                        {notification.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full mt-2"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                        <p className="text-xs text-teal-600 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  onClose();
                  navigate('/notifications');
                }}
                className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium py-2 hover:bg-teal-50 rounded-lg transition-colors"
              >
                View All Notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;