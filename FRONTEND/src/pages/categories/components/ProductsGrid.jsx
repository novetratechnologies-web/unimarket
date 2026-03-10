// components/shared/ProductsGrid.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  LayoutList, 
  ArrowUpDown,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ProductCard from '../../../components/shared/ProductCard';

const ProductsGrid = ({
  // Core props
  products = [],
  totalProducts = 0,
  isLoading = false,
  
  // View options
  viewMode = 'grid',
  onViewModeChange,
  
  // Sort options
  sortBy = 'popular',
  onSortChange,
  sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
  ],
  
  // Pagination
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 12,
  
  // Wishlist
  wishlist = [],
  onToggleWishlist,
  
  // Empty state
  emptyTitle = 'No Products Found',
  emptyMessage = 'Try adjusting your filters or browse other categories',
  emptyActionText = 'Clear Filters',
  onEmptyAction,
  
  // Display options
  showToolbar = true,
  showViewToggle = true,
  showSort = true,
  showPagination = true,
  showProductCount = true,
  
  // Grid layout
  gridCols = {
    default: 1,
    sm: 2,
    lg: 3,
    xl: 3
  },
  
  // Animation
  staggerDelay = 0.05,
  
  // Custom class names
  className = '',
  toolbarClassName = '',
  gridClassName = '',
  emptyClassName = '',
}) => {
  const navigate = useNavigate();

  // Generate grid columns class
  const getGridColsClass = () => {
    return `grid-cols-${gridCols.default} sm:grid-cols-${gridCols.sm} lg:grid-cols-${gridCols.lg} ${gridCols.xl ? `xl:grid-cols-${gridCols.xl}` : ''}`;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`grid ${getGridColsClass()} gap-6 ${className}`}>
        {[...Array(itemsPerPage)].map((_, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      {showToolbar && (showViewToggle || showSort || showProductCount) && (
        <div className={`bg-white rounded-2xl shadow-lg p-4 mb-6 ${toolbarClassName}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left section - Product count and view toggle */}
            <div className="flex items-center gap-4">
              {showProductCount && (
                <span className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">
                    {products.length}
                  </span> of{' '}
                  <span className="font-semibold text-gray-900">
                    {totalProducts}
                  </span> products
                  {totalProducts > products.length && (
                    <span className="text-xs text-gray-400 ml-1">
                      (filtered)
                    </span>
                  )}
                </span>
              )}
              
              {/* View Toggle */}
              {showViewToggle && onViewModeChange && (
                <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
                  <button
                    onClick={() => onViewModeChange('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-teal-50 text-teal-600'
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-teal-50 text-teal-600'
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`}
                    aria-label="List view"
                  >
                    <LayoutList className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            {showSort && onSortChange && (
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm cursor-pointer w-full sm:w-auto"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {products.length > 0 ? (
        <>
          <motion.div
            layout
            className={`${
              viewMode === 'grid'
                ? `grid ${getGridColsClass()} gap-6 ${gridClassName}`
                : 'space-y-4'
            }`}
          >
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * staggerDelay }}
                onClick={() => navigate(`/product/${product.slug}`)}
                className={viewMode === 'list' ? 'cursor-pointer' : ''}
              >
                <ProductCard
                  product={product}
                  viewMode={viewMode}
                  isWishlisted={wishlist.includes(product._id)}
                  onToggleWishlist={onToggleWishlist}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {showPagination && totalPages > 1 && onPageChange && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Empty State
        <div className={`text-center py-16 bg-white rounded-2xl shadow-lg ${emptyClassName}`}>
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyTitle}</h3>
          <p className="text-gray-600 mb-6">{emptyMessage}</p>
          {onEmptyAction && (
            <button
              onClick={onEmptyAction}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              {emptyActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsGrid;