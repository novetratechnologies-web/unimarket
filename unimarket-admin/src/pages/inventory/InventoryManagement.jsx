// admin/src/pages/inventory/InventoryManagementPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiAlertCircle,
  FiBell,
  FiTrash2,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiSettings
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/api';
import { useGlobalToast } from '../../context/GlobalToastContext';

// Components
import LoadingSpinner from '../../components/LoadingSkeleton';
import InventoryFilters from './components/InventoryFilters';
import InventoryTable from './components/InventoryTable';
import InventoryCards from './components/InventoryCards';
import InventoryStats from './components/InventoryStats';
import StockAdjustmentModal from './components/StockAdjustmentModal';
import BulkUpdateModal from './components/BulkUpdateModal';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import ProductDetailModal from './components/ProductDetailModal';
import InventoryAlertsPanel from './components/InventoryAlertsPanel';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const InventoryManagementPage = () => {
  const navigate = useNavigate();
  const { success, error, warning, info } = useGlobalToast();
  
  // ============================================
  // REFS
  // ============================================
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    totalCost: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalQuantity: 0,
    activeProducts: 0
  });

  // ============================================
  // DELETE MODAL STATE
  // ============================================
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // ============================================
  // FILTERS STATE
  // ============================================
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    stockStatus: 'all',
    category: 'all',
    vendor: 'all',
    minPrice: '',
    maxPrice: '',
    minQuantity: '',
    maxQuantity: '',
    lowStock: false,
    outOfStock: false,
    trackQuantity: 'all',
    allowBackorder: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    dateFrom: '',
    dateTo: ''
  });

  // ============================================
  // MODALS STATE
  // ============================================
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

  // ============================================
  // CATEGORIES & VENDORS
  // ============================================
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // ============================================
  // MOUNTED CHECK
  // ============================================
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ============================================
  // FETCH PRODUCTS
  // ============================================
  const fetchProducts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.status = filters.status;
      
      if (filters.stockStatus !== 'all') {
        if (filters.stockStatus === 'in_stock') params.minQuantity = 1;
        if (filters.stockStatus === 'out_of_stock') params.maxQuantity = 0;
        if (filters.stockStatus === 'low_stock') params.lowStock = true;
      }

      if (filters.category !== 'all') params.category = filters.category;
      if (filters.vendor !== 'all') params.vendor = filters.vendor;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minQuantity) params.minQuantity = filters.minQuantity;
      if (filters.maxQuantity) params.maxQuantity = filters.maxQuantity;
      if (filters.lowStock) params.lowStock = true;
      if (filters.outOfStock) params.outOfStock = true;
      if (filters.trackQuantity !== 'all') params.trackQuantity = filters.trackQuantity === 'true';
      if (filters.allowBackorder !== 'all') params.allowBackorder = filters.allowBackorder === 'true';

      const response = await api.products.getAll(params);
      
      if (!isMounted.current) return;

      let productsData = [];
      let pagination = {};

      if (response?.data?.data) {
        productsData = response.data.data;
        pagination = response.data.pagination || {};
      } else if (response?.data) {
        productsData = Array.isArray(response.data) ? response.data : [];
        pagination = response.pagination || {};
      }

      setProducts(productsData);
      setFilteredProducts(productsData);
      setTotalItems(pagination.total || productsData.length);
      setTotalPages(pagination.pages || Math.ceil(productsData.length / itemsPerPage));

    } catch (err) {
      console.error('Error fetching products:', err);
      if (isMounted.current) {
        error('Failed to load products');
      }
    } finally {
      if (isMounted.current && showRefreshing) {
        setRefreshing(false);
      }
    }
  }, [currentPage, itemsPerPage, filters, error]);

  // ============================================
  // FETCH STATS
  // ============================================
  const fetchStats = useCallback(async () => {
    try {
      // Check if the method exists before calling
      if (typeof api.products.getInventorySummary !== 'function') {
        console.warn('getInventorySummary method not available');
        return;
      }
      
      const response = await api.products.getInventorySummary();
      if (response?.data && isMounted.current) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // ============================================
  // FETCH CATEGORIES
  // ============================================
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.categories.getAll({ limit: 100 });
      if (response?.data?.data && isMounted.current) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // ============================================
  // FETCH VENDORS
  // ============================================
  const fetchVendors = useCallback(async () => {
    try {
      const response = await api.vendors.all({ limit: 100 });
      if (response?.data?.data && isMounted.current) {
        setVendors(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  }, []);

  // ============================================
  // FETCH ALERTS - FIXED WITH BETTER ERROR HANDLING
  // ============================================
  const fetchAlerts = useCallback(async () => {
    if (alertsLoading) return;
    
    setAlertsLoading(true);
    try {
      const allAlerts = [];
      
      // Try to fetch low stock products, but don't fail if endpoint doesn't exist
      try {
        const lowStockResponse = await api.products.getLowStock?.({ limit: 50 });
        if (lowStockResponse?.data) {
          const lowStockData = Array.isArray(lowStockResponse.data) 
            ? lowStockResponse.data 
            : lowStockResponse.data?.data || [];
          
          allAlerts.push(...lowStockData.map(p => ({ 
            ...p, 
            severity: 'warning', 
            type: 'low_stock' 
          })));
        }
      } catch (lowStockErr) {
        console.log('Low stock endpoint not available yet');
        // Generate mock low stock data from products
        const mockLowStock = products
          .filter(p => p.quantity > 0 && p.quantity <= (p.lowStockThreshold || 5))
          .slice(0, 10)
          .map(p => ({ ...p, severity: 'warning', type: 'low_stock' }));
        allAlerts.push(...mockLowStock);
      }

      // Try to fetch out of stock products
      try {
        const outOfStockResponse = await api.products.getOutOfStock?.({ limit: 50 });
        if (outOfStockResponse?.data) {
          const outOfStockData = Array.isArray(outOfStockResponse.data) 
            ? outOfStockResponse.data 
            : outOfStockResponse.data?.data || [];
          
          allAlerts.push(...outOfStockData.map(p => ({ 
            ...p, 
            severity: 'critical', 
            type: 'out_of_stock' 
          })));
        }
      } catch (outOfStockErr) {
        console.log('Out of stock endpoint not available yet');
        // Generate mock out of stock data from products
        const mockOutOfStock = products
          .filter(p => p.quantity === 0)
          .slice(0, 10)
          .map(p => ({ ...p, severity: 'critical', type: 'out_of_stock' }));
        allAlerts.push(...mockOutOfStock);
      }

      // Remove duplicates based on product ID
      const uniqueAlerts = allAlerts.filter((alert, index, self) =>
        index === self.findIndex(a => a._id === alert._id)
      );

      if (isMounted.current) {
        setAlerts(uniqueAlerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      if (isMounted.current) {
        setAlertsLoading(false);
      }
    }
  }, [alertsLoading, products]);

  // ============================================
  // FETCH INVENTORY SUMMARY (FALLBACK)
  // ============================================
  const calculateStatsFromProducts = useCallback(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.cost || 0) * (p.quantity || 0), 0);
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= (p.lowStockThreshold || 5)).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const activeProducts = products.filter(p => p.status === 'active').length;

    setStats({
      totalProducts,
      totalValue,
      totalCost,
      lowStockCount,
      outOfStockCount,
      totalQuantity,
      activeProducts
    });
  }, [products]);

  // ============================================
  // INITIAL LOAD - RUN ONCE
  // ============================================
  useEffect(() => {
    if (initialFetchDone.current) return;
    
    initialFetchDone.current = true;
    
    const loadInitialData = async () => {
      setInitialLoading(true);
      try {
        await fetchProducts(false);
        
        // Try to fetch stats, fallback to calculation
        try {
          await fetchStats();
        } catch (statsErr) {
          console.log('Stats endpoint not available, calculating from products');
          calculateStatsFromProducts();
        }
        
        // Fetch categories and vendors
        await Promise.allSettled([
          fetchCategories(),
          fetchVendors()
        ]);
        
        // Fetch alerts after products are loaded
        await fetchAlerts();
        
      } catch (err) {
        console.error('Error in initial load:', err);
      } finally {
        if (isMounted.current) {
          setInitialLoading(false);
        }
      }
    };

    loadInitialData();
  }, []); // Empty deps - runs once on mount

  // ============================================
  // UPDATE STATS WHEN PRODUCTS CHANGE
  // ============================================
  useEffect(() => {
    if (!initialLoading && products.length > 0) {
      calculateStatsFromProducts();
    }
  }, [products, initialLoading, calculateStatsFromProducts]);

  // ============================================
  // REFRESH ALL DATA
  // ============================================
  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProducts(false);
      calculateStatsFromProducts();
      await fetchAlerts();
      info('Data refreshed');
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts, fetchAlerts, info, calculateStatsFromProducts]);

  // ============================================
  // HANDLE FILTER CHANGES
  // ============================================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      handleFilterChange('search', value);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      stockStatus: 'all',
      category: 'all',
      vendor: 'all',
      minPrice: '',
      maxPrice: '',
      minQuantity: '',
      maxQuantity: '',
      lowStock: false,
      outOfStock: false,
      trackQuantity: 'all',
      allowBackorder: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
    success('Filters reset');
  };

  // ============================================
  // SELECTION HANDLERS
  // ============================================
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // ============================================
  // STOCK ADJUSTMENT
  // ============================================
  const handleStockAdjust = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const handleStockAdjustSubmit = async (data) => {
    try {
      await api.products.updateStock(data.productId, {
        quantity: data.quantity,
        operation: data.operation,
        reason: data.reason
      });

      success(`Stock updated successfully`);
      await Promise.all([
        fetchProducts(false),
        fetchStats()
      ]);
      setShowStockModal(false);
    } catch (err) {
      console.error('Error updating stock:', err);
      error('Failed to update stock');
    }
  };

  // ============================================
  // BULK UPDATE
  // ============================================
  const handleBulkUpdate = async (data) => {
    try {
      await api.products.bulkUpdate({
        productIds: selectedProducts,
        ...data
      });

      success(`Updated ${selectedProducts.length} products successfully`);
      setSelectedProducts([]);
      setShowBulkModal(false);
      await Promise.all([
        fetchProducts(false),
        fetchStats()
      ]);
    } catch (err) {
      console.error('Error in bulk update:', err);
      error('Failed to update products');
    }
  };

  // ============================================
  // EXPORT HANDLER
  // ============================================
  const handleExport = async (options) => {
    try {
      const response = await api.products.bulkExport({
        ...options,
        ids: selectedProducts.length > 0 ? selectedProducts : undefined
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.${options.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      success('Export completed successfully');
      setShowExportModal(false);
    } catch (err) {
      console.error('Error exporting data:', err);
      error('Failed to export data');
    }
  };

  // ============================================
  // IMPORT HANDLER
  // ============================================
  const handleImport = async (file, options) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      const response = await api.products.bulkImport(formData);
      
      if (response.data?.success) {
        success(`Import completed: ${response.data.processed} products processed`);
        await refreshAllData();
        setShowImportModal(false);
      }
    } catch (err) {
      console.error('Error importing data:', err);
      error('Failed to import data');
    }
  };

  // ============================================
  // VIEW PRODUCT DETAILS
  // ============================================
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // ============================================
  // EDIT PRODUCT
  // ============================================
  const handleEditProduct = (productId) => {
    navigate(`/products/edit/${productId}?tab=inventory`);
  };

  // ============================================
  // DELETE HANDLERS
  // ============================================
 const handleDeleteProduct = (product) => {
  setProductToDelete(product);
  setDeleteType('single');
  setShowDeleteModal(true);
};

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      warning('No products selected');
      return;
    }
    setDeleteType('bulk');
    setShowDeleteModal(true);
  };

