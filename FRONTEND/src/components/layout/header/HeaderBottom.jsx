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
  const [mobileNavStack, setMobileNavStack] = useState([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const categoriesMenuRef = useRef(null);
  const helpDropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Fetch categories from backend using tree endpoint
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      console.log('📡 Fetching category tree...');
      try {
        const response = await api.categories.getCategoryTree({ depth: 10 });
        return response?.data || [];
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
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
    if (category?.iconImage?.url) {
      return <img src={category.iconImage.url} alt={category.name} className="w-5 h-5 object-contain" />;
    }
    if (category?.icon) {
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

  // Mobile navigation handlers
  const handleMobileCategoryClick = (category) => {
    if (category.children && category.children.length > 0) {
      setMobileNavStack([...mobileNavStack, category]);
    } else {
      window.location.href = `/category/${category.slug}`;
      setIsCategoriesMenuOpen(false);
    }
  };

  const handleMobileBack = () => {
    setMobileNavStack(mobileNavStack.slice(0, -1));
  };

  const handleMobileViewAll = (category) => {
    window.location.href = `/category/${category.slug}`;
    setIsCategoriesMenuOpen(false);
  };

  // Get current mobile view data
  const getCurrentMobileView = () => {
    if (mobileNavStack.length === 0) {
      return {
        title: 'Shop by Category',
        items: categories,
        parent: null
      };
    } else {
      const currentCategory = mobileNavStack[mobileNavStack.length - 1];
      return {
        title: currentCategory.name,
        items: currentCategory.children || [],
        parent: currentCategory
      };
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    if (isCategoriesMenuOpen) {
      setIsCategoriesMenuOpen(false);
      setMobileNavStack([]);
    } else {
      setIsCategoriesMenuOpen(true);
      setMobileNavStack([]);
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

  const currentView = getCurrentMobileView();

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

            {/* Desktop Category Links - Using tree data */}
            <div className="hidden lg:flex items-center gap-1">
              {categories.slice(0, 6).map((category) => (
                <div
                  key={category._id}
                  className="relative group"
                  onMouseEnter={() => handleCategoryHover(category)}
                  onMouseLeave={handleCategoryLeave}
                >
                  <Link
                    to={`/category/${category.slug}`}
                    className="relative px-3 py-2 text-white/90 hover:text-white rounded-lg transition-all duration-200 font-medium text-sm inline-flex items-center gap-1"
                  >
                    <span>{category.name}</span>
                    {category.children?.length > 0 && (
                      <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform" />
                    )}
                  </Link>
                  
                  {/* Desktop Hover Dropdown for subcategories */}
                  {hoveredCategory?._id === category._id && category.children?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <Link
                          to={`/category/${category.slug}`}
                          className="text-sm font-semibold text-gray-900 hover:text-teal-600"
                          onClick={() => setIsCategoriesMenuOpen(false)}
                        >
                          View All {category.name}
                        </Link>
                      </div>
                      {category.children.map((subcat) => (
                        <div key={subcat._id} className="relative group/sub">
                          <Link
                            to={`/category/${subcat.slug}`}
                            className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                            onClick={() => setIsCategoriesMenuOpen(false)}
                          >
                            <span>{subcat.name}</span>
                            {subcat.children?.length > 0 && (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Link>
                          
                          {/* Third level dropdown */}
                          {subcat.children?.length > 0 && (
                            <div className="absolute left-full top-0 ml-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 hidden group-hover/sub:block">
                              {subcat.children.map((thirdLevel) => (
                                <Link
                                  key={thirdLevel._id}
                                  to={`/category/${thirdLevel.slug}`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                                  onClick={() => setIsCategoriesMenuOpen(false)}
                                >
                                  {thirdLevel.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
              {categories.length > 6 && (
                <button
                  onClick={() => setIsCategoriesMenuOpen(true)}
                  className="relative group px-3 py-2 text-white/90 hover:text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-1"
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Help & Support (unchanged) */}
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

      {/* Mobile Categories Menu - Updated with stack navigation */}
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
              <div className="flex items-center">
                {mobileNavStack.length > 0 && (
                  <button
                    onClick={handleMobileBack}
                    className="p-2 mr-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 mr-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold flex-1">{currentView.title}</h2>
                {currentView.parent && (
                  <button
                    onClick={() => handleMobileViewAll(currentView.parent)}
                    className="px-3 py-1.5 bg-white/20 rounded-lg text-sm font-medium"
                  >
                    View All
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Content */}
            <div className="p-4">
              <div className="space-y-2">
                {currentView.items.map((item, index) => (
                  <div
                    key={item._id}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-teal-200 transition-colors"
                  >
                    <button
                      onClick={() => handleMobileCategoryClick(item)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryGradient(index)} flex items-center justify-center text-white shadow-md`}>
                          {getCategoryIcon(item)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          {item.stats?.productCount > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.stats.productCount} products</p>
                          )}
                        </div>
                      </div>
                      {item.children?.length > 0 && (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Show preview of subcategories if available */}
                    {item.children?.length > 0 && mobileNavStack.length === 0 && (
                      <div className="px-4 pb-4 pl-16">
                        <div className="flex flex-wrap gap-2">
                          {item.children.slice(0, 3).map((subItem) => (
                            <Link
                              key={subItem._id}
                              to={`/category/${subItem.slug}`}
                              className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-teal-100 hover:text-teal-700 transition-colors"
                              onClick={toggleMobileMenu}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                          {item.children.length > 3 && (
                            <button
                              onClick={() => handleMobileCategoryClick(item)}
                              className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-teal-600 hover:bg-teal-100 transition-colors"
                            >
                              +{item.children.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Links for Mobile */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                  Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/new-arrivals"
                    className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-left hover:shadow-md transition-all group"
                    onClick={toggleMobileMenu}
                  >
                    <Sparkles className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700">New Arrivals</span>
                  </Link>
                  <Link
                    to="/best-sellers"
                    className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl text-left hover:shadow-md transition-all group"
                    onClick={toggleMobileMenu}
                  >
                    <Zap className="w-5 h-5 text-orange-600 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700">Best Sellers</span>
                  </Link>
                  <Link
                    to="/offers"
                    className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-left hover:shadow-md transition-all group"
                    onClick={toggleMobileMenu}
                  >
                    <Percent className="w-5 h-5 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700">Special Offers</span>
                  </Link>
                  <Link
                    to="/gifts"
                    className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl text-left hover:shadow-md transition-all group"
                    onClick={toggleMobileMenu}
                  >
                    <Gift className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700">Gift Ideas</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default HeaderBottom;