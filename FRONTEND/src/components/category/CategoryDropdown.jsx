// components/CategoryDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Store, 
  Loader2,
  Grid,
  Package,
  Star,
  TrendingUp,
  Award,
  Clock,
  X,
  Sparkles,
  Zap,
  ShoppingBag,
  Gift,
  Percent,
  Headphones,
  Laptop,
  Shirt,
  Home,
  BookOpen,
  Dumbbell,
  Gamepad2,
  Coffee,
  Watch,
  Camera,
  Car,
  Heart,
  Palette,
  Music,
  Smartphone,
  ChevronLeft
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/index';

// Modern category icons mapping
const categoryIcons = {
  electronics: <Laptop className="w-5 h-5" />,
  smartphones: <Smartphone className="w-5 h-5" />,
  computers: <Laptop className="w-5 h-5" />,
  gaming: <Gamepad2 className="w-5 h-5" />,
  cameras: <Camera className="w-5 h-5" />,
  fashion: <Shirt className="w-5 h-5" />,
  clothing: <Shirt className="w-5 h-5" />,
  shoes: <Watch className="w-5 h-5" />,
  accessories: <Watch className="w-5 h-5" />,
  home: <Home className="w-5 h-5" />,
  furniture: <Home className="w-5 h-5" />,
  kitchen: <Coffee className="w-5 h-5" />,
  books: <BookOpen className="w-5 h-5" />,
  textbooks: <BookOpen className="w-5 h-5" />,
  sports: <Dumbbell className="w-5 h-5" />,
  fitness: <Dumbbell className="w-5 h-5" />,
  automotive: <Car className="w-5 h-5" />,
  toys: <Gamepad2 className="w-5 h-5" />,
  music: <Music className="w-5 h-5" />,
  art: <Palette className="w-5 h-5" />,
  beauty: <Sparkles className="w-5 h-5" />,
  health: <Heart className="w-5 h-5" />,
  gifts: <Gift className="w-5 h-5" />,
  deals: <Percent className="w-5 h-5" />,
  default: <Package className="w-5 h-5" />
};

const CategoryDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [mobileView, setMobileView] = useState('main');
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Fetch categories from backend
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'menu'],
    queryFn: async () => {
      console.log('📡 Fetching categories for menu...');
      const response = await api.categories.getMenuCategories();
      console.log('✅ Categories received:', response?.data);
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000,
    retry: 2
  });

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth >= 1024) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
          setActiveCategory(null);
          setHoveredCategory(null);
          setHoveredSubcategory(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle hover with delay for desktop
  const handleCategoryHover = (category) => {
    if (window.innerWidth >= 1024) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setHoveredCategory(category);
      setActiveCategory(category);
    }
  };

  const handleCategoryLeave = () => {
    if (window.innerWidth >= 1024) {
      timeoutRef.current = setTimeout(() => {
        if (!hoveredSubcategory) {
          setHoveredCategory(null);
          setActiveCategory(null);
        }
      }, 200);
    }
  };

  const handleSubcategoryHover = (subcategory) => {
    if (window.innerWidth >= 1024) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setHoveredSubcategory(subcategory);
    }
  };

  const handleSubcategoryLeave = () => {
    if (window.innerWidth >= 1024) {
      setHoveredSubcategory(null);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Get icon based on category
  const getCategoryIcon = (category) => {
    if (category?.iconImage) {
      return (
        <div className="w-5 h-5 rounded overflow-hidden">
          <img src={category.iconImage} alt={category.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    
    const categoryName = category?.name?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (categoryName.includes(key)) {
        return React.cloneElement(icon, { className: 'w-5 h-5' });
      }
    }
    return React.cloneElement(categoryIcons.default, { className: 'w-5 h-5' });
  };

  // Get gradient color for category
  const getCategoryGradient = (index) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-amber-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
      'from-teal-500 to-green-500',
    ];
    return gradients[index % gradients.length];
  };

  // Recursive function to render category tree for mobile
  const renderCategoryTree = (category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category._id];

    return (
      <div key={category._id} className="border-b border-gray-100 last:border-0">
        <div className="flex items-center">
          <Link
            to={`/category/${category.slug}`}
            className="flex-1 flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {getCategoryIcon(category)}
            </div>
            <span className="font-medium">{category.name}</span>
            {category.productCount > 0 && (
              <span className="text-xs text-gray-500 ml-auto">
                {category.productCount}
              </span>
            )}
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleCategory(category._id)}
              className="p-3 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`} />
            </button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-6 pl-2 border-l-2 border-teal-100">
            {category.children.map(child => renderCategoryTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative">
        <button className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <Store className="w-5 h-5" />
          <span className="font-medium">Categories</span>
          <Loader2 className="w-4 h-4 animate-spin" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger - Modern Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-5 py-2.5 
          bg-gradient-to-r from-teal-600 to-teal-500 
          text-white rounded-xl shadow-lg 
          hover:shadow-xl hover:from-teal-700 hover:to-teal-600 
          transition-all duration-300 transform hover:scale-105
          ${isOpen ? 'shadow-xl from-teal-700 to-teal-600' : ''}
        `}
      >
        <Store className="w-5 h-5" />
        <span className="font-medium">Categories</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        {categories.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
            {categories.length}
          </span>
        )}
      </button>

      {/* Desktop Dropdown Menu */}
      <AnimatePresence>
        {isOpen && window.innerWidth >= 1024 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="absolute left-0 mt-3 w-[1000px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Shop by Category
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">
                Browse through our {categories.length} categories
              </p>
            </div>

            <div className="flex divide-x divide-gray-100">
              {/* Main Categories Column */}
              <div className="w-72 p-5 bg-gray-50/50 max-h-[600px] overflow-y-auto">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
                  All Categories
                </h4>
                <div className="space-y-1">
                  {categories.map((category, index) => (
                    <div
                      key={category._id}
                      onMouseEnter={() => handleCategoryHover(category)}
                      onMouseLeave={handleCategoryLeave}
                      className={`
                        group relative px-3 py-3 rounded-xl cursor-pointer 
                        transition-all duration-200
                        ${activeCategory?._id === category._id
                          ? 'bg-white shadow-md border border-teal-100'
                          : 'hover:bg-white hover:shadow-sm hover:border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryGradient(index)} flex items-center justify-center text-white`}>
                            {getCategoryIcon(category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 block truncate">
                              {category.name}
                            </span>
                            {category.productCount > 0 && (
                              <span className="text-xs text-gray-500">
                                {category.productCount} items
                              </span>
                            )}
                          </div>
                        </div>
                        {category.children?.length > 0 && (
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
                            activeCategory?._id === category._id ? 'translate-x-1 text-teal-600' : ''
                          }`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcategories Column */}
              <div className="flex-1 p-6 bg-white max-h-[600px] overflow-y-auto">
                {activeCategory ? (
                  <div>
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2 border-b">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryGradient(categories.findIndex(c => c._id === activeCategory._id))} flex items-center justify-center text-white`}>
                          {getCategoryIcon(activeCategory)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {activeCategory.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {activeCategory.productCount || 0} products available
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/category/${activeCategory.slug}`}
                        className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        View All
                      </Link>
                    </div>

                    {/* Subcategories Grid */}
                    {activeCategory.children && activeCategory.children.length > 0 ? (
                      <div className="grid grid-cols-2 gap-5">
                        {activeCategory.children.map((subcategory, idx) => (
                          <div
                            key={subcategory._id}
                            className="relative group"
                            onMouseEnter={() => handleSubcategoryHover(subcategory)}
                            onMouseLeave={handleSubcategoryLeave}
                          >
                            <div className="p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all duration-200">
                              <Link
                                to={`/category/${subcategory.slug}`}
                                className="block"
                                onClick={() => setIsOpen(false)}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {getCategoryIcon(subcategory)}
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-900 block">
                                      {subcategory.name}
                                    </span>
                                    {subcategory.productCount > 0 && (
                                      <span className="text-xs text-gray-500">
                                        {subcategory.productCount} items
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>

                              {/* Third level categories */}
                              {subcategory.children && subcategory.children.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <div className="space-y-1">
                                    {subcategory.children.slice(0, 4).map((thirdLevel) => (
                                      <Link
                                        key={thirdLevel._id}
                                        to={`/category/${thirdLevel.slug}`}
                                        className="block px-2 py-1.5 text-xs text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                        onClick={() => setIsOpen(false)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="truncate">{thirdLevel.name}</span>
                                          {thirdLevel.productCount > 0 && (
                                            <span className="text-xs text-gray-400">
                                              {thirdLevel.productCount}
                                            </span>
                                          )}
                                        </div>
                                      </Link>
                                    ))}
                                    {subcategory.children.length > 4 && (
                                      <Link
                                        to={`/category/${subcategory.slug}`}
                                        className="block px-2 py-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium"
                                        onClick={() => setIsOpen(false)}
                                      >
                                        +{subcategory.children.length - 4} more
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        No subcategories available
                      </div>
                    )}

                    {/* Category Banner */}
                    {activeCategory.image && (
                      <Link
                        to={`/category/${activeCategory.slug}`}
                        className="block mt-6 pt-6 border-t border-gray-200"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="relative h-36 rounded-xl overflow-hidden group">
                          <img 
                            src={activeCategory.image} 
                            alt={activeCategory.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center p-6">
                            <div>
                              <p className="text-white text-lg font-semibold">Shop {activeCategory.name}</p>
                              <p className="text-white/80 text-sm mt-1">
                                {activeCategory.productCount || 0} products available
                              </p>
                              <span className="inline-block mt-3 px-4 py-2 bg-white text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors">
                                Browse Collection →
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center mb-4">
                      <ShoppingBag className="w-10 h-10 text-teal-600" />
                    </div>
                    <p className="text-gray-700 font-medium mb-2">Select a category</p>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Choose a category from the left to view its subcategories and products
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-gray-600">
                    {categories.reduce((acc, cat) => acc + (cat.productCount || 0), 0)} products
                  </span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {categories.length} categories
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Dropdown Menu - Simplified Tree View */}
      <AnimatePresence>
        {isOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            {/* Mobile Header */}
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-500 text-white p-4 shadow-lg z-10">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold">All Categories</h2>
                <div className="w-10"></div>
              </div>
            </div>

            {/* Mobile Content - Tree View */}
            <div className="divide-y divide-gray-100">
              {categories.map(category => renderCategoryTree(category))}
            </div>

            {/* Quick Links */}
            <div className="p-4 mt-4 bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Quick Links
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/new-arrivals"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={() => setIsOpen(false)}
                >
                  <Sparkles className="w-5 h-5 text-purple-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700">New Arrivals</span>
                </Link>
                <Link
                  to="/best-sellers"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={() => setIsOpen(false)}
                >
                  <Zap className="w-5 h-5 text-orange-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Best Sellers</span>
                </Link>
                <Link
                  to="/offers"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={() => setIsOpen(false)}
                >
                  <Percent className="w-5 h-5 text-green-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Special Offers</span>
                </Link>
                <Link
                  to="/gifts"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={() => setIsOpen(false)}
                >
                  <Gift className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Gift Ideas</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryDropdown;