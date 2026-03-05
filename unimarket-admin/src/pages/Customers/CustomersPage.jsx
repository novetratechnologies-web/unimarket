// admin/src/pages/Customers/CustomersPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserPlus,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Grid,
  List,
  Activity,
  MoreVertical,
  Shield,
  Award,
  Star,
  MessageSquare,
  Upload,
  Settings,
  Copy,
  Send,
  Ban,
  Check,
  X,
  Loader,
  Smartphone,
  AtSign,
  Hash,
  Cake,
  User,
  Globe,
  Briefcase,
  Heart,
  Bell,
  CreditCard,
  Home,
  Building,
  BookOpen,
  GraduationCap,
  Tag,
  FileText,
  Link,
  ChevronDown,
  Check as CheckIcon,
  EyeOff,
  RefreshCwOff,
  Archive,
  ArchiveRestore,
  ArchiveX,
  RotateCcw,
  RotateCw,
  Ban as BanIcon,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserCog,
  UserRoundCog,
  UserRoundCheck,
  UserRoundX,
  UserRoundMinus,
  UserRoundPlus,
  UsersRound,
  Trash,
  Trash2 as TrashIcon,
  Undo2,
  Redo2,
  History,
  Clock3,
  Clock4,
  Clock5,
  Clock6,
  Clock7,
  Clock8,
  Clock9,
  Clock10,
  Clock11,
  Clock12,
  Timer,
  TimerOff,
  AlarmClock,
  AlarmClockOff,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CalendarHeart,
  CalendarMinus,
  CalendarPlus,
  CalendarSearch,
  CalendarSync,
  CalendarFold,
  CalendarArrowUp,
  CalendarArrowDown
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';
import CustomerDetailModal from './CustomerDetailModal';
import CustomerFormModal from './CustomerFormModal';
import BulkActionModalEnhanced from '../../components/common/BulkActionModalEnhanced';
import ExportModal from '../../components/common/ExportModal';
import FilterPanel from './FilterPanel';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import AccountActionModal from '../../components/common/AccountActionModal';
import RestoreConfirmationModal from '../../components/common/RestoreConfirmationModal';
import SuspensionModal from '../../components/common/SuspensionModal';
import ActivityLogModal from '../../components/common/ActivityLogModal';
import TrashViewModal from '../../components/common/TrashViewModal';

