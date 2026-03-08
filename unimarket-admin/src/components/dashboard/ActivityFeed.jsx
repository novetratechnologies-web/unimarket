// admin/src/components/dashboard/ActivityFeed.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  ShoppingCart,
  Package,
  CreditCard,
  Bell,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  DollarSign,
  Truck,
  XCircle,
  CheckCircle,
  Clock,
  Users,
  Settings,
  LogIn,
  LogOut,
  Shield,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Ban,
  Award,
  Zap,
  FileText,
  Key,
  Mail,
  Globe,
  Smartphone,
  Monitor,
  Camera,
  Gift,
  Star,
  MessageCircle,
  Heart,
  Home,
  Search,
  Filter,
  Calendar,
  MapPin,
  Copy,
  Link,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

// ============================================
// MOCK ACTIVITIES FOR DEVELOPMENT
// ============================================
const getMockActivities = () => {
  const now = new Date();
  return [
    {
      id: '1',
      action: 'order_created',
      type: 'order',
      resourceId: 'ORD-001',
      resourceType: 'order',
      resourceIdentifier: 'ORD-001',
      description: 'New order #ORD-001 created for $299.99',
      user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      userEmail: 'john@example.com',
      userRole: 'customer',
      createdAt: new Date(now - 5 * 60000).toISOString(),
      severity: 'info',
      status: 'success',
      metadata: { amount: 299.99 },
      isNew: true
    },
    {
      id: '2',
      action: 'user_registered',
      type: 'user',
      resourceId: 'USR-001',
      resourceType: 'user',
      resourceIdentifier: 'USR-001',
      description: 'New user registered: jane@example.com',
      user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      userEmail: 'jane@example.com',
      userRole: 'customer',
      createdAt: new Date(now - 15 * 60000).toISOString(),
      severity: 'success',
      status: 'success',
      isNew: true
    },
    {
      id: '3',
      action: 'product_updated',
      type: 'product',
      resourceId: 'PRD-001',
      resourceType: 'product',
      resourceIdentifier: 'PRD-001',
      resourceName: 'Gaming Laptop',
      description: 'Product "Gaming Laptop" stock updated from 5 to 3',
      user: { firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
      userEmail: 'mike@example.com',
      userRole: 'vendor',
      createdAt: new Date(now - 45 * 60000).toISOString(),
      severity: 'warning',
      status: 'warning',
      changes: [
        { field: 'quantity', oldValue: 5, newValue: 3 }
      ],
      isNew: true
    },
    {
      id: '4',
      action: 'payment_received',
      type: 'payment',
      resourceId: 'PAY-001',
      resourceType: 'payment',
      resourceIdentifier: 'PAY-001',
      description: 'Payment of $1,299.99 received for order #ORD-002',
      user: { firstName: 'Sarah', lastName: 'Williams', email: 'sarah@example.com' },
      userEmail: 'sarah@example.com',
      userRole: 'customer',
      createdAt: new Date(now - 2 * 60 * 60000).toISOString(),
      severity: 'success',
      status: 'success'
    },
    {
      id: '5',
      action: 'vendor_approved',
      type: 'vendor',
      resourceId: 'VEN-001',
      resourceType: 'vendor',
      resourceIdentifier: 'VEN-001',
      resourceName: 'Tech Supplies Co',
      description: 'Vendor "Tech Supplies Co" approved',
      user: { firstName: 'Admin', lastName: 'User', email: 'admin@example.com' },
      userEmail: 'admin@example.com',
      userRole: 'admin',
      createdAt: new Date(now - 3 * 60 * 60000).toISOString(),
      severity: 'success',
      status: 'success'
    },
    {
      id: '6',
      action: 'order_shipped',
      type: 'order',
      resourceId: 'ORD-002',
      resourceType: 'order',
      resourceIdentifier: 'ORD-002',
      description: 'Order #ORD-002 has been shipped',
      user: { firstName: 'David', lastName: 'Brown', email: 'david@example.com' },
      userEmail: 'david@example.com',
      userRole: 'vendor',
      createdAt: new Date(now - 5 * 60 * 60000).toISOString(),
      severity: 'info',
      status: 'success'
    },
    {
      id: '7',
      action: 'discount_created',
      type: 'discount',
      resourceId: 'DSC-001',
      resourceType: 'discount',
      resourceIdentifier: 'DSC-001',
      description: 'Summer Sale discount created (20% off)',
      user: { firstName: 'Emily', lastName: 'Davis', email: 'emily@example.com' },
      userEmail: 'emily@example.com',
      userRole: 'admin',
      createdAt: new Date(now - 7 * 60 * 60000).toISOString(),
      severity: 'info',
      status: 'success'
    },
    {
      id: '8',
      action: 'user_suspended',
      type: 'user',
      resourceId: 'USR-002',
      resourceType: 'user',
      resourceIdentifier: 'USR-002',
      description: 'User account suspended due to policy violation',
      user: { firstName: 'Admin', lastName: 'User', email: 'admin@example.com' },
      userEmail: 'admin@example.com',
      userRole: 'admin',
      createdAt: new Date(now - 12 * 60 * 60000).toISOString(),
      severity: 'critical',
      status: 'failure'
    }
  ];
};

// ============================================
// COMPREHENSIVE ACTIVITY TYPE CONFIGURATION
// ============================================
const ACTIVITY_CONFIG = {
  // ===== AUTHENTICATION ACTIVITIES =====
  login: {
    icon: LogIn,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'User Login',
    category: 'auth',
    priority: 3,
    description: 'User logged in successfully'
  },
  logout: {
    icon: LogOut,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'User Logout',
    category: 'auth',
    priority: 4,
    description: 'User logged out'
  },
  login_failed: {
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Failed Login',
    category: 'security',
    priority: 1,
    description: 'Failed login attempt'
  },
  register: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'New Registration',
    category: 'user',
    priority: 2,
    description: 'New user registered'
  },
  user_registered: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'New Registration',
    category: 'user',
    priority: 2,
    description: 'New user registered'
  },
  verify_email: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Email Verified',
    category: 'user',
    priority: 3,
    description: 'Email address verified'
  },
  forgot_password: {
    icon: Key,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Password Reset Request',
    category: 'auth',
    priority: 2,
    description: 'Password reset requested'
  },
  reset_password: {
    icon: Key,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Password Reset',
    category: 'auth',
    priority: 2,
    description: 'Password was reset'
  },
  refresh_token: {
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Token Refreshed',
    category: 'auth',
    priority: 4,
    description: 'Session token refreshed'
  },

  // ===== CRUD ACTIVITIES =====
  create: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Created',
    category: 'crud',
    priority: 2,
    description: 'Resource created'
  },
  read: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Viewed',
    category: 'crud',
    priority: 4,
    description: 'Resource viewed'
  },
  view: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Viewed',
    category: 'crud',
    priority: 4,
    description: 'Resource viewed'
  },
  update: {
    icon: Edit,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Updated',
    category: 'crud',
    priority: 2,
    description: 'Resource updated'
  },
  delete: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Deleted',
    category: 'crud',
    priority: 1,
    description: 'Resource deleted'
  },
  bulk_create: {
    icon: UserPlus,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Bulk Create',
    category: 'crud',
    priority: 1,
    description: 'Multiple resources created'
  },
  bulk_update: {
    icon: Edit,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Bulk Update',
    category: 'crud',
    priority: 1,
    description: 'Multiple resources updated'
  },
  bulk_delete: {
    icon: Trash2,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    label: 'Bulk Delete',
    category: 'crud',
    priority: 1,
    description: 'Multiple resources deleted'
  },

  // ===== ORDER ACTIVITIES =====
  order_created: {
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'New Order',
    category: 'order',
    priority: 1,
    description: 'New order placed'
  },
  order_updated: {
    icon: Package,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Order Updated',
    category: 'order',
    priority: 2,
    description: 'Order details updated'
  },
  order_viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Order Viewed',
    category: 'order',
    priority: 4,
    description: 'Order was viewed'
  },
  order_shipped: {
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Order Shipped',
    category: 'order',
    priority: 1,
    description: 'Order has been shipped'
  },
  order_delivered: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Order Delivered',
    category: 'order',
    priority: 2,
    description: 'Order delivered successfully'
  },
  order_cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Order Cancelled',
    category: 'order',
    priority: 2,
    description: 'Order was cancelled'
  },
  order_refunded: {
    icon: DollarSign,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Order Refunded',
    category: 'order',
    priority: 2,
    description: 'Order refund processed'
  },
  order_fulfilled: {
    icon: CheckCircle,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    label: 'Order Fulfilled',
    category: 'order',
    priority: 2,
    description: 'Order fulfilled completely'
  },
  order_cancel: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Order Cancelled',
    category: 'order',
    priority: 2,
    description: 'Order was cancelled'
  },

  // ===== PRODUCT ACTIVITIES =====
  product_created: {
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Product Added',
    category: 'product',
    priority: 2,
    description: 'New product created'
  },
  product_updated: {
    icon: Edit,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Product Updated',
    category: 'product',
    priority: 2,
    description: 'Product details updated'
  },
  product_viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Product Viewed',
    category: 'product',
    priority: 4,
    description: 'Product was viewed'
  },
  product_deleted: {
    icon: Trash2,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    label: 'Product Deleted',
    category: 'product',
    priority: 2,
    description: 'Product was deleted'
  },
  product_publish: {
    icon: Eye,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Product Published',
    category: 'product',
    priority: 2,
    description: 'Product published'
  },
  product_unpublish: {
    icon: Eye,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Product Unpublished',
    category: 'product',
    priority: 2,
    description: 'Product unpublished'
  },
  inventory_update: {
    icon: Package,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    label: 'Inventory Updated',
    category: 'product',
    priority: 2,
    description: 'Stock inventory updated'
  },
  price_update: {
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Price Updated',
    category: 'product',
    priority: 2,
    description: 'Product price changed'
  },
  low_stock: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Low Stock Alert',
    category: 'product',
    priority: 1,
    description: 'Product stock is low'
  },

  // ===== USER ACTIVITIES =====
  user_created: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'User Created',
    category: 'user',
    priority: 2,
    description: 'New user account created'
  },
  user_updated: {
    icon: Edit,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    label: 'User Updated',
    category: 'user',
    priority: 3,
    description: 'User profile updated'
  },
  user_viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'User Viewed',
    category: 'user',
    priority: 4,
    description: 'User profile viewed'
  },
  user_deleted: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'User Deleted',
    category: 'user',
    priority: 1,
    description: 'User account deleted'
  },
  user_suspended: {
    icon: Ban,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'User Suspended',
    category: 'user',
    priority: 1,
    description: 'User account suspended'
  },
  user_activated: {
    icon: Award,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'User Activated',
    category: 'user',
    priority: 2,
    description: 'User account activated'
  },

  // ===== ADMIN/VENDOR ACTIVITIES =====
  vendor_approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Vendor Approved',
    category: 'vendor',
    priority: 1,
    description: 'Vendor application approved'
  },
  vendor_rejected: {
    icon: XCircle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    label: 'Vendor Rejected',
    category: 'vendor',
    priority: 2,
    description: 'Vendor application rejected'
  },
  vendor_suspended: {
    icon: Ban,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Vendor Suspended',
    category: 'vendor',
    priority: 1,
    description: 'Vendor account suspended'
  },
  vendor_activated: {
    icon: Award,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Vendor Activated',
    category: 'vendor',
    priority: 2,
    description: 'Vendor account activated'
  },
  vendor_created: {
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Vendor Created',
    category: 'vendor',
    priority: 2,
    description: 'New vendor account created'
  },
  vendor_updated: {
    icon: Edit,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Vendor Updated',
    category: 'vendor',
    priority: 3,
    description: 'Vendor details updated'
  },
  vendor_viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Vendor Viewed',
    category: 'vendor',
    priority: 4,
    description: 'Vendor profile viewed'
  },
  role_changed: {
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Role Changed',
    category: 'admin',
    priority: 1,
    description: 'User role was changed'
  },
  permission_changed: {
    icon: Shield,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Permissions Updated',
    category: 'admin',
    priority: 1,
    description: 'User permissions updated'
  },

  // ===== PAYMENT ACTIVITIES =====
  payment_received: {
    icon: CreditCard,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Payment Received',
    category: 'payment',
    priority: 1,
    description: 'Payment successfully received'
  },
  payment_failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Payment Failed',
    category: 'payment',
    priority: 1,
    description: 'Payment processing failed'
  },
  payment_viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Payment Viewed',
    category: 'payment',
    priority: 4,
    description: 'Payment details viewed'
  },
  payout_processed: {
    icon: DollarSign,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    label: 'Payout Processed',
    category: 'payment',
    priority: 2,
    description: 'Vendor payout processed'
  },
  refund_processed: {
    icon: DollarSign,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Refund Processed',
    category: 'payment',
    priority: 2,
    description: 'Refund processed successfully'
  },
  transaction_created: {
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Transaction Created',
    category: 'payment',
    priority: 2,
    description: 'New transaction initiated'
  },

  // ===== EXPORT/IMPORT ACTIVITIES =====
  export: {
    icon: Download,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Data Export',
    category: 'data',
    priority: 3,
    description: 'Data exported from system'
  },
  import: {
    icon: Upload,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Data Import',
    category: 'data',
    priority: 2,
    description: 'Data imported to system'
  },

  // ===== SYSTEM ACTIVITIES =====
  system_alert: {
    icon: Bell,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'System Alert',
    category: 'system',
    priority: 1,
    description: 'System alert triggered'
  },
  settings_updated: {
    icon: Settings,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    label: 'Settings Updated',
    category: 'system',
    priority: 3,
    description: 'System settings changed'
  },
  backup_created: {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Backup Created',
    category: 'system',
    priority: 2,
    description: 'System backup created'
  },
  maintenance_mode: {
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Maintenance Mode',
    category: 'system',
    priority: 1,
    description: 'Maintenance mode toggled'
  },
  config_change: {
    icon: Settings,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Configuration Changed',
    category: 'system',
    priority: 2,
    description: 'System configuration updated'
  },

  // ===== SECURITY ACTIVITIES =====
  password_change: {
    icon: Key,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Password Changed',
    category: 'security',
    priority: 2,
    description: 'User password was changed'
  },
  two_factor_enabled: {
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: '2FA Enabled',
    category: 'security',
    priority: 2,
    description: '2FA enabled on account'
  },
  two_factor_disabled: {
    icon: Shield,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: '2FA Disabled',
    category: 'security',
    priority: 2,
    description: '2FA disabled on account'
  },
  api_key_generated: {
    icon: Key,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'API Key Generated',
    category: 'security',
    priority: 1,
    description: 'New API key created'
  },
  api_key_revoked: {
    icon: Key,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'API Key Revoked',
    category: 'security',
    priority: 1,
    description: 'API key was revoked'
  },

  // ===== CATEGORY ACTIVITIES =====
  category_created: {
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Category Created',
    category: 'category',
    priority: 2,
    description: 'New category created'
  },
  category_updated: {
    icon: Edit,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Category Updated',
    category: 'category',
    priority: 2,
    description: 'Category details updated'
  },
  category_viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Category Viewed',
    category: 'category',
    priority: 4,
    description: 'Category was viewed'
  },
  category_deleted: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Category Deleted',
    category: 'category',
    priority: 2,
    description: 'Category was deleted'
  },

  // ===== DISCOUNT ACTIVITIES =====
  discount_created: {
    icon: Gift,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Discount Created',
    category: 'discount',
    priority: 2,
    description: 'New discount created'
  },
  discount_updated: {
    icon: Edit,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Discount Updated',
    category: 'discount',
    priority: 2,
    description: 'Discount details updated'
  },
  discount_viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Discount Viewed',
    category: 'discount',
    priority: 4,
    description: 'Discount was viewed'
  },
  discount_deleted: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Discount Deleted',
    category: 'discount',
    priority: 2,
    description: 'Discount was deleted'
  },
  discount_applied: {
    icon: Gift,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Discount Applied',
    category: 'discount',
    priority: 2,
    description: 'Discount was applied'
  },

  // ===== PAGE/VIEW ACTIVITIES =====
  page_view: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Page View',
    category: 'view',
    priority: 5,
    description: 'Page was viewed'
  },
  dashboard_view: {
    icon: Home,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Dashboard View',
    category: 'view',
    priority: 5,
    description: 'Dashboard was viewed'
  },
  report_view: {
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Report View',
    category: 'view',
    priority: 4,
    description: 'Report was viewed'
  },
  profile_view: {
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Profile View',
    category: 'view',
    priority: 4,
    description: 'Profile was viewed'
  },

  // ===== API ACTIVITIES =====
  api_call: {
    icon: Link,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'API Call',
    category: 'api',
    priority: 4,
    description: 'API endpoint called'
  },
  api_success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'API Success',
    category: 'api',
    priority: 4,
    description: 'API call succeeded'
  },
  api_error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'API Error',
    category: 'api',
    priority: 2,
    description: 'API call failed'
  },

  // ===== GENERIC FALLBACKS =====
  accessed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Accessed',
    category: 'generic',
    priority: 4,
    description: 'Resource was accessed'
  },
  viewed: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Viewed',
    category: 'generic',
    priority: 4,
    description: 'Resource was viewed'
  },
  fetched: {
    icon: Download,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Fetched',
    category: 'generic',
    priority: 4,
    description: 'Data was fetched'
  },
  loaded: {
    icon: Package,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Loaded',
    category: 'generic',
    priority: 4,
    description: 'Resource was loaded'
  },
  initiated: {
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Initiated',
    category: 'generic',
    priority: 3,
    description: 'Process initiated'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Completed',
    category: 'generic',
    priority: 3,
    description: 'Process completed'
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Failed',
    category: 'generic',
    priority: 2,
    description: 'Process failed'
  },

  // ===== DEFAULT FALLBACK =====
  default: {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'Activity',
    category: 'other',
    priority: 5,
    description: 'System activity'
  }
};

// ============================================
// ACTIVITY ITEM COMPONENT
// ============================================
const ActivityItem = ({ activity, onClick }) => {
  // Get config based on action, with fallback to default
  const config = ACTIVITY_CONFIG[activity.action] || 
                 ACTIVITY_CONFIG[activity.type] || 
                 ACTIVITY_CONFIG.default;

  const Icon = config.icon;

  // Get user display name
  const getUserDisplay = () => {
    if (activity.user) {
      if (typeof activity.user === 'object') {
        return `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || 
               activity.user.email || 
               'User';
      }
      return activity.user;
    }
    if (activity.userEmail) return activity.userEmail;
    if (activity.anonymousId) return 'Guest';
    if (activity.userRole === 'system') return 'System';
    return 'System';
  };

  // Get resource link
  const getResourceLink = () => {
    if (activity.resourceId && activity.resourceType) {
      // Handle both singular and plural resource types
      const resourceType = activity.resourceType.replace(/s$/, ''); // Remove trailing 's'
      
      const resourceLinks = {
        order: `/orders/${activity.resourceId}`,
        product: `/products/${activity.resourceId}`,
        user: `/users/${activity.resourceId}`,
        vendor: `/vendors/${activity.resourceId}`,
        admin: `/admins/${activity.resourceId}`,
        category: `/categories/${activity.resourceId}`,
        discount: `/discounts/${activity.resourceId}`,
        payout: `/payouts/${activity.resourceId}`,
        payment: `/payments/${activity.resourceId}`,
        transaction: `/transactions/${activity.resourceId}`,
        refund: `/refunds/${activity.resourceId}`,
        review: `/reviews/${activity.resourceId}`
      };
      return resourceLinks[resourceType] || null;
    }
    return activity.link || null;
  };

  // Format timestamp
  const formattedTime = () => {
    try {
      const date = new Date(activity.createdAt || activity.timestamp);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: format(date, 'MMM d, yyyy • h:mm a'),
        timeAgo: activity.timeAgo || formatDistanceToNow(date, { addSuffix: true })
      };
    } catch {
      return {
        relative: activity.time || 'Unknown time',
        absolute: activity.time || 'Unknown time',
        timeAgo: activity.time || 'Unknown time'
      };
    }
  };

  const time = formattedTime();
  const resourceLink = getResourceLink();
  const userDisplay = getUserDisplay();

  // Get status color
  const getStatusColor = () => {
    switch (activity.status) {
      case 'failure': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // Get severity icon/indicator
  const getSeverityIndicator = () => {
    switch (activity.severity) {
      case 'critical':
        return <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded-full animate-pulse">CRITICAL</span>;
      case 'error':
        return <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">ERROR</span>;
      case 'warning':
        return <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">WARNING</span>;
      case 'debug':
        return <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">DEBUG</span>;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onClick?.(activity, resourceLink)}
      className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-all cursor-pointer group relative"
    >
      {/* Status indicator for failures/warnings */}
      {activity.status === 'failure' && (
        <div className="absolute top-2 right-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`p-2.5 rounded-lg ${config.bgColor} flex-shrink-0 transition-transform group-hover:scale-110`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">
              {userDisplay}
            </p>
            {activity.userRole && activity.userRole !== 'guest' && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                {activity.userRole}
              </span>
            )}
          </div>
          {getSeverityIndicator()}
        </div>
        
        <p className="text-sm text-gray-600 mt-0.5">
          <span className="font-medium">{config.label}</span>
          {activity.resourceType && (
            <>
              <span className="text-xs text-gray-400 mx-1">•</span>
              <span className="text-xs text-gray-500 capitalize">
                {activity.resourceType.replace(/_/g, ' ')}
              </span>
            </>
          )}
          {activity.resourceIdentifier && (
            <span className="text-xs text-gray-400 ml-1">#{activity.resourceIdentifier}</span>
          )}
          {activity.resourceName && (
            <span className="text-xs text-gray-400 ml-1">- {activity.resourceName}</span>
          )}
        </p>
        
        {activity.description && (
          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
            {activity.description}
          </p>
        )}
        
        {activity.changes && activity.changes.length > 0 && (
          <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100">
            <span className="font-medium text-gray-700 block mb-1">Changes:</span>
            <div className="space-y-1">
              {activity.changes.slice(0, 2).map((change, idx) => (
                <div key={idx} className="text-gray-600">
                  <span className="font-medium">{change.field}:</span>{' '}
                  <span className="text-gray-500 line-clamp-1">
                    {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                  </span>
                </div>
              ))}
              {activity.changes.length > 2 && (
                <span className="text-gray-400 text-xs">
                  +{activity.changes.length - 2} more changes
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center flex-wrap gap-2 mt-2">
          <p className="text-xs text-gray-400 flex items-center gap-1" title={time.absolute}>
            <Clock className="h-3 w-3" />
            {time.relative}
          </p>
          
          {activity.status && activity.status !== 'success' && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor()}`}>
              {activity.status}
            </span>
          )}
          
          {activity.ipAddress && (
            <span className="text-xs text-gray-400 flex items-center gap-1" title="IP Address">
              <Globe className="h-3 w-3" />
              {activity.ipAddress}
            </span>
          )}
          
          {activity.location?.country && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {activity.location.country}
            </span>
          )}
          
          {activity.method && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {activity.method}
            </span>
          )}
          
          {activity.responseTime && (
            <span className="text-xs text-gray-400">
              {activity.responseTime}ms
            </span>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ActivityFeed = ({
  limit = 10,
  showViewAll = true,
  autoRefresh = true,
  refreshInterval = 30000,
  onActivityClick,
  filterTypes = [],
  filterCategories = [],
  filterSeverity = [],
  showFilters = false,
  className = ''
}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  // ============================================
  // FETCH ACTIVITIES FROM DASHBOARD API
  // ============================================
  const fetchActivities = useCallback(async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      }

      setError(null);

      // Build query params
      const params = new URLSearchParams({
        limit: limit * 2,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add filters if provided
      if (filterTypes.length > 0) {
        params.append('action', filterTypes.join(','));
      }
      
      if (filterCategories.length > 0) {
        params.append('categories', filterCategories.join(','));
      }
      
      if (filterSeverity.length > 0) {
        params.append('severity', filterSeverity.join(','));
      }

      console.log('🔍 Fetching activities from dashboard API with params:', params.toString());

      // Fetch from dashboard activities API
      const response = await api.dashboard.getActivities(params);
      
      console.log('✅ Activities response:', response);

      if (response?.success && response?.data) {
        const activitiesData = Array.isArray(response.data) ? response.data : (response.data.activities || []);
        
        const transformedActivities = activitiesData.map(activity => ({
          id: activity._id || activity.id,
          ...activity,
          timestamp: activity.createdAt,
          type: activity.action || activity.type,
          user: activity.user,
          userEmail: activity.userEmail,
          userRole: activity.userRole,
          action: activity.action,
          description: activity.description || `${activity.action || ''} ${activity.resourceType || ''}`.trim(),
          details: activity.description,
          isNew: new Date(activity.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000),
          timeAgo: activity.timeAgo,
          link: getActivityLink(activity)
        }));

        console.log('📊 Transformed activities:', transformedActivities.length);
        
        setActivities(transformedActivities.slice(0, limit));
        setUnreadCount(transformedActivities.filter(a => a.isNew).length);
        
        // Try to get stats from another endpoint
        try {
          const statsResponse = await api.dashboard.getActivityStats();
          setStats(statsResponse?.data || null);
        } catch (statsErr) {
          console.log('Stats endpoint not available');
        }
      } else if (Array.isArray(response)) {
        // Handle case where response is directly the array
        const transformedActivities = response.map(activity => ({
          id: activity._id,
          ...activity,
          timestamp: activity.createdAt,
          type: activity.action,
          user: activity.user,
          userEmail: activity.userEmail,
          userRole: activity.userRole,
          action: activity.action,
          description: activity.description,
          isNew: new Date(activity.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000),
          link: getActivityLink(activity)
        }));
        
        setActivities(transformedActivities.slice(0, limit));
        setUnreadCount(transformedActivities.filter(a => a.isNew).length);
      }

      setLastUpdated(new Date());

    } catch (err) {
      console.error('❌ Failed to fetch activities:', err);
      setError(err.message || 'Failed to load activities');
      
      // Only show mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Using mock data in development');
        const mockActivities = getMockActivities();
        setActivities(mockActivities.slice(0, limit));
        setUnreadCount(mockActivities.filter(a => a.isNew).length);
        showToast('Using mock data (development mode)', 'info');
      } else {
        showToast('Failed to load activities', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit, filterTypes, filterCategories, filterSeverity, showToast]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchActivities(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchActivities]);

  // Helper to generate activity link
  const getActivityLink = (activity) => {
    if (activity.resourceId && activity.resourceType) {
      // Handle both singular and plural resource types
      const resourceType = activity.resourceType.replace(/s$/, '');
      
      const resourceLinks = {
        order: `/orders/${activity.resourceId}`,
        product: `/products/${activity.resourceId}`,
        user: `/users/${activity.resourceId}`,
        vendor: `/vendors/${activity.resourceId}`,
        admin: `/admins/${activity.resourceId}`,
        category: `/categories/${activity.resourceId}`,
        discount: `/discounts/${activity.resourceId}`,
        payout: `/payouts/${activity.resourceId}`,
        payment: `/payments/${activity.resourceId}`,
        transaction: `/transactions/${activity.resourceId}`,
        refund: `/refunds/${activity.resourceId}`,
        review: `/reviews/${activity.resourceId}`
      };
      return resourceLinks[resourceType] || null;
    }
    return null;
  };

  // Handlers
  const handleRefresh = () => {
    fetchActivities(true);
  };

  const handleViewAll = () => {
    navigate('/admin/activities');
  };

  const handleActivityClick = (activity, resourceLink) => {
    if (onActivityClick) {
      onActivityClick(activity, resourceLink);
    } else if (resourceLink) {
      navigate(resourceLink);
    } else {
      // Navigate to activity details
      navigate(`/admin/activities/${activity.id}`);
    }
  };

  // Get category summary for display
  const getCategorySummary = () => {
    if (!activities.length) return null;
    
    const counts = activities.reduce((acc, act) => {
      const config = ACTIVITY_CONFIG[act.action] || ACTIVITY_CONFIG[act.type] || ACTIVITY_CONFIG.default;
      const category = config?.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
                <div className="h-2 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !activities.length) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Activities</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!activities.length) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Activity</h3>
          <p className="text-sm text-gray-600">Your activity feed will appear here</p>
          <button
            onClick={handleRefresh}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full animate-pulse">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        {stats?.overall && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.overall.total || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.overall.success || 0}</p>
              <p className="text-xs text-gray-500">Success</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overall.failures || 0}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </div>
        )}

        {/* Category summary */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {getCategorySummary()?.map(({ category, count }) => (
              <span
                key={category}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full capitalize"
              >
                {category}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onClick={handleActivityClick}
          />
        ))}
      </div>

      {/* View All Footer */}
      {showViewAll && activities.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center space-x-2 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-white hover:bg-primary-50 rounded-lg transition-colors"
          >
            <span>View All Activity</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;