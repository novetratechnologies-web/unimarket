// pages/categories/CategoryPage.jsx
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/index';
import { SlidersHorizontal } from 'lucide-react';

// Import components
import CategoryBanner from './components/CategoryBanner';
import FilterSidebar from './components/FilterSidebar';
import ProductsGrid from './components/ProductsGrid';
import MobileFilterModal from './components/MobileFilterModal';
import CategorySkeleton from './components/CategorySkeleton';
import { categoryIcons } from '../../constants/categoryIcons';

const CategoryPage = () => {
  const { '*' : slug } = useParams();
  const navigate = useNavigate();
  
  // State
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [sortBy, setSortBy] = useState('popular');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState([]);

  // Fetch category data with products
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const response = await api.categories.getCategoryBySlug(slug, { 
        includeProducts: true,
        productLimit: 100
      });
      return response?.data;
    }
  });

  // Fetch breadcrumb
  const { data: breadcrumb = [] } = useQuery({
    queryKey: ['breadcrumb', slug],
    queryFn: async () => {
      const response = await api.categories.getBreadcrumb(slug);
      return response?.data || [];
    },
    enabled: !!slug
  });

  // Get min and max price from products
  const priceRangeLimits = useMemo(() => {
    if (!category?.products?.length) return { min: 0, max: 10000 };
    
    const prices = category.products.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [category?.products]);

  // Get unique filter options from category attributes
  const filterOptions = useMemo(() => {
    if (!category?.attributes) return {};
    
    const options = {};
    category.attributes.forEach(attr => {
      if (attr.isFilterable && attr.options) {
        options[attr.name] = attr.options.map(opt => ({
          ...opt,
          count: category.products?.filter(p => 
            p.attributes?.[attr.name] === opt.value
          ).length || 0
        }));
      }
    });
    return options;
  }, [category]);

  // Get available brands from products
  const brands = useMemo(() => {
    if (!category?.products) return [];
    
    const brandCount = {};
    category.products.forEach(product => {
      if (product.brand) {
        brandCount[product.brand] = (brandCount[product.brand] || 0) + 1;
      }
    });
    
    return Object.entries(brandCount).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
  }, [category?.products]);

  // Get available conditions
  const conditions = useMemo(() => {
    if (!category?.products) return [];
    
    const conditionCount = {};
    category.products.forEach(product => {
      const condition = product.condition || 'New';
      conditionCount[condition] = (conditionCount[condition] || 0) + 1;
    });
    
    return Object.entries(conditionCount).map(([name, count]) => ({
      name,
      count
    }));
  }, [category?.products]);

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterName]: prev[filterName] === value ? null : value
    }));
    setCurrentPage(1);
  };

  // Handle price range change
  const handlePriceChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: Number(value)
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({});
    setPriceRange({ min: priceRangeLimits.min, max: priceRangeLimits.max });
    setSortBy('popular');
    setCurrentPage(1);
  };

  // Toggle wishlist
  const toggleWishlist = (productId, e) => {
    e.stopPropagation();
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!category?.products) return [];

    let filtered = [...category.products];

    // Apply price filter
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Apply brand filter
    if (selectedFilters.brand) {
      filtered = filtered.filter(product => 
        product.brand === selectedFilters.brand
      );
    }

    // Apply condition filter
    if (selectedFilters.condition) {
      filtered = filtered.filter(product => 
        (product.condition || 'New') === selectedFilters.condition
      );
    }

    // Apply attribute filters
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value && !['brand', 'condition'].includes(key)) {
        filtered = filtered.filter(product => 
          product.attributes?.[key] === value
        );
      }
    });

    // Apply sorting
    switch(sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default: // popular
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return filtered;
  }, [category?.products, selectedFilters, priceRange, sortBy]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (categoryLoading) {
    return <CategorySkeleton />;
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <CategoryBanner 
        category={category}
        breadcrumb={breadcrumb}
        categoryIcons={categoryIcons}
        onNavigate={navigate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters & Sorting</span>
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              priceRange={priceRange}
              priceRangeLimits={priceRangeLimits}
              onPriceChange={handlePriceChange}
              filterOptions={filterOptions}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              brands={brands}
              conditions={conditions}
              subcategories={category.subcategories}
              onSubcategoryClick={(slug) => navigate(`/category/${slug}`)}
              onClearFilters={clearFilters}
              categoryIcons={categoryIcons}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <ProductsGrid
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortBy={sortBy}
              setSortBy={setSortBy}
              paginatedProducts={paginatedProducts}
              filteredCount={filteredProducts.length}
              totalCount={category.products?.length || 0}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <MobileFilterModal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        priceRange={priceRange}
        priceRangeLimits={priceRangeLimits}
        onPriceChange={handlePriceChange}
        filterOptions={filterOptions}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        brands={brands}
        conditions={conditions}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </div>
  );
};

export default CategoryPage;