// ============================================
// STATUS CONFIGURATION
// ============================================
const CUSTOMER_STATUS = {
  active: {
    label: 'Active',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    badgeColor: 'bg-green-500',
    gradient: 'from-green-500 to-green-600'
  },
  inactive: {
    label: 'Inactive',
    icon: UserX,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    badgeColor: 'bg-gray-500',
    gradient: 'from-gray-500 to-gray-600'
  },
  suspended: {
    label: 'Suspended',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    badgeColor: 'bg-red-500',
    gradient: 'from-red-500 to-red-600'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    badgeColor: 'bg-yellow-500',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  deleted: {
    label: 'Deleted',
    icon: Trash2,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    badgeColor: 'bg-gray-500',
    gradient: 'from-gray-500 to-gray-600'
  }
};

const VERIFICATION_STATUS = {
  verified: { 
    label: 'Verified', 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    gradient: 'from-green-500 to-green-600'
  },
  unverified: { 
    label: 'Unverified', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    icon: XCircle,
    gradient: 'from-gray-500 to-gray-600'
  }
};

const AUTH_METHODS = {
  email: { label: 'Email', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Mail },
  google: { label: 'Google', color: 'text-red-600', bgColor: 'bg-red-100', icon: Globe }
};

const GENDER_OPTIONS = {
  male: { label: 'Male', icon: User, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  female: { label: 'Female', icon: User, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  other: { label: 'Other', icon: User, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'prefer not to say': { label: 'Prefer not to say', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-100' }
};

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatsCard = ({ title, value, icon: Icon, color, subtitle, trend, trendValue, onClick }) => (
  <div 
    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all group hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            {trend !== undefined && (
              <span className={`flex items-center mr-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className={`h-3 w-3 mr-0.5 ${trend < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

// ============================================
// CUSTOMER TABLE COMPONENT - FIXED
// ============================================
const CustomersTable = ({
  customers,
  selectedCustomers,
  onSelectCustomer,
  onSelectAll,
  onSort,
  sortField,
  sortOrder,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onActivateCustomer,
  onDeactivateCustomer,
  onSuspendCustomer,
  onRestoreCustomer,
  onViewActivity,
  loading,
  onClearFilters,
  showDeleted = false
}) => {
  const headers = [
    { key: 'select', label: '', width: '40px' },
    { key: 'customer', label: 'Customer', sortable: true, width: '280px' },
    { key: 'contact', label: 'Contact', sortable: true, width: '240px' },
    { key: 'personal', label: 'Personal', sortable: true, width: '180px' },
    { key: 'university', label: 'University', sortable: true, width: '180px' },
    { key: 'status', label: 'Status', sortable: true, width: '100px' },
    { key: 'verification', label: 'Verification', sortable: true, width: '100px' },
    { key: 'auth', label: 'Auth', sortable: true, width: '80px', align: 'center' },
    { key: 'joined', label: 'Joined', sortable: true, width: '120px' },
    { key: 'lastActive', label: 'Last Active', sortable: true, width: '120px' },
    { key: 'actions', label: 'Actions', width: '160px', align: 'center' }
  ];

  const getSortIcon = (key) => {
    if (sortField !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const getAvatarColor = (email) => {
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-orange-500 to-orange-600',
      'from-cyan-500 to-cyan-600'
    ];
    const index = email ? email.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const getCustomerStatus = (user) => {
    if (user.isDeleted) return 'deleted';
    if (!user.isActive) return 'inactive';
    if (user.loginLockoutUntil && new Date(user.loginLockoutUntil) > new Date()) return 'suspended';
    if (!user.isVerified) return 'pending';
    return 'active';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  const formatRelativeTime = (date) => {
    if (!date) return '—';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-100">
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
            <div className="w-48 h-10 bg-gray-200 rounded"></div>
            <div className="w-40 h-4 bg-gray-200 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-24 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-y border-gray-200">
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  header.align === 'center' ? 'text-center' : header.align === 'right' ? 'text-right' : 'text-left'
                }`}
                style={{ width: header.width }}
              >
                {header.key === 'select' ? (
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                ) : (
                  <button
                    onClick={() => header.sortable && onSort(header.key)}
                    className={`flex items-center space-x-1 hover:text-gray-900 transition-colors ${
                      header.align === 'right' ? 'justify-end ml-auto' : ''
                    }`}
                  >
                    <span>{header.label}</span>
                    {header.sortable && (
                      <span className="text-gray-400 text-xs ml-1">{getSortIcon(header.key)}</span>
                    )}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((customer) => {
            const status = getCustomerStatus(customer);
            const statusConfig = CUSTOMER_STATUS[status] || CUSTOMER_STATUS.active;
            const verificationConfig = VERIFICATION_STATUS[customer.isVerified ? 'verified' : 'unverified'];
            const authConfig = AUTH_METHODS[customer.authMethod] || AUTH_METHODS.email;
            const genderConfig = GENDER_OPTIONS[customer.gender] || GENDER_OPTIONS['prefer not to say'];
            const StatusIcon = statusConfig.icon;
            const VerificationIcon = verificationConfig.icon;
            const AuthIcon = authConfig.icon;
            const GenderIcon = genderConfig.icon;
            const avatarColor = getAvatarColor(customer.email);

            return (
              <tr
                key={customer._id}
                className={`hover:bg-gray-50 transition-colors cursor-pointer group ${
                  customer.isDeleted ? 'opacity-60 bg-gray-50' : ''
                }`}
                onClick={() => onViewCustomer(customer)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer._id)}
                    onChange={() => onSelectCustomer(customer._id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={customer.isDeleted}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold text-sm mr-3 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                      {getInitials(customer.firstName, customer.lastName, customer.email)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {customer.firstName || ''} {customer.lastName || ''}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Hash className="h-3 w-3 mr-1" />
                        ID: {customer._id.slice(-8)}
                      </div>
                      {customer.username && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <AtSign className="h-3 w-3 mr-1" />
                          @{customer.username}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span className="truncate max-w-[150px]" title={customer.email}>
                        {customer.email}
                      </span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.alternativePhone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Smartphone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                        {customer.alternativePhone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Cake className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—'}
                      {customer.dateOfBirth && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({customer.age || '?'} yrs)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <GenderIcon className={`h-3.5 w-3.5 mr-2 ${genderConfig.color}`} />
                      <span className={genderConfig.color}>{genderConfig.label}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900 max-w-[150px] truncate font-medium" title={customer.university}>
                    {customer.university || '—'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} shadow-sm`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${verificationConfig.bgColor} ${verificationConfig.color} shadow-sm`}>
                    <VerificationIcon className="h-3 w-3 mr-1" />
                    {customer.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${authConfig.bgColor} ${authConfig.color} shadow-sm`}>
                    <AuthIcon className="h-3 w-3 mr-1" />
                    {authConfig.label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatDate(customer.createdAt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatRelativeTime(customer.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {customer.lastActive ? (
                    <>
                      <div className="text-sm text-gray-900">
                        {formatDate(customer.lastActive)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(customer.lastActive)}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Never</span>
                  )}
                </td>
                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  {customer.isDeleted ? (
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreCustomer(customer);
                        }}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors group/btn relative"
                        title="Restore Customer"
                      >
                        <RotateCcw className="h-4 w-4 text-green-600 group-hover/btn:scale-110 transition-transform" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Restore
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomer(customer);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group/btn relative"
                        title="Permanently Delete"
                      >
                        <TrashIcon className="h-4 w-4 text-red-600 group-hover/btn:scale-110 transition-transform" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Delete Permanently
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCustomer(customer);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn relative"
                        title="View Customer"
                      >
                        <Eye className="h-4 w-4 text-gray-600 group-hover/btn:text-primary-600" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          View Details
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCustomer(customer);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn relative"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4 text-gray-600 group-hover/btn:text-primary-600" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Edit Customer
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('📊 Activity button clicked for:', customer.email);
                          onViewActivity(customer);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn relative"
                        title="View Activity"
                      >
                        <Activity className="h-4 w-4 text-gray-600 group-hover/btn:text-primary-600" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Activity Log
                        </span>
                      </button>
                      {customer.isActive ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeactivateCustomer(customer);
                          }}
                          className="p-2 hover:bg-yellow-50 rounded-lg transition-colors group/btn relative"
                          title="Deactivate Customer"
                        >
                          <UserX className="h-4 w-4 text-yellow-600 group-hover/btn:scale-110 transition-transform" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Deactivate
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onActivateCustomer(customer);
                          }}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors group/btn relative"
                          title="Activate Customer"
                        >
                          <UserCheck className="h-4 w-4 text-green-600 group-hover/btn:scale-110 transition-transform" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Activate
                          </span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuspendCustomer(customer);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group/btn relative"
                        title="Suspend Customer"
                      >
                        <BanIcon className="h-4 w-4 text-red-600 group-hover/btn:scale-110 transition-transform" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Suspend
                        </span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {customers.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Users className="h-12 w-12 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We couldn't find any customers matching your criteria. Try adjusting your filters or search terms.
          </p>
          <button
            onClick={onClearFilters}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// CUSTOMER CARD COMPONENT (Grid View) - FIXED
// ============================================
const CustomerCard = ({ 
  customer, 
  onView, 
  onEdit, 
  onDelete,
  onActivate,
  onDeactivate,
  onSuspend,
  onRestore,
  onViewActivity
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getCustomerStatus = (user) => {
    if (user.isDeleted) return 'deleted';
    if (!user.isActive) return 'inactive';
    if (user.loginLockoutUntil && new Date(user.loginLockoutUntil) > new Date()) return 'suspended';
    if (!user.isVerified) return 'pending';
    return 'active';
  };

  const status = getCustomerStatus(customer);
  const statusConfig = CUSTOMER_STATUS[status] || CUSTOMER_STATUS.active;
  const verificationConfig = VERIFICATION_STATUS[customer.isVerified ? 'verified' : 'unverified'];
  const authConfig = AUTH_METHODS[customer.authMethod] || AUTH_METHODS.email;
  const genderConfig = GENDER_OPTIONS[customer.gender] || GENDER_OPTIONS['prefer not to say'];
  const StatusIcon = statusConfig.icon;
  const AuthIcon = authConfig.icon;
  const GenderIcon = genderConfig.icon;

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const getAvatarColor = (email) => {
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600'
    ];
    const index = email ? email.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const formatDate = (date) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl transition-all group hover:-translate-y-1 ${
        customer.isDeleted ? 'opacity-60 bg-gray-50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        {/* Header with Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getAvatarColor(customer.email)} flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform`}>
              {getInitials(customer.firstName, customer.lastName, customer.email)}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${statusConfig.badgeColor} shadow-md`}></div>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} shadow-sm`}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {statusConfig.label}
          </span>
        </div>

        {/* Customer Info */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-primary-600 transition-colors">
          {customer.firstName || ''} {customer.lastName || ''}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
          <span className="truncate">{customer.email}</span>
        </div>

        {customer.username && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <AtSign className="h-3.5 w-3.5 mr-2 text-gray-400" />
            <span>@{customer.username}</span>
          </div>
        )}

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <Cake className="h-3 w-3 mr-1" />
              Birthday
            </div>
            <p className="text-sm font-medium text-gray-900">
              {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <GenderIcon className={`h-3 w-3 mr-1 ${genderConfig.color}`} />
              Gender
            </div>
            <p className={`text-sm font-medium ${genderConfig.color}`}>
              {genderConfig.label}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {customer.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.alternativePhone && (
            <div className="flex items-center text-sm text-gray-500">
              <Smartphone className="h-3.5 w-3.5 mr-2 text-gray-400" />
              <span>{customer.alternativePhone}</span>
            </div>
          )}
        </div>

        {/* University & Verification */}
        <div className="space-y-2 mb-4">
          {customer.university && (
            <div className="flex items-center text-sm text-gray-600">
              <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{customer.university}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${verificationConfig.bgColor} ${verificationConfig.color} flex items-center`}>
              {customer.isVerified ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Unverified
                </>
              )}
            </span>
            <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${authConfig.bgColor} ${authConfig.color}`}>
              <AuthIcon className="h-3 w-3 mr-1" />
              {authConfig.label}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center">
            <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-gray-500" />
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-lg font-bold text-gray-900">{customer.orderCount || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-gray-500" />
            <p className="text-xs text-gray-500">Spent</p>
            <p className="text-lg font-bold text-gray-900">
              {(customer.totalSpent || 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
          </div>
        </div>

        {/* Joined Date */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Joined {formatDate(customer.createdAt)}
          </div>
          {customer.lastActive && (
            <div className="flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(customer.lastActive), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Action Buttons - FIXED */}
        <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
          {customer.isDeleted ? (
            <>
              <button
                onClick={() => {
                  console.log('🔄 Restore button clicked for:', customer.email);
                  onRestore(customer);
                }}
                className="flex-1 px-3 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center group/btn"
              >
                <RotateCcw className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Restore
              </button>
              <button
                onClick={() => {
                  console.log('🗑️ Delete button clicked for:', customer.email);
                  onDelete(customer);
                }}
                className="flex-1 px-3 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center group/btn"
              >
                <TrashIcon className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  console.log('👁️ View button clicked for:', customer.email);
                  onView(customer);
                }}
                className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center group/btn"
              >
                <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                View
              </button>
              <button
                onClick={() => {
                  console.log('✏️ Edit button clicked for:', customer.email);
                  onEdit(customer);
                }}
                className="flex-1 px-3 py-2.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-center group/btn"
              >
                <Edit className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Edit
              </button>
              <button
                onClick={() => {
                  console.log('📊 Activity button clicked for:', customer.email);
                  onViewActivity(customer);
                }}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors group/btn relative"
                title="View Activity"
              >
                <Activity className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Activity
                </span>
              </button>
              {customer.isActive ? (
                <button
                  onClick={() => {
                    console.log('⏸️ Deactivate button clicked for:', customer.email);
                    onDeactivate(customer);
                  }}
                  className="p-2.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors group/btn relative"
                  title="Deactivate Customer"
                >
                  <UserX className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Deactivate
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log('▶️ Activate button clicked for:', customer.email);
                    onActivate(customer);
                  }}
                  className="p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors group/btn relative"
                  title="Activate Customer"
                >
                  <UserCheck className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Activate
                  </span>
                </button>
              )}
              <button
                onClick={() => {
                  console.log('🚫 Suspend button clicked for:', customer.email);
                  onSuspend(customer);
                }}
                className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors group/btn relative"
                title="Suspend Customer"
              >
                <BanIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Suspend
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// PAGINATION COMPONENT
// ============================================
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      <div className="text-sm text-gray-700">
        Page <span className="font-medium">{currentPage}</span> of{' '}
        <span className="font-medium">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:border-primary-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`min-w-[36px] h-9 px-3 rounded-lg transition-all ${
              page === currentPage
                ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                : page === '...'
                ? 'cursor-default text-gray-500'
                : 'hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-primary-300'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:border-primary-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN CUSTOMERS PAGE COMPONENT
// ============================================
const CustomersPage = () => {
  const { showToast } = useToast();

  // State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    deletedCustomers: 0,
    suspendedCustomers: 0,
    verifiedCustomers: 0,
    unverifiedCustomers: 0,
    recentJoins: 0,
    recentActivity: 0,
    emailAuthCustomers: 0,
    googleAuthCustomers: 0,
    businessAccounts: 0,
    studentsWithId: 0,
    usersWithPhone: 0,
    usersWithUsername: 0,
    topUniversities: [],
    topCounties: [],
    byYearOfStudy: [],
    byGender: [],
    byRole: [],
    newCustomersTrend: []
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: [],
    verification: [],
    university: '',
    gender: '',
    county: '',
    yearOfStudy: '',
    role: '',
    dateRange: { start: null, end: null },
    hasUsername: null,
    hasAltPhone: null,
    ageRange: { min: null, max: null },
    includeDeleted: false
  });

  // Sorting
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // ============================================
  // FETCH CUSTOMERS
  // ============================================
  const fetchCustomers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.status.length && { status: filters.status.join(',') }),
        ...(filters.verification.length && { verification: filters.verification.join(',') }),
        ...(filters.university && { university: filters.university }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.county && { county: filters.county }),
        ...(filters.yearOfStudy && { yearOfStudy: filters.yearOfStudy }),
        ...(filters.role && { role: filters.role }),
        ...(filters.dateRange.start && { startDate: filters.dateRange.start.toISOString() }),
        ...(filters.dateRange.end && { endDate: filters.dateRange.end.toISOString() }),
        ...(filters.hasUsername !== null && { hasUsername: filters.hasUsername }),
        ...(filters.hasAltPhone !== null && { hasAltPhone: filters.hasAltPhone }),
        ...(filters.ageRange.min && { minAge: filters.ageRange.min }),
        ...(filters.ageRange.max && { maxAge: filters.ageRange.max }),
        ...(filters.includeDeleted && { includeDeleted: true })
      };

      const response = await api.get('/admin/users', { params });

      if (response?.success) {
        setCustomers(response.data || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 20,
          total: response.data?.length || 0,
          pages: 1
        });
      }

      if (showRefreshing) {
        showToast('Customers refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to fetch customers', 'error');
      setCustomers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, sortField, sortOrder, filters, showToast]);

  // Fetch deleted customers
  const fetchDeletedCustomers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users/deleted', {
        params: { limit: 100 }
      });
      
      if (response?.success) {
        setDeletedCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch deleted customers:', error);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/users/stats');
      
      if (response?.success) {
        const statsData = response.data || response.stats || response;
        
        setStats({
          totalCustomers: statsData.totalCustomers || 0,
          activeCustomers: statsData.activeCustomers || 0,
          inactiveCustomers: statsData.inactiveCustomers || 0,
          deletedCustomers: statsData.deletedCustomers || 0,
          suspendedCustomers: statsData.suspendedCustomers || 0,
          verifiedCustomers: statsData.verifiedCustomers || 0,
          unverifiedCustomers: statsData.unverifiedCustomers || 0,
          recentJoins: statsData.recentJoins || 0,
          recentActivity: statsData.recentActivity || 0,
          emailAuthCustomers: statsData.emailAuthCustomers || 0,
          googleAuthCustomers: statsData.googleAuthCustomers || 0,
          businessAccounts: statsData.businessAccounts || 0,
          studentsWithId: statsData.studentsWithId || 0,
          usersWithPhone: statsData.usersWithPhone || 0,
          usersWithUsername: statsData.usersWithUsername || 0,
          topUniversities: statsData.topUniversities || [],
          topCounties: statsData.topCounties || [],
          byYearOfStudy: statsData.byYearOfStudy || [],
          byGender: statsData.byGender || [],
          byRole: statsData.byRole || [],
          newCustomersTrend: statsData.newCustomersTrend || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCustomers(),
        fetchStats(),
        fetchDeletedCustomers()
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (filters.search === '') {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchCustomers();
    } else {
      const timer = setTimeout(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchCustomers();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [filters.search]);

  // Update fetch when other filters change
  useEffect(() => {
    if (loading) return;
    
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    filters.status, 
    filters.verification, 
    filters.university, 
    filters.gender,
    filters.county,
    filters.yearOfStudy,
    filters.role,
    filters.dateRange.start, 
    filters.dateRange.end,
    filters.hasUsername,
    filters.hasAltPhone,
    filters.ageRange.min,
    filters.ageRange.max,
    filters.includeDeleted
  ]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCustomers(true),
      fetchStats(),
      fetchDeletedCustomers()
    ]);
    setRefreshing(false);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
    }
  };

  const handleViewCustomer = (customer) => {
    console.log('👁️ View customer:', customer.email);
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleEditCustomer = (customer) => {
    console.log('✏️ Edit customer:', customer.email);
    setSelectedCustomer(customer);
    setShowFormModal(true);
  };

  const handleAddCustomer = () => {
    console.log('➕ Add new customer');
    setSelectedCustomer(null);
    setShowFormModal(true);
  };

  const handleDeleteClick = (customer) => {
    console.log('🗑️ Delete customer:', customer.email);
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      if (customerToDelete.isDeleted) {
        // Permanent delete
        await api.delete(`/admin/users/${customerToDelete._id}/permanent`);
        showToast(
          <div>
            <p className="font-medium">Customer Permanently Deleted</p>
            <p className="text-sm opacity-90">{customerToDelete.email} has been permanently removed</p>
          </div>,
          'success'
        );
      } else {
        // Soft delete
        await api.delete(`/admin/users/${customerToDelete._id}`, {
          data: { reason: 'Manual deletion by admin' }
        });
        showToast(
          <div>
            <p className="font-medium">Customer Deleted</p>
            <p className="text-sm opacity-90">{customerToDelete.email} has been moved to trash</p>
          </div>,
          'success'
        );
      }
      
      await Promise.all([
        fetchCustomers(),
        fetchStats(),
        fetchDeletedCustomers()
      ]);
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Failed to delete customer', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateCustomer = (customer) => {
    console.log('▶️ Activate customer:', customer.email);
    setSelectedCustomer(customer);
    setShowActivateModal(true);
  };

  const handleConfirmActivate = async () => {
    if (!selectedCustomer) return;

    try {
      await api.put(`/admin/users/${selectedCustomer._id}/activate`);
      showToast(
        <div>
          <p className="font-medium">Customer Activated</p>
          <p className="text-sm opacity-90">{selectedCustomer.email} has been activated</p>
        </div>,
        'success'
      );
      await Promise.all([
        fetchCustomers(),
        fetchStats()
      ]);
      setShowActivateModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Failed to activate customer', 'error');
    }
  };

  const handleDeactivateCustomer = (customer) => {
    console.log('⏸️ Deactivate customer:', customer.email);
    setSelectedCustomer(customer);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = async (reason) => {
    if (!selectedCustomer) return;

    try {
      await api.put(`/admin/users/${selectedCustomer._id}/deactivate`, { reason });
      showToast(
        <div>
          <p className="font-medium">Customer Deactivated</p>
          <p className="text-sm opacity-90">{selectedCustomer.email} has been deactivated</p>
        </div>,
        'success'
      );
      await Promise.all([
        fetchCustomers(),
        fetchStats()
      ]);
      setShowDeactivateModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Failed to deactivate customer', 'error');
    }
  };

  const handleSuspendCustomer = (customer) => {
    console.log('🚫 Suspend customer:', customer.email);
    setSelectedCustomer(customer);
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = async (data) => {
    if (!selectedCustomer) return;

    try {
      await api.put(`/admin/users/${selectedCustomer._id}/suspend`, {
        reason: data.reason,
        duration: data.duration
      });
      showToast(
        <div>
          <p className="font-medium">Customer Suspended</p>
          <p className="text-sm opacity-90">{selectedCustomer.email} has been suspended for {data.duration} days</p>
        </div>,
        'success'
      );
      await Promise.all([
        fetchCustomers(),
        fetchStats()
      ]);
      setShowSuspendModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Failed to suspend customer', 'error');
    }
  };

  const handleRestoreCustomer = (customer) => {
    console.log('🔄 Restore customer:', customer.email);
    setSelectedCustomer(customer);
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedCustomer) return;

    try {
      await api.put(`/admin/users/${selectedCustomer._id}/restore`);
      showToast(
        <div>
          <p className="font-medium">Customer Restored</p>
          <p className="text-sm opacity-90">{selectedCustomer.email} has been restored from trash</p>
        </div>,
        'success'
      );
      await Promise.all([
        fetchCustomers(),
        fetchStats(),
        fetchDeletedCustomers()
      ]);
      setShowRestoreModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Failed to restore customer', 'error');
    }
  };

  const handleViewActivity = (customer) => {
    console.log('📊 View activity for customer:', customer.email, 'ID:', customer._id);
    setSelectedCustomer(customer);
    setShowActivityModal(true);
  };

  const handleViewTrash = () => {
    console.log('🗑️ View trash');
    setShowTrashModal(true);
  };

  const handleBulkAction = (action) => {
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const handleBulkConfirm = async (data) => {
    try {
      let endpoint = '/admin/users/bulk';
      let payload = {
        userIds: selectedCustomers,
        action: data.action,
        data: data
      };

      if (data.action === 'permanent-delete') {
        endpoint = '/admin/users/bulk/permanent-delete';
        payload = { userIds: selectedCustomers };
      }

      const response = await api.post(endpoint, payload);

      showToast(
        <div>
          <p className="font-medium">Bulk Operation Successful</p>
          <p className="text-sm opacity-90">{response.data.message}</p>
        </div>,
        'success'
      );
      
      setSelectedCustomers([]);
      await Promise.all([
        fetchCustomers(),
        fetchStats(),
        fetchDeletedCustomers()
      ]);
      setShowBulkModal(false);
      setBulkAction(null);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Failed to perform bulk operation', 'error');
    }
  };

  const handleExport = async (format, options) => {
    try {
      const response = await api.get('/admin/users/export', { 
        params: {
          format,
          ...options,
          fields: [
            'firstName', 'lastName', 'email', 'phone', 'alternativePhone', 'username',
            'dateOfBirth', 'gender', 'university', 'faculty', 'department', 'yearOfStudy',
            'studentId', 'registrationNumber', 'address', 'city', 'county', 'postalCode',
            'emergencyName', 'emergencyPhone', 'emergencyRelationship',
            'isVerified', 'isEmailVerified', 'isPhoneVerified', 'isActive', 'isDeleted',
            'authMethod', 'role', 'businessName', 'currency', 'language', 'timezone',
            'preferredPaymentMethod', 'newsletter', 'emailNotifications', 'smsNotifications',
            'orderCount', 'totalSpent', 'createdAt', 'lastActive', 'lastLogin',
            'tags', 'referralSource', 'notes'
          ].join(','),
          ...(selectedCustomers.length > 0 && { ids: selectedCustomers.join(',') }),
          includeDeleted: options.includeDeleted || false
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast(
        <div>
          <p className="font-medium">Export Complete</p>
          <p className="text-sm opacity-90">{selectedCustomers.length || 'All'} customers exported as {format.toUpperCase()}</p>
        </div>,
        'success'
      );
      setShowExportModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Failed to export customers', 'error');
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
    showToast('Filters applied successfully', 'info');
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: [],
      verification: [],
      university: '',
      gender: '',
      county: '',
      yearOfStudy: '',
      role: '',
      dateRange: { start: null, end: null },
      hasUsername: null,
      hasAltPhone: null,
      ageRange: { min: null, max: null },
      includeDeleted: false
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
    showToast('Filters cleared', 'info');
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchCustomers();
  };

  const toggleShowDeleted = () => {
    setFilters(prev => ({
      ...prev,
      includeDeleted: !prev.includeDeleted
    }));
    setShowDeleted(!showDeleted);
  };

  // Calculate derived stats for display
  const activePercentage = stats.totalCustomers > 0 
    ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)
    : '0.0';

  const verifiedPercentage = stats.totalCustomers > 0
    ? ((stats.verifiedCustomers / stats.totalCustomers) * 100).toFixed(1)
    : '0.0';

  const phonePercentage = stats.totalCustomers > 0
    ? ((stats.usersWithPhone / stats.totalCustomers) * 100).toFixed(1)
    : '0.0';

  const usernamePercentage = stats.totalCustomers > 0
    ? ((stats.usersWithUsername / stats.totalCustomers) * 100).toFixed(1)
    : '0.0';

  const deletedPercentage = stats.totalCustomers > 0
    ? ((stats.deletedCustomers / stats.totalCustomers) * 100).toFixed(1)
    : '0.0';

  // Get top university name
  const topUniversity = stats.topUniversities && stats.topUniversities.length > 0
    ? stats.topUniversities[0]._id || stats.topUniversities[0].name || 'Various'
    : 'Various';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-primary-600" />
                Customers
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and analyze your customer base with advanced insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative group"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing && (
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap">
                    Refreshing...
                  </span>
                )}
              </button>
              <button
                onClick={handleViewTrash}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                title="View Trash"
              >
                <Archive className="h-5 w-5 text-gray-600" />
                {stats.deletedCustomers > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.deletedCustomers}
                  </span>
                )}
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Trash ({stats.deletedCustomers})
                </span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative"
                title="Export"
              >
                <Download className="h-5 w-5 text-gray-600" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Export Data
                </span>
              </button>
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center text-sm font-medium shadow-md hover:shadow-lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </button>
              <div className="flex items-center border-l border-gray-200 pl-3 space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'table' 
                      ? 'bg-primary-50 text-primary-600 shadow-inner' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Table View"
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-primary-50 text-primary-600 shadow-inner' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Enhanced with new metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
            <StatsCard
              title="Total Customers"
              value={stats.totalCustomers?.toLocaleString() || '0'}
              icon={Users}
              color="bg-gradient-to-br from-blue-600 to-blue-700"
              subtitle={`${stats.recentJoins || 0} joined this month`}
              trend={stats.recentJoins > 0 ? 12.5 : 0}
            />
            <StatsCard
              title="Active"
              value={stats.activeCustomers?.toLocaleString() || '0'}
              icon={UserCheck}
              color="bg-gradient-to-br from-green-600 to-green-700"
              subtitle={`${activePercentage}% of total`}
              trend={parseFloat(activePercentage)}
            />
            <StatsCard
              title="Inactive"
              value={stats.inactiveCustomers?.toLocaleString() || '0'}
              icon={UserX}
              color="bg-gradient-to-br from-gray-600 to-gray-700"
              subtitle={`${((stats.inactiveCustomers / stats.totalCustomers) * 100).toFixed(1) || 0}%`}
            />
            <StatsCard
              title="Suspended"
              value={stats.suspendedCustomers?.toLocaleString() || '0'}
              icon={BanIcon}
              color="bg-gradient-to-br from-red-600 to-red-700"
            />
            <StatsCard
              title="Deleted"
              value={stats.deletedCustomers?.toLocaleString() || '0'}
              icon={Trash2}
              color="bg-gradient-to-br from-gray-600 to-gray-700"
              subtitle={`${deletedPercentage}% in trash`}
              onClick={handleViewTrash}
            />
            <StatsCard
              title="Verified"
              value={stats.verifiedCustomers?.toLocaleString() || '0'}
              icon={CheckCircle}
              color="bg-gradient-to-br from-purple-600 to-purple-700"
              subtitle={`${verifiedPercentage}% verified`}
              trend={parseFloat(verifiedPercentage)}
            />
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[400px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone, username..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-xl flex items-center space-x-2 transition-all shadow-sm ${
                showFilters 
                  ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-inner' 
                  : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {Object.values(filters).flat().filter(Boolean).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white rounded-full text-xs font-medium">
                  {Object.values(filters).flat().filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={toggleShowDeleted}
              className={`px-4 py-2.5 border rounded-xl flex items-center space-x-2 transition-all shadow-sm ${
                filters.includeDeleted
                  ? 'bg-red-50 border-red-300 text-red-700 shadow-inner'
                  : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Archive className="h-4 w-4" />
              <span className="font-medium">Show Deleted</span>
            </button>
            {selectedCustomers.length > 0 && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-2 rounded-xl border border-primary-200 shadow-sm">
                <span className="text-sm font-semibold text-primary-700">
                  {selectedCustomers.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors shadow-sm hover:shadow"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-xs font-medium transition-colors shadow-sm hover:shadow"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium transition-colors shadow-sm hover:shadow"
                >
                  Suspend
                </button>
                <button
                  onClick={() => handleBulkAction('verify')}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium transition-colors shadow-sm hover:shadow"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleBulkAction('soft-delete')}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium transition-colors shadow-sm hover:shadow"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedCustomers([])}
                  className="p-1.5 hover:bg-primary-200 rounded-lg transition-colors"
                  title="Clear selection"
                >
                  <X className="h-3 w-3 text-primary-700" />
                </button>
              </div>
            )}
          </div>

          {/* Filter Panel - Updated with new filters */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              onClose={() => setShowFilters(false)}
              universities={stats.topUniversities}
              counties={stats.topCounties}
              yearOfStudyOptions={stats.byYearOfStudy}
              genderOptions={stats.byGender}
              roleOptions={stats.byRole}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* View Mode Content */}
          {viewMode === 'table' ? (
            <CustomersTable
              customers={customers}
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onSelectAll={handleSelectAll}
              onSort={handleSort}
              sortField={sortField}
              sortOrder={sortOrder}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteClick}
              onActivateCustomer={handleActivateCustomer}
              onDeactivateCustomer={handleDeactivateCustomer}
              onSuspendCustomer={handleSuspendCustomer}
              onRestoreCustomer={handleRestoreCustomer}
              onViewActivity={handleViewActivity}
              loading={loading}
              onClearFilters={handleClearFilters}
              showDeleted={filters.includeDeleted}
            />
          ) : (
            <div className="p-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-xl h-96 animate-pulse"></div>
                  ))}
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Users className="h-12 w-12 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    We couldn't find any customers matching your criteria. Try adjusting your filters or search terms.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {customers.map((customer) => (
                    <CustomerCard
                      key={customer._id}
                      customer={customer}
                      onView={handleViewCustomer}
                      onEdit={handleEditCustomer}
                      onDelete={handleDeleteClick}
                      onActivate={handleActivateCustomer}
                      onDeactivate={handleDeactivateCustomer}
                      onSuspend={handleSuspendCustomer}
                      onRestore={handleRestoreCustomer}
                      onViewActivity={handleViewActivity}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && customers.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditCustomer(selectedCustomer);
          }}
          onActivate={handleActivateCustomer}
          onDeactivate={handleDeactivateCustomer}
          onSuspend={handleSuspendCustomer}
          onRestore={handleRestoreCustomer}
          onViewActivity={handleViewActivity}
        />
      )}

      {showFormModal && (
        <CustomerFormModal
          customer={selectedCustomer}
          onClose={() => {
            setShowFormModal(false);
            setSelectedCustomer(null);
          }}
          onSuccess={async () => {
            await Promise.all([
              fetchCustomers(),
              fetchStats(),
              fetchDeletedCustomers()
            ]);
            setShowFormModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {showBulkModal && (
        <BulkActionModalEnhanced
          action={bulkAction}
          selectedCount={selectedCustomers.length}
          onClose={() => {
            setShowBulkModal(false);
            setBulkAction(null);
          }}
          onConfirm={handleBulkConfirm}
          showReason={['deactivate', 'suspend', 'soft-delete'].includes(bulkAction)}
          showDuration={bulkAction === 'suspend'}
        />
      )}

      {showExportModal && (
        <ExportModal
          selectedCount={selectedCustomers.length}
          filters={filters}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          availableFields={[
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'alternativePhone', label: 'Alternative Phone' },
            { key: 'username', label: 'Username' },
            { key: 'dateOfBirth', label: 'Date of Birth' },
            { key: 'gender', label: 'Gender' },
            { key: 'university', label: 'University' },
            { key: 'faculty', label: 'Faculty' },
            { key: 'department', label: 'Department' },
            { key: 'yearOfStudy', label: 'Year of Study' },
            { key: 'studentId', label: 'Student ID' },
            { key: 'address', label: 'Address' },
            { key: 'city', label: 'City' },
            { key: 'county', label: 'County' },
            { key: 'isVerified', label: 'Verification Status' },
            { key: 'isEmailVerified', label: 'Email Verified' },
            { key: 'isPhoneVerified', label: 'Phone Verified' },
            { key: 'isActive', label: 'Account Status' },
            { key: 'isDeleted', label: 'Is Deleted' },
            { key: 'authMethod', label: 'Auth Method' },
            { key: 'role', label: 'Role' },
            { key: 'businessName', label: 'Business Name' },
            { key: 'createdAt', label: 'Joined Date' },
            { key: 'lastActive', label: 'Last Active' },
            { key: 'orderCount', label: 'Order Count' },
            { key: 'totalSpent', label: 'Total Spent' },
            { key: 'tags', label: 'Tags' },
            { key: 'referralSource', label: 'Referral Source' },
            { key: 'notes', label: 'Notes' }
          ]}
        />
      )}

      {showDeleteModal && customerToDelete && (
        <DeleteConfirmationModal
          title={customerToDelete.isDeleted ? "Permanently Delete Customer" : "Delete Customer"}
          message={`Are you sure you want to ${customerToDelete.isDeleted ? 'permanently delete' : 'delete'} ${customerToDelete?.firstName || ''} ${customerToDelete?.lastName || ''}?`}
          details={`Email: ${customerToDelete?.email || 'N/A'}
Username: ${customerToDelete?.username || 'Not set'}
Phone: ${customerToDelete?.phone || 'Not set'}
Orders: ${customerToDelete?.orderCount || 0}
Joined: ${customerToDelete?.createdAt ? format(new Date(customerToDelete.createdAt), 'PPP') : 'N/A'}
Status: ${customerToDelete?.isDeleted ? 'Deleted' : (customerToDelete?.isActive ? 'Active' : 'Inactive')}
${customerToDelete?.isDeleted ? '\n⚠️ This action is permanent and cannot be undone!' : '\nThe customer will be moved to trash and can be restored later.'}`}
          onClose={() => {
            setShowDeleteModal(false);
            setCustomerToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          severity={customerToDelete?.isDeleted ? 'danger' : 'warning'}
        />
      )}

      {showActivateModal && selectedCustomer && (
        <AccountActionModal
          title="Activate Customer"
          message={`Are you sure you want to activate ${selectedCustomer?.firstName || ''} ${selectedCustomer?.lastName || ''}?`}
          details={`Email: ${selectedCustomer?.email}\nThis will restore full access to their account.`}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleConfirmActivate}
          actionType="activate"
        />
      )}

      {showDeactivateModal && selectedCustomer && (
        <AccountActionModal
          title="Deactivate Customer"
          message={`Are you sure you want to deactivate ${selectedCustomer?.firstName || ''} ${selectedCustomer?.lastName || ''}?`}
          details={`Email: ${selectedCustomer?.email}\nThis will prevent them from logging in and accessing their account.`}
          onClose={() => {
            setShowDeactivateModal(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleConfirmDeactivate}
          actionType="deactivate"
          showReason={true}
        />
      )}

      {showSuspendModal && selectedCustomer && (
        <SuspensionModal
          customer={selectedCustomer}
          onClose={() => {
            setShowSuspendModal(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleConfirmSuspend}
        />
      )}

      {showRestoreModal && selectedCustomer && (
        <RestoreConfirmationModal
          title="Restore Customer"
          message={`Are you sure you want to restore ${selectedCustomer?.firstName || ''} ${selectedCustomer?.lastName || ''}?`}
          details={`Email: ${selectedCustomer?.email}\nUsername: ${selectedCustomer?.username || 'Not set'}\nDeleted: ${selectedCustomer?.deletedAt ? format(new Date(selectedCustomer.deletedAt), 'PPP') : 'Unknown'}`}
          onClose={() => {
            setShowRestoreModal(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleConfirmRestore}
        />
      )}

      {showActivityModal && selectedCustomer && (
        <ActivityLogModal
          customer={selectedCustomer}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {showTrashModal && (
        <TrashViewModal
          customers={deletedCustomers}
          onClose={() => setShowTrashModal(false)}
          onRestore={handleRestoreCustomer}
          onPermanentDelete={handleDeleteClick}
          onRefresh={fetchDeletedCustomers}
        />
      )}
    </div>
  );
};

export default CustomersPage;