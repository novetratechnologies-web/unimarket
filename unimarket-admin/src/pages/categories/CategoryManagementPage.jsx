// admin/src/pages/categories/CategoryManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiStar,
  FiSearch,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiCopy,
  FiDownload,
  FiFolder,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Import components
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ErrorAlert from './components/ErrorAlert';
import LoadingSpinner from '../../components/LoadingSkeleton';
import { useToast, ToastContainer } from '../../components/Toast';

const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
    totalProducts: 0
  });
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortCategories();
  }, [categories, searchTerm, filterStatus, sortBy, sortOrder]);

// In CategoryManagementPage.jsx, update the fetchCategories function:

const fetchCategories = async () => {
  setLoading(true);
  setApiError(null);
  try {
    console.log('📤 Fetching categories...');
    
    // Try different approaches
    let response;
    
    try {
      // First attempt with includeInactive
      response = await api.categories.getAll({ 
        limit: 100, 
        includeInactive: true 
      });
    } catch (err) {
      console.log('⚠️ First attempt failed, trying without params...');
      // Second attempt without params
      response = await api.categories.getAll();
    }
    
    console.log('📥 API Response:', response);
    
    // Extract categories data
    let categoriesData = [];
    
    if (response?.data?.data && Array.isArray(response.data.data)) {
      categoriesData = response.data.data;
    } else if (response?.data && Array.isArray(response.data)) {
      categoriesData = response.data;
    } else if (Array.isArray(response)) {
      categoriesData = response;
    } else if (response?.results && Array.isArray(response.results)) {
      categoriesData = response.results;
    } else if (response?.categories && Array.isArray(response.categories)) {
      categoriesData = response.categories;
    }
    
    setCategories(categoriesData);
    
    // Calculate stats
    const stats = {
      total: categoriesData.length,
      active: categoriesData.filter(c => c.settings?.isActive).length,
      inactive: categoriesData.filter(c => !c.settings?.isActive).length,
      featured: categoriesData.filter(c => c.settings?.isFeatured).length,
      totalProducts: categoriesData.reduce((sum, c) => sum + (c.stats?.productCount || 0), 0)
    };
    
    setStats(stats);
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    
    if (error.message === 'Network Error') {
      setApiError('Cannot connect to server. Please check if backend is running.');
      showToast('Cannot connect to server. Please check if backend is running.', { type: 'error' });
    } else {
      setApiError(error.response?.data?.message || 'Failed to load categories');
      showToast('Failed to load categories', { type: 'error' });
    }
  } finally {
    setLoading(false);
  }
};
  const filterAndSortCategories = () => {
    let filtered = [...categories];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(cat => 
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(cat => cat.settings?.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(cat => !cat.settings?.isActive);
        break;
      case 'featured':
        filtered = filtered.filter(cat => cat.settings?.isFeatured);
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'date':
          comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          break;
        case 'products':
          comparison = (b.stats?.productCount || 0) - (a.stats?.productCount || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCategories(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };

  const handleDelete = async (reassignTo) => {
    try {
      // FIXED: Use correct API method
      if (api.categories.delete) {
        await api.categories.delete(selectedCategory._id, { reassignTo });
      } else {
        await api.delete(`/categories/${selectedCategory._id}`, { data: { reassignTo } });
      }
      showToast('Category deleted successfully', { type: 'success' });
      await fetchCategories();
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast(error.response?.data?.message || 'Failed to delete category', { type: 'error' });
    }
  };

  const handleStatusToggle = async (category) => {
    try {
      // FIXED: Use correct API method
      const updateData = {
        settings: { 
          ...category.settings, 
          isActive: !category.settings?.isActive 
        }
      };
      
      if (api.categories.update) {
        await api.categories.update(category._id, updateData);
      } else {
        await api.put(`/categories/${category._id}`, updateData);
      }
      
      showToast(
        `${category.name} ${category.settings?.isActive ? 'deactivated' : 'activated'} successfully`,
        { type: 'success' }
      );
      await fetchCategories();
    } catch (error) {
      showToast('Failed to update category status', { type: 'error' });
    }
  };

  const handleFeaturedToggle = async (category) => {
    try {
      // FIXED: Use correct API method
      const updateData = {
        settings: { 
          ...category.settings, 
          isFeatured: !category.settings?.isFeatured 
        }
      };
      
      if (api.categories.update) {
        await api.categories.update(category._id, updateData);
      } else {
        await api.put(`/categories/${category._id}`, updateData);
      }
      
      showToast(
        `${category.name} ${category.settings?.isFeatured ? 'removed from' : 'added to'} featured`,
        { type: 'success' }
      );
      await fetchCategories();
    } catch (error) {
      showToast('Failed to update featured status', { type: 'error' });
    }
  };

  const handleDuplicate = async (category) => {
    try {
      // FIXED: Properly duplicate category
      const duplicateData = {
        ...category,
        name: `${category.name} (Copy)`,
        slug: `${category.slug}-copy-${Date.now()}`,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      // Remove fields that shouldn't be copied
      delete duplicateData._id;
      delete duplicateData.createdAt;
      delete duplicateData.updatedAt;
      delete duplicateData.id;
      
      if (api.categories.create) {
        await api.categories.create(duplicateData);
      } else {
        await api.post('/categories', duplicateData);
      }
      
      showToast('Category duplicated successfully', { type: 'success' });
      await fetchCategories();
    } catch (error) {
      console.error('Duplicate error:', error);
      showToast('Failed to duplicate category', { type: 'error' });
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(filteredCategories, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `categories-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showToast('Categories exported successfully', { type: 'success' });
    } catch (error) {
      showToast('Failed to export categories', { type: 'error' });
    }
  };

  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper function to get image URL safely
  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (typeof image === 'object' && image.url) return image.url;
    return null;
  };

  const CategoryCard = ({ category }) => {
    const bannerUrl = getImageUrl(category.banner);
    const imageUrl = getImageUrl(category.image);
    const [imageError, setImageError] = useState(false);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all group"
      >
        {/* Banner/Image */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
          {bannerUrl && !imageError ? (
            <img 
              src={bannerUrl}
              alt={category.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : imageUrl && !imageError ? (
            <img 
              src={imageUrl}
              alt={category.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FiFolder className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
          
          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {!category.settings?.isActive && (
              <span className="px-2 py-1 bg-gray-800/80 text-white text-xs rounded-full backdrop-blur-sm flex items-center">
                <FiEyeOff className="w-3 h-3 mr-1" />
                Inactive
              </span>
            )}
            {category.settings?.isFeatured && (
              <span className="px-2 py-1 bg-yellow-500/80 text-white text-xs rounded-full backdrop-blur-sm flex items-center">
                <FiStar className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
          </div>

          {/* Actions Menu */}
          <div className="absolute top-2 right-2">
            <div className="relative group/menu">
              <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                <FiMoreVertical className="w-4 h-4 text-white" />
              </button>
              
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                <div className="py-1">
                  <button
                    onClick={() => navigate(`/products/categories/edit/${category._id}`)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 flex items-center"
                  >
                    <FiEdit2 className="w-4 h-4 mr-2 text-indigo-600" />
                    Edit Category
                  </button>
                  <button
                    onClick={() => handleStatusToggle(category)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 flex items-center"
                  >
                    {category.settings?.isActive ? (
                      <>
                        <FiEyeOff className="w-4 h-4 mr-2 text-yellow-600" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <FiEye className="w-4 h-4 mr-2 text-green-600" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleFeaturedToggle(category)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 flex items-center"
                  >
                    <FiStar className={`w-4 h-4 mr-2 ${category.settings?.isFeatured ? 'text-yellow-600' : 'text-gray-400'}`} />
                    {category.settings?.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                  </button>
                  <button
                    onClick={() => handleDuplicate(category)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 flex items-center"
                  >
                    <FiCopy className="w-4 h-4 mr-2 text-blue-600" />
                    Duplicate
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowDeleteModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">/{category.slug}</p>
            </div>
            {category.parent && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                Subcategory
              </span>
            )}
          </div>

          {category.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {category.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                {category.stats?.productCount || 0}
              </p>
              <p className="text-xs text-gray-500">Products</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                {category.stats?.subcategoryCount || 0}
              </p>
              <p className="text-xs text-gray-500">Subcategories</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                {category.stats?.totalViews || 0}
              </p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const CategoryListItem = ({ category }) => {
    const bannerUrl = getImageUrl(category.banner);
    const [imageError, setImageError] = useState(false);
    
    return (
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hover:bg-gray-50 transition-colors"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white overflow-hidden">
              {bannerUrl && !imageError ? (
                <img 
                  src={bannerUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <FiFolder className="w-5 h-5" />
              )}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
              <div className="text-sm text-gray-500">/{category.slug}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {category.settings?.isActive ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center">
                <FiCheckCircle className="w-3 h-3 mr-1" />
                Active
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center">
                <FiXCircle className="w-3 h-3 mr-1" />
                Inactive
              </span>
            )}
            {category.settings?.isFeatured && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center">
                <FiStar className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {category.stats?.productCount || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {category.stats?.subcategoryCount || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => navigate(`/products/categories/edit/${category._id}`)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleStatusToggle(category)}
              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              title={category.settings?.isActive ? 'Deactivate' : 'Activate'}
            >
              {category.settings?.isActive ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setSelectedCategory(category);
                setShowDeleteModal(true);
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiFolder className="w-5 h-5 mr-2 text-indigo-600" />
                Category Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => navigate('/products/categories/create')}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                New Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Categories</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Inactive</p>
            <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Featured</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {apiError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <ErrorAlert 
            message={apiError} 
            onDismiss={() => setApiError(null)}
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="featured">Featured Only</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="products">Sort by Products</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 border-l pl-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <FiFolder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search or filters' : 'Get started by creating your first category'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/products/categories/create')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 inline-flex items-center text-sm font-medium"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Create New Category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {paginatedCategories.map(category => (
                    <CategoryCard key={category._id} category={category} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subcategories
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCategories.map(category => (
                      <CategoryListItem key={category._id} category={category} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of{' '}
                  {filteredCategories.length} results
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDelete}
        categoryName={selectedCategory?.name}
        categoryData={{
          productCount: selectedCategory?.stats?.productCount || 0,
          subcategoryCount: selectedCategory?.stats?.subcategoryCount || 0
        }}
        showToast={showToast}
      />
    </div>
  );
};

export default CategoryManagementPage;