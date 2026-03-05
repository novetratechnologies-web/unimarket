// admin/src/components/common/TrashViewModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Archive,
  RotateCcw,
  Trash2,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  AtSign,
  Hash,
  Calendar as CalendarIcon,
  Info,
  AlertTriangle,
  Shield,
  Eye,
  MoreVertical
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';

const TrashViewModal = ({ 
  customers = [], 
  onClose, 
  onRestore, 
  onPermanentDelete,
  onRefresh 
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: 'deletedAt',
    direction: 'desc'
  });
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [filterBy, setFilterBy] = useState('all');

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (customer.firstName?.toLowerCase() || '').includes(searchLower) ||
          (customer.lastName?.toLowerCase() || '').includes(searchLower) ||
          (customer.email?.toLowerCase() || '').includes(searchLower) ||
          (customer.username?.toLowerCase() || '').includes(searchLower) ||
          (customer.phone || '').includes(searchTerm) ||
          (customer._id || '').includes(searchTerm)
        );
      }
      return true;
    })
    .filter(customer => {
      // Status filter
      if (filterBy === 'recent') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(customer.deletedAt) >= thirtyDaysAgo;
      }
      if (filterBy === 'old') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(customer.deletedAt) < thirtyDaysAgo;
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (sortConfig.field === 'deletedAt' || sortConfig.field === 'createdAt' || sortConfig.field === 'lastActive') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      
      const aString = String(aValue || '').toLowerCase();
      const bString = String(bValue || '').toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aString.localeCompare(bString);
      }
      return bString.localeCompare(aString);
    });

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c._id));
    }
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleRestore = async (customer) => {
    setActionLoading(prev => ({ ...prev, [customer._id]: 'restore' }));
    try {
      await onRestore(customer);
      showToast(
        <div className="flex items-center">
          <RotateCcw className="h-4 w-4 text-green-500 mr-2" />
          <div>
            <p className="font-medium">Customer Restored</p>
            <p className="text-xs text-gray-600">{customer.email} has been restored</p>
          </div>
        </div>,
        'success'
      );
      setSelectedCustomers(prev => prev.filter(id => id !== customer._id));
    } catch (error) {
      showToast(error.message || 'Failed to restore customer', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [customer._id]: null }));
    }
  };

  const handlePermanentDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${customer.email}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [customer._id]: 'delete' }));
    try {
      await onPermanentDelete(customer);
      showToast(
        <div className="flex items-center">
          <Trash2 className="h-4 w-4 text-red-500 mr-2" />
          <div>
            <p className="font-medium">Customer Permanently Deleted</p>
            <p className="text-xs text-gray-600">{customer.email} has been removed</p>
          </div>
        </div>,
        'success'
      );
      setSelectedCustomers(prev => prev.filter(id => id !== customer._id));
    } catch (error) {
      showToast(error.message || 'Failed to delete customer', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [customer._id]: null }));
    }
  };

  const handleBulkRestore = async () => {
    if (selectedCustomers.length === 0) return;
    
    setLoading(true);
    try {
      await Promise.all(
        selectedCustomers.map(id => {
          const customer = customers.find(c => c._id === id);
          return onRestore(customer);
        })
      );
      showToast(
        <div className="flex items-center">
          <RotateCcw className="h-4 w-4 text-green-500 mr-2" />
          <div>
            <p className="font-medium">Bulk Restore Complete</p>
            <p className="text-xs text-gray-600">{selectedCustomers.length} customers restored</p>
          </div>
        </div>,
        'success'
      );
      setSelectedCustomers([]);
    } catch (error) {
      showToast('Failed to restore some customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedCustomers.length} customers? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedCustomers.map(id => {
          const customer = customers.find(c => c._id === id);
          return onPermanentDelete(customer);
        })
      );
      showToast(
        <div className="flex items-center">
          <Trash2 className="h-4 w-4 text-red-500 mr-2" />
          <div>
            <p className="font-medium">Bulk Delete Complete</p>
            <p className="text-xs text-gray-600">{selectedCustomers.length} customers permanently deleted</p>
          </div>
        </div>,
        'success'
      );
      setSelectedCustomers([]);
    } catch (error) {
      showToast('Failed to delete some customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
      showToast('Trash refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh trash', 'error');
    } finally {
      setLoading(false);
    }
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
      'from-gray-500 to-gray-600',
      'from-gray-600 to-gray-700',
      'from-gray-700 to-gray-800',
      'from-slate-500 to-slate-600',
      'from-slate-600 to-slate-700',
      'from-zinc-500 to-zinc-600',
      'from-zinc-600 to-zinc-700',
      'from-neutral-500 to-neutral-600'
    ];
    const index = email ? email.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const formatDate = (date) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return '—';
    }
  };

  const getTimeInTrash = (deletedAt) => {
    if (!deletedAt) return '—';
    try {
      return formatDistanceToNow(new Date(deletedAt), { addSuffix: true });
    } catch {
      return '—';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with blur */}
        <div 
      
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header with Gradient */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-gray-700 to-gray-800">
            <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }}
                  />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm ring-1 ring-white/30">
                  <Archive className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Trash</h3>
                  <p className="text-sm text-white/80 mt-0.5">
                    {customers.length} deleted {customers.length === 1 ? 'customer' : 'customers'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors group relative"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`} />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Refresh
                  </span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-4 relative z-10">
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-white/70">Total in Trash</p>
                <p className="text-sm font-semibold text-white">{customers.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-white/70">With Orders</p>
                <p className="text-sm font-semibold text-white">
                  {customers.filter(c => c.orderCount > 0).length}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-white/70">With Email</p>
                <p className="text-sm font-semibold text-white">
                  {customers.filter(c => c.email).length}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-xs text-white/70">With Phone</p>
                <p className="text-sm font-semibold text-white">
                  {customers.filter(c => c.phone).length}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in trash..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">All Time</option>
                <option value="recent">Last 30 Days</option>
                <option value="old">Older than 30 Days</option>
              </select>
              {selectedCustomers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedCustomers.length} selected
                  </span>
                  <button
                    onClick={handleBulkRestore}
                    disabled={loading}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors flex items-center"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore All
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium transition-colors flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('firstName')}>
                    <div className="flex items-center">
                      Customer
                      {sortConfig.field === 'firstName' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('email')}>
                    <div className="flex items-center">
                      Contact
                      {sortConfig.field === 'email' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('university')}>
                    <div className="flex items-center">
                      University
                      {sortConfig.field === 'university' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('orderCount')}>
                    <div className="flex items-center">
                      Orders
                      {sortConfig.field === 'orderCount' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('deletedAt')}>
                    <div className="flex items-center">
                      Deleted
                      {sortConfig.field === 'deletedAt' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time in Trash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const isExpanded = expandedCustomer === customer._id;
                  const isLoading = actionLoading[customer._id];
                  
                  return (
                    <React.Fragment key={customer._id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer._id)}
                            onChange={() => handleSelectCustomer(customer._id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${getAvatarColor(customer.email)} flex items-center justify-center text-white font-semibold text-xs mr-3`}>
                              {getInitials(customer.firstName, customer.lastName, customer.email)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {customer.firstName || ''} {customer.lastName || ''}
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
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3.5 w-3.5 mr-1 text-gray-400" />
                              <span className="truncate max-w-[180px]" title={customer.email}>
                                {customer.email}
                              </span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Phone className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[150px] truncate">
                            {customer.university || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {customer.orderCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDate(customer.deletedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {getTimeInTrash(customer.deletedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRestore(customer)}
                              disabled={isLoading}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors group relative"
                              title="Restore"
                            >
                              {isLoading === 'restore' ? (
                                <Loader className="h-4 w-4 text-green-600 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
                              )}
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Restore
                              </span>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(customer)}
                              disabled={isLoading}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group relative"
                              title="Permanently Delete"
                            >
                              {isLoading === 'delete' ? (
                                <Loader className="h-4 w-4 text-red-600 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600 group-hover:scale-110 transition-transform" />
                              )}
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Delete Permanently
                              </span>
                            </button>
                            <button
                              onClick={() => setExpandedCustomer(isExpanded ? null : customer._id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group relative"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan="8" className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-4">
                              {/* Personal Info */}
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  Personal Info
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-sm">
                                    <span className="text-gray-500">Gender:</span>{' '}
                                    <span className="text-gray-900">{customer.gender || '—'}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">DOB:</span>{' '}
                                    <span className="text-gray-900">
                                      {customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'MMM d, yyyy') : '—'}
                                    </span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">ID Number:</span>{' '}
                                    <span className="text-gray-900">{customer.idNumber || '—'}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">Nationality:</span>{' '}
                                    <span className="text-gray-900">{customer.nationality || '—'}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Academic Info */}
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Academic Info
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-sm">
                                    <span className="text-gray-500">Faculty:</span>{' '}
                                    <span className="text-gray-900">{customer.faculty || '—'}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">Dept:</span>{' '}
                                    <span className="text-gray-900">{customer.department || '—'}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">Year:</span>{' '}
                                    <span className="text-gray-900">{customer.yearOfStudy || '—'}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">Student ID:</span>{' '}
                                    <span className="text-gray-900">{customer.studentId || '—'}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Deletion Info */}
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Deletion Info
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-sm">
                                    <span className="text-gray-500">Deleted at:</span>{' '}
                                    <span className="text-gray-900">{formatDate(customer.deletedAt)}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">Reason:</span>{' '}
                                    <span className="text-gray-900">{customer.deletedReason || 'Not specified'}</span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">Deleted by:</span>{' '}
                                    <span className="text-gray-900">
                                      {customer.deletedBy ? `Admin (${customer.deletedBy})` : 'System'}
                                    </span>
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500">Orders:</span>{' '}
                                    <span className="text-gray-900">{customer.orderCount || 0}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Archive className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is empty</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No customers match your search' : 'No deleted customers found'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredCustomers.length} of {customers.length} customers shown
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Close
              </button>
              {selectedCustomers.length > 0 && (
                <>
                  <button
                    onClick={handleBulkRestore}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Restore Selected
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Selected
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrashViewModal;