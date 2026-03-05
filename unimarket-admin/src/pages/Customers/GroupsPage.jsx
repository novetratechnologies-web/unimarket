// admin/src/pages/Customers/GroupsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Grid,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  UserMinus,
  Copy,
  MoreVertical,
  ChevronRight,
  Settings,
  Mail,
  MessageSquare,
  Download,
  Upload,
  RefreshCw,
  X,
  Check,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  Tag,
  Percent,
  Award,
  Star,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';
import GroupFormModal from './GroupFormModal';
import GroupDetailsModal from './GroupDetailsModal';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    activeGroups: 0,
    avgGroupSize: 0,
    dynamicGroups: 0,
    staticGroups: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    minMembers: '',
    maxMembers: '',
    isActive: '',
    dateRange: { start: null, end: null }
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });

  // Fetch groups from API
  const fetchGroups = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        ...(filters.type && { type: filters.type }),
        ...(filters.minMembers && { minMembers: filters.minMembers }),
        ...(filters.maxMembers && { maxMembers: filters.maxMembers }),
        ...(filters.isActive && { isActive: filters.isActive === 'true' }),
        ...(filters.dateRange?.start && { startDate: filters.dateRange.start.toISOString() }),
        ...(filters.dateRange?.end && { endDate: filters.dateRange.end.toISOString() })
      };

      const response = await api.get('/admin/customer-groups', { params });
      
      if (response?.success) {
        setGroups(response.data || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 12,
          total: response.data?.length || 0,
          pages: Math.ceil((response.data?.length || 0) / 12) || 1
        });
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      showToast(error.message || 'Failed to fetch groups', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/customer-groups/stats');
      
      if (response?.success) {
        setStats({
          totalGroups: response.data?.totalGroups || 0,
          totalMembers: response.data?.totalMembers || 0,
          activeGroups: response.data?.activeGroups || 0,
          avgGroupSize: response.data?.avgGroupSize || 0,
          dynamicGroups: response.data?.dynamicGroups || 0,
          staticGroups: response.data?.staticGroups || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchGroups(),
        fetchStats()
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTerm === '') {
      fetchGroups();
    } else {
      const timer = setTimeout(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchGroups();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Fetch when filters change
  useEffect(() => {
    if (loading) return;
    
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchGroups();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.type, filters.minMembers, filters.maxMembers, filters.isActive, filters.dateRange]);

  // Fetch when page changes
  useEffect(() => {
    if (loading) return;
    fetchGroups();
  }, [pagination.page]);

  const handleRefresh = async () => {
    await Promise.all([
      fetchGroups(true),
      fetchStats()
    ]);
  };

  const handleAddGroup = () => {
    setSelectedGroup(null);
    setShowFormModal(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setShowFormModal(true);
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (group) => {
    setGroupToDelete(group);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api.delete(`/admin/customer-groups/${groupToDelete._id}`);
      
      if (response?.success) {
        showToast(
          <div>
            <p className="font-medium">Group Deleted</p>
            <p className="text-sm opacity-90">{groupToDelete.name} has been removed</p>
          </div>,
          'success'
        );
        await Promise.all([
          fetchGroups(),
          fetchStats()
        ]);
        setShowDeleteModal(false);
        setGroupToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
      showToast(error.message || 'Failed to delete group', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateGroup = async (group) => {
    try {
      const response = await api.post('/admin/customer-groups/duplicate', { 
        groupId: group._id,
        name: `${group.name} (Copy)`
      });
      
      if (response?.success) {
        showToast('Group duplicated successfully', 'success');
        await Promise.all([
          fetchGroups(),
          fetchStats()
        ]);
      }
    } catch (error) {
      console.error('Failed to duplicate group:', error);
      showToast(error.message || 'Failed to duplicate group', 'error');
    }
  };

  const handleExportGroups = async () => {
    try {
      showToast('Preparing export...', 'info');
      
      const response = await api.get('/admin/customer-groups/export', {
        params: {
          format: 'csv',
          ...(searchTerm && { search: searchTerm }),
          ...filters
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer-groups-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast('Groups exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export groups:', error);
      showToast(error.message || 'Failed to export groups', 'error');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      minMembers: '',
      maxMembers: '',
      isActive: '',
      dateRange: { start: null, end: null }
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const GroupCard = ({ group }) => {
    const getTypeIcon = (type) => {
      switch (type) {
        case 'dynamic': return <Filter className="h-4 w-4" />;
        case 'static': return <Users className="h-4 w-4" />;
        case 'auto': return <RefreshCw className="h-4 w-4" />;
        default: return <Tag className="h-4 w-4" />;
      }
    };

    const getTypeColor = (type) => {
      switch (type) {
        case 'dynamic': return 'bg-purple-100 text-purple-700';
        case 'static': return 'bg-blue-100 text-blue-700';
        case 'auto': return 'bg-green-100 text-green-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    };

    const getMemberCount = () => {
      return group.memberCount?.toLocaleString() || '0';
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all group">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${
                group.type === 'dynamic' ? 'bg-purple-100' :
                group.type === 'auto' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {getTypeIcon(group.type)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {group.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Created {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // You can implement a dropdown menu here
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {group.description || 'No description provided'}
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(group.type)}`}>
                {group.type?.charAt(0).toUpperCase() + group.type?.slice(1) || 'Static'}
              </span>
              {group.isActive ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 flex items-center">
                  <X className="h-3 w-3 mr-1" />
                  Inactive
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{getMemberCount()}</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
          </div>

          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {group.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {tag}
                </span>
              ))}
              {group.tags.length > 3 && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  +{group.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => handleViewGroup(group)}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </button>
            <button
              onClick={() => handleEditGroup(group)}
              className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => handleDuplicateGroup(group)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Duplicate Group"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const Pagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= pagination.pages; i++) {
      if (
        i === 1 ||
        i === pagination.pages ||
        (i >= pagination.page - 2 && i <= pagination.page + 2)
      ) {
        pages.push(i);
      } else if (i === pagination.page - 3 || i === pagination.page + 3) {
        pages.push('...');
      }
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-1 rounded-lg ${
              page === pagination.page
                ? 'bg-primary-600 text-white'
                : page === '...'
                ? 'cursor-default'
                : 'hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.pages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const FilterPanel = () => {
    const [localFilters, setLocalFilters] = useState(filters);

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
            <select
              value={localFilters.type}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="static">Static</option>
              <option value="dynamic">Dynamic</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={localFilters.isActive}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, isActive: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Members</label>
            <input
              type="number"
              value={localFilters.minMembers}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, minMembers: e.target.value }))}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
            <input
              type="number"
              value={localFilters.maxMembers}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, maxMembers: e.target.value }))}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-4">
          <button
            onClick={() => {
              setLocalFilters(filters);
              setShowFilters(false);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleApplyFilters(localFilters);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Grid className="h-6 w-6 mr-2 text-primary-600" />
                Customer Groups
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Organize customers into groups for targeted marketing and management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportGroups}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export Groups"
              >
                <Download className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleAddGroup}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatsCard
              title="Total Groups"
              value={stats.totalGroups.toLocaleString()}
              icon={Grid}
              color="bg-blue-600"
              subtitle={`${stats.activeGroups} active groups`}
            />
            <StatsCard
              title="Total Members"
              value={stats.totalMembers.toLocaleString()}
              icon={Users}
              color="bg-green-600"
              subtitle="Across all groups"
            />
            <StatsCard
              title="Avg. Group Size"
              value={stats.avgGroupSize.toLocaleString()}
              icon={Users}
              color="bg-purple-600"
              subtitle="Members per group"
            />
            <StatsCard
              title="Dynamic Groups"
              value={stats.dynamicGroups.toLocaleString()}
              icon={Filter}
              color="bg-amber-600"
              subtitle={`${stats.staticGroups} static groups`}
            />
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(filters.type || filters.minMembers || filters.maxMembers || filters.isActive) && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
            {(searchTerm || filters.type || filters.minMembers || filters.maxMembers || filters.isActive) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && <FilterPanel />}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between mb-4">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-600 mb-6">Create your first customer group to get started</p>
            <button
              onClick={handleAddGroup}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map(group => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>
            <Pagination />
          </>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <GroupFormModal
          group={selectedGroup}
          onClose={() => {
            setShowFormModal(false);
            setSelectedGroup(null);
          }}
          onSuccess={async () => {
            await Promise.all([
              fetchGroups(),
              fetchStats()
            ]);
            setShowFormModal(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {showDetailsModal && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGroup(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            handleEditGroup(selectedGroup);
          }}
          onDelete={() => {
            setShowDetailsModal(false);
            handleDeleteClick(selectedGroup);
          }}
        />
      )}

      {showDeleteModal && customerToDelete && (
      <DeleteConfirmationModal
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerToDelete?.firstName || ''} ${customerToDelete?.lastName || ''}?`}
        itemName={customerToDelete?.email}
        details={`• Email: ${customerToDelete?.email || 'N/A'}
    • Username: ${customerToDelete?.username || 'Not set'}
    • Phone: ${customerToDelete?.phone || 'Not set'}
    • Orders: ${customerToDelete?.orderCount || 0}
    • Joined: ${customerToDelete?.createdAt ? format(new Date(customerToDelete.createdAt), 'PPP') : 'N/A'}
    • Status: ${customerToDelete?.isActive ? 'Active' : 'Inactive'}`}
        onClose={() => {
          setShowDeleteModal(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        severity="danger"
      />
    )}
    </div>
  );
};

export default GroupsPage;