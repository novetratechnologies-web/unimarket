// components/HeaderBottom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  Store, 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Loader2, 
  X,
  Grid,
  ChevronLeft,
  Sparkles,
  Zap,
  Percent,
  Gift,
  Heart,
  TrendingUp,
  Award,
  Clock,
  ShoppingBag,
  Headphones,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/index';
import CategoryDropdown from '../../category/CategoryDropdown'; 

const colors = {
  primary: {
    50: '#e6f7f5',
    100: '#ccefeb',
    200: '#99dfd7',
    300: '#66cfc3',
    400: '#33bfaf',
    500: '#00af9b',
    600: '#008c7c',
    700: '#00695d',
    800: '#00463e',
    900: '#00231f',
  }
};

const HeaderBottom = () => {
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [mobileView, setMobileView] = useState('main'); // 'main', 'categories'
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const categoriesMenuRef = useRef(null);
  const helpDropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Fetch categories from backend
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'menu'],
    queryFn: async () => {
      console.log('📡 Fetching categories for menu...');
      try {
        const response = await api.categories.getMenuCategories();
        console.log('✅ Categories loaded:', response?.data?.length || 0);
        return response?.data || [];
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });

  // Close dropdowns when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth >= 1024) {
        if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target)) {
          setIsCategoriesMenuOpen(false);
          setActiveCategory(null);
        }
        if (helpDropdownRef.current && !helpDropdownRef.current.contains(event.target)) {
          setIsHelpOpen(false);
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
        setHoveredCategory(null);
        setActiveCategory(null);
      }, 200);
    }
  };

  // Get icon based on category
  const getCategoryIcon = (category) => {
    if (category.iconImage) {
      return <img src={category.iconImage} alt={category.name} className="w-5 h-5 object-contain" />;
    }
    if (category.icon) {
      return <i className={`${category.icon} text-gray-600`} />;
    }
    return <Package className="w-5 h-5 text-gray-600" />;
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

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    if (isCategoriesMenuOpen) {
      setIsCategoriesMenuOpen(false);
      setMobileView('main');
    } else {
      setIsCategoriesMenuOpen(true);
      setMobileView('categories');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <nav className="bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                <div className="relative flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Loading categories...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left Section - Categories & Navigation */}
          <div className="flex items-center gap-4">
            {/* Desktop: Use CategoryDropdown component */}
            <div className="hidden lg:block">
              <CategoryDropdown />
            </div>

            {/* Mobile: Store Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 font-medium backdrop-blur-sm"
            >
              <Store className="w-5 h-5" />
              <span>Shop</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Category Links */}
            <div className="hidden lg:flex items-center gap-1">
              {categories.slice(0, 6).map((category, index) => (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  className="relative group px-3 py-2 text-white/90 hover:text-white rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  <span className="relative z-10">{category.name}</span>
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-lg transition-all duration-200"></span>
                </Link>
              ))}
              {categories.length > 6 && (
                <button
                  onClick={() => setIsCategoriesMenuOpen(true)}
                  className="relative group px-3 py-2 text-white/90 hover:text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-1"
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3" />
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-lg transition-all duration-200"></span>
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Help & Support */}
          <div className="flex items-center gap-3">
            {/* Help Dropdown */}
            <div className="relative hidden lg:block" ref={helpDropdownRef}>
              <button
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                className="flex items-center gap-2 px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Headphones className="w-4 h-4" />
                <span className="text-sm">Help</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isHelpOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isHelpOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Customer Support</p>
                      <p className="text-xs text-gray-500 mt-1">We're here 24/7 to help you</p>
                    </div>
                    <Link
                      to="/contact"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsHelpOpen(false)}
                    >
                      <Phone className="w-4 h-4 text-teal-600" />
                      <div>
                        <p className="text-sm font-medium">Contact Us</p>
                        <p className="text-xs text-gray-500">Get in touch with our team</p>
                      </div>
                    </Link>
                    <Link
                      to="/faq"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsHelpOpen(false)}
                    >
                      <Mail className="w-4 h-4 text-teal-600" />
                      <div>
                        <p className="text-sm font-medium">FAQ</p>
                        <p className="text-xs text-gray-500">Find answers quickly</p>
                      </div>
                    </Link>
                    <Link
                      to="/track-order"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsHelpOpen(false)}
                    >
                      <MapPin className="w-4 h-4 text-teal-600" />
                      <div>
                        <p className="text-sm font-medium">Track Order</p>
                        <p className="text-xs text-gray-500">Follow your package</p>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <button className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 relative">
                <Heart className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-medium">
                  3
                </span>
              </button>
              <button className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Indicator */}
            <span className="lg:hidden text-sm font-medium text-white/80">Menu</span>
          </div>
        </div>
      </div>

      {/* Mobile Categories Menu - Full Screen Overlay */}
      <AnimatePresence>
        {isCategoriesMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            {/* Mobile Menu Header */}
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-500 text-white p-4 shadow-lg z-10">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (activeCategory) {
                      setActiveCategory(null);
                    } else {
                      setIsCategoriesMenuOpen(false);
                      setMobileView('main');
                    }
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {activeCategory ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </button>
                <h2 className="text-lg font-semibold">
                  {activeCategory ? activeCategory.name : 'Shop by Category'}
                </h2>
                <div className="w-10"></div>
              </div>
            </div>

            {/* Mobile Menu Content */}
            <div className="p-4">
              {!activeCategory ? (
                <div className="space-y-3">
                  {/* Categories List */}
                  <div className="space-y-2">
                    {categories.map((category, index) => (
                      <button
                        key={category._id}
                        onClick={() => setActiveCategory(category)}
                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-teal-200 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryGradient(index)} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                            {getCategoryIcon(category)}
                          </div>
                          <div className="text-left">
                            <span className="font-medium text-gray-900">{category.name}</span>
                            {category.productCount > 0 && (
                              <p className="text-xs text-gray-500 mt-0.5">{category.productCount} products</p>
                            )}
                          </div>
                        </div>
                        {category.children?.length > 0 && (
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Quick Links for Mobile */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                      Quick Links
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-left hover:shadow-md transition-all group">
                        <Sparkles className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">New Arrivals</span>
                      </button>
                      <button className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl text-left hover:shadow-md transition-all group">
                        <Zap className="w-5 h-5 text-orange-600 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">Best Sellers</span>
                      </button>
                      <button className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-left hover:shadow-md transition-all group">
                        <Percent className="w-5 h-5 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">Special Offers</span>
                      </button>
                      <button className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl text-left hover:shadow-md transition-all group">
                        <Gift className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-700">Gift Ideas</span>
                      </button>
                    </div>
                  </div>

                  {/* Help Section for Mobile */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                      Support
                    </h3>
                    <div className="space-y-2">
                      <Link
                        to="/contact"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
                        onClick={() => setIsCategoriesMenuOpen(false)}
                      >
                        <Phone className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-gray-700">Contact Us</span>
                      </Link>
                      <Link
                        to="/faq"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
                        onClick={() => setIsCategoriesMenuOpen(false)}
                      >
                        <Headphones className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-gray-700">FAQ</span>
                      </Link>
                      <Link
                        to="/track-order"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors"
                        onClick={() => setIsCategoriesMenuOpen(false)}
                      >
                        <MapPin className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-gray-700">Track Order</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                // Subcategories View
                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(categories.findIndex(c => c._id === activeCategory._id))} flex items-center justify-center text-white shadow-md`}>
                        {getCategoryIcon(activeCategory)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{activeCategory.name}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{activeCategory.productCount || 0} products</p>
                      </div>
                    </div>
                    <Link
                      to={`/category/${activeCategory.slug}`}
                      className="block w-full py-2.5 bg-white text-teal-600 rounded-lg font-medium text-sm hover:bg-teal-50 transition-colors text-center shadow-sm"
                      onClick={() => setIsCategoriesMenuOpen(false)}
                    >
                      View All {activeCategory.name}
                    </Link>
                  </div>

                  {/* Subcategories */}
                  {activeCategory.children?.map((subcat, idx) => (
                    <div key={subcat._id} className="bg-white border border-gray-100 rounded-xl p-3 hover:border-teal-200 transition-colors">
                      <Link
                        to={`/category/${subcat.slug}`}
                        className="flex items-center justify-between mb-2 px-2 group"
                        onClick={() => setIsCategoriesMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {getCategoryIcon(subcat)}
                          </div>
                          <span className="font-medium text-gray-900">{subcat.name}</span>
                        </div>
                        {subcat.productCount > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {subcat.productCount}
                          </span>
                        )}
                      </Link>
                      {subcat.children?.length > 0 && (
                        <div className="pl-10 mt-2 space-y-2 border-l-2 border-teal-100">
                          {subcat.children.map((thirdLevel) => (
                            <Link
                              key={thirdLevel._id}
                              to={`/category/${thirdLevel.slug}`}
                              className="flex items-center justify-between px-2 py-1.5 text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors group"
                              onClick={() => setIsCategoriesMenuOpen(false)}
                            >
                              <span>{thirdLevel.name}</span>
                              {thirdLevel.productCount > 0 && (
                                <span className="text-xs text-gray-400 group-hover:text-teal-600">
                                  {thirdLevel.productCount}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Categories Mega Menu (Fallback) */}
      <AnimatePresence>
        {isCategoriesMenuOpen && window.innerWidth >= 1024 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 mt-1 bg-white shadow-2xl border-t border-gray-200 z-40"
            ref={categoriesMenuRef}
          >
            <div className="max-w-7xl mx-auto px-8 py-8">
              {/* Categories Grid */}
              <div className="grid grid-cols-5 gap-8">
                {categories.map((category, index) => (
                  <div key={category._id} className="space-y-3">
                    <Link
                      to={`/category/${category.slug}`}
                      className="flex items-center gap-2 font-semibold text-gray-900 hover:text-teal-600 transition-colors group"
                      onClick={() => setIsCategoriesMenuOpen(false)}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryGradient(index)} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        {getCategoryIcon(category)}
                      </div>
                      <span>{category.name}</span>
                    </Link>
                    {category.children?.length > 0 && (
                      <div className="pl-10 space-y-2">
                        {category.children.slice(0, 5).map((subcat) => (
                          <Link
                            key={subcat._id}
                            to={`/category/${subcat.slug}`}
                            className="block text-sm text-gray-600 hover:text-teal-600 transition-colors"
                            onClick={() => setIsCategoriesMenuOpen(false)}
                          >
                            {subcat.name}
                          </Link>
                        ))}
                        {category.children.length > 5 && (
                          <Link
                            to={`/category/${category.slug}`}
                            className="block text-sm text-teal-600 hover:text-teal-700 font-medium mt-1"
                            onClick={() => setIsCategoriesMenuOpen(false)}
                          >
                            +{category.children.length - 5} more
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{categories.reduce((acc, cat) => acc + (cat.productCount || 0), 0)}</span> products
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{categories.length}</span> categories
                  </span>
                </div>
                <Link
                  to="/categories"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
                  onClick={() => setIsCategoriesMenuOpen(false)}
                >
                  Browse All Categories
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default HeaderBottom;