const confirmDelete = async (data) => {
  console.log('🔍 Delete data received:', data);
  console.log('🔍 deleteType:', deleteType);
  console.log('🔍 productToDelete:', productToDelete);
  
  setDeleteLoading(true);
  setDeleteError(null);

  try {
    if (deleteType === 'single' && productToDelete) {
      // ✅ FIX: Handle both object and string ID
      let productId;
      let productName = 'Product';
      
      if (typeof productToDelete === 'object' && productToDelete !== null) {
        // It's an object with properties
        productId = productToDelete._id;
        productName = productToDelete.name || 'Product';
      } else {
        // It's just a string ID
        productId = productToDelete;
        productName = `Product (${productId.slice(-6)})`;
      }
      
      console.log('🔍 Extracted product ID:', productId);
      
      if (!productId) {
        console.error('❌ Could not extract product ID from:', productToDelete);
        throw new Error('Product ID not found');
      }
      
      await api.products.delete(productId, { 
        reason: data?.reason || 'Deleted from inventory management',
        permanent: data?.permanent || false
      });
      
      success(`Product "${productName}" deleted successfully`);
      
    } else if (deleteType === 'bulk') {
      console.log('🔍 Bulk delete - selected products:', selectedProducts);
      
      if (!selectedProducts || selectedProducts.length === 0) {
        console.error('❌ No products selected for bulk delete');
        throw new Error('No products selected');
      }
      
      await api.products.bulkDelete(selectedProducts, { 
        reason: data?.reason || 'Bulk delete from inventory',
        permanent: data?.permanent || false
      });
      
      success(`${selectedProducts.length} products deleted successfully`);
      setSelectedProducts([]);
    }

    setShowDeleteModal(false);
    await Promise.all([
      fetchProducts(false),
      fetchStats(),
      fetchAlerts()
    ]);
    
  } catch (err) {
    console.error('❌ Error in confirmDelete:', err);
    console.error('❌ Error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    setDeleteError(err.message || 'Failed to delete. Please try again.');
    error('Failed to delete');
  } finally {
    setDeleteLoading(false);
  }
};

  // ============================================
  // RENDER
  // ============================================
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FiPackage className="w-6 h-6 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
              <div className="ml-4 flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                  {totalItems} Products
                </span>
                {stats.lowStockCount > 0 && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full flex items-center">
                    <FiAlertCircle className="w-3 h-3 mr-1" />
                    {stats.lowStockCount} Low Stock
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Alerts Button */}
              <button
                onClick={() => setShowAlertsPanel(!showAlertsPanel)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <FiBell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={refreshAllData}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 relative"
                title="Refresh"
              >
                <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Import Button */}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <FiUpload className="w-4 h-4 mr-2" />
                Import
              </button>

              {/* Export Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export
              </button>

              {/* Bulk Actions */}
              {selectedProducts.length > 0 && (
                <>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedProducts.length})
                  </button>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    <FiSettings className="w-4 h-4 mr-2" />
                    Update ({selectedProducts.length})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      <AnimatePresence>
        {showAlertsPanel && (
          <InventoryAlertsPanel
            alerts={alerts}
            onClose={() => setShowAlertsPanel(false)}
            onViewProduct={handleViewProduct}
            onAdjustStock={handleStockAdjust}
            onRefresh={fetchAlerts}
            loading={alertsLoading}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <InventoryStats stats={stats} />

        {/* Filters */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <FiFilter className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-sm font-medium text-gray-700">Filters</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or description..."
                defaultValue={filters.search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <InventoryFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
                categories={categories}
                vendors={vendors}
              />
            )}
          </AnimatePresence>

          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiList className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiGrid className="w-5 h-5" />
              </button>
            </div>
            <span className="text-sm text-gray-600">{filteredProducts.length} products</span>
          </div>
        </div>

        {/* Products */}
        <div className="mt-6 relative">
          {/* Overlay loader for refreshes */}
          {refreshing && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="bg-white px-6 py-3 rounded-lg shadow-lg flex items-center">
                <FiRefreshCw className="w-5 h-5 text-indigo-600 animate-spin mr-3" />
                <span className="text-sm text-gray-600">Refreshing...</span>
              </div>
            </div>
          )}

          {viewMode === 'table' ? (
            <InventoryTable
              products={filteredProducts}
              selectedProducts={selectedProducts}
              onSelectAll={handleSelectAll}
              onSelectProduct={handleSelectProduct}
              onView={handleViewProduct}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onStockAdjust={handleStockAdjust}
            />
          ) : (
            <InventoryCards
              products={filteredProducts}
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              onView={handleViewProduct}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onStockAdjust={handleStockAdjust}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && !refreshing && (
          <div className="text-center py-12">
            <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-500 mb-6">
              Try adjusting your filters or add new products
            </p>
            <button
              onClick={() => navigate('/products/create')}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add New Product
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        type={deleteType}
        product={productToDelete}
        selectedCount={selectedProducts.length}
        loading={deleteLoading}
        error={deleteError}
      />

      <StockAdjustmentModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onSubmit={handleStockAdjustSubmit}
        product={selectedProduct}
      />

      <BulkUpdateModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={handleBulkUpdate}
        selectedCount={selectedProducts.length}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        selectedCount={selectedProducts.length}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <ProductDetailModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={selectedProduct}
        onEdit={handleEditProduct}
        onStockAdjust={handleStockAdjust}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
};

export default InventoryManagementPage;