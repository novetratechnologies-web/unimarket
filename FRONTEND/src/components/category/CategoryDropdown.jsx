// components/CategoryDropdown.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Store, 
  Loader2,
  X,
  Sparkles,
  Zap,
  ShoppingBag,
  Gift,
  Percent,
  ChevronLeft,
  Home
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/index';

const CategoryDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState(null);
  const [hoveredSubSubCategory, setHoveredSubSubCategory] = useState(null);
  const [mobileNavStack, setMobileNavStack] = useState([]);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [menuTimeout, setMenuTimeout] = useState(null);
  
  const dropdownRef = useRef(null);
  const categoryRefs = useRef({});
  const subCategoryRefs = useRef({});
  const subSubCategoryRefs = useRef({});
  
  // Refs for menu containers to track mouse position
  const mainMenuRef = useRef(null);
  const subMenuRef = useRef(null);
  const subSubMenuRef = useRef(null);

  // Fetch categories from backend using tree endpoint
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const response = await api.categories.getCategoryTree({ 
        depth: 10 // Get all levels
      });
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 2
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (menuTimeout) clearTimeout(menuTimeout);
    };
  }, [hoverTimeout, menuTimeout]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeDropdown = () => {
    setIsOpen(false);
    setHoveredCategory(null);
    setHoveredSubCategory(null);
    setHoveredSubSubCategory(null);
    setMobileNavStack([]);
  };

  // Desktop hover handlers with improved delay and path tracking
  const handleCategoryHover = (category) => {
    if (window.innerWidth < 1024) return;
    
    // Clear any pending timeouts
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (menuTimeout) clearTimeout(menuTimeout);
    
    // Set new timeout for showing category
    setHoverTimeout(setTimeout(() => {
      setHoveredCategory(category);
      setHoveredSubCategory(null);
      setHoveredSubSubCategory(null);
    }, 100));
  };

  const handleSubCategoryHover = (subCategory) => {
    if (window.innerWidth < 1024) return;
    
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (menuTimeout) clearTimeout(menuTimeout);
    
    setHoverTimeout(setTimeout(() => {
      setHoveredSubCategory(subCategory);
      setHoveredSubSubCategory(null);
    }, 100));
  };

  const handleSubSubCategoryHover = (subSubCategory) => {
    if (window.innerWidth < 1024) return;
    
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (menuTimeout) clearTimeout(menuTimeout);
    
    setHoverTimeout(setTimeout(() => {
      setHoveredSubSubCategory(subSubCategory);
    }, 100));
  };

  const handleMenuLeave = () => {
    if (window.innerWidth < 1024) return;
    
    // Don't close immediately, wait to see if mouse enters submenu
    if (menuTimeout) clearTimeout(menuTimeout);
    
    setMenuTimeout(setTimeout(() => {
      // Check if mouse is still in any menu area
      const isInMain = mainMenuRef.current?.matches(':hover');
      const isInSub = subMenuRef.current?.matches(':hover');
      const isInSubSub = subSubMenuRef.current?.matches(':hover');
      
      if (!isInMain && !isInSub && !isInSubSub) {
        setHoveredCategory(null);
        setHoveredSubCategory(null);
        setHoveredSubSubCategory(null);
      }
    }, 200));
  };

  const handleMainMenuEnter = () => {
    if (window.innerWidth < 1024) return;
    
    if (menuTimeout) clearTimeout(menuTimeout);
  };

  const handleSubMenuEnter = () => {
    if (window.innerWidth < 1024) return;
    
    if (menuTimeout) clearTimeout(menuTimeout);
  };

  const handleSubSubMenuEnter = () => {
    if (window.innerWidth < 1024) return;
    
    if (menuTimeout) clearTimeout(menuTimeout);
  };

  // Mobile navigation handlers
  const handleMobileCategoryClick = (category) => {
    if (category.children && category.children.length > 0) {
      setMobileNavStack([...mobileNavStack, category]);
    } else {
      window.location.href = `/category/${category.slug}`;
      closeDropdown();
    }
  };

  const handleMobileBack = () => {
    setMobileNavStack(mobileNavStack.slice(0, -1));
  };

  const handleMobileViewAll = (category) => {
    window.location.href = `/category/${category.slug}`;
    closeDropdown();
  };

  // Get current mobile view data
  const getCurrentMobileView = () => {
    if (mobileNavStack.length === 0) {
      return {
        title: 'All Categories',
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

  // Get category icon
  const getCategoryIcon = (category) => {
    if (category?.iconImage?.url) {
      return (
        <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
          <img 
            src={category.iconImage.url} 
            alt={category.iconImage.alt || category.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    if (category?.icon) {
      return <i className={`${category.icon} w-5 h-5`} />;
    }
    
    return <Home className="w-5 h-5 text-gray-400" />;
  };

  // Get category image
  const getCategoryImage = (category) => {
    if (category?.image?.url) {
      return category.image.url;
    }
    if (category?.banner?.url) {
      return category.banner.url;
    }
    return null;
  };

  // Calculate total products
  const totalProducts = useMemo(() => {
    const calculateTotal = (cats) => {
      return cats.reduce((acc, cat) => {
        const productCount = cat.stats?.productCount || 0;
        const childrenTotal = cat.children ? calculateTotal(cat.children) : 0;
        return acc + productCount + childrenTotal;
      }, 0);
    };
    return calculateTotal(categories);
  }, [categories]);

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

  // Get current mobile view
  const currentView = getCurrentMobileView();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-3 w-[1100px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            onMouseLeave={handleMenuLeave}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Shop by Category
                </h3>
                <button
                  onClick={closeDropdown}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="flex h-[600px]">
              {/* Level 1: Main Categories */}
              <div 
                ref={mainMenuRef}
                className="w-72 bg-gray-50 border-r border-gray-200 overflow-y-auto"
                onMouseEnter={handleMainMenuEnter}
              >
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Main Categories
                  </h4>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        ref={el => categoryRefs.current[category._id] = el}
                        onMouseEnter={() => handleCategoryHover(category)}
                        className={`
                          relative px-3 py-2.5 rounded-lg cursor-pointer
                          transition-all duration-200
                          ${hoveredCategory?._id === category._id
                            ? 'bg-white shadow-md border border-teal-100'
                            : 'hover:bg-white hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {getCategoryIcon(category)}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 block truncate">
                                {category.name}
                              </span>
                              {category.stats?.productCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  {category.stats.productCount} items
                                </span>
                              )}
                              {category.children?.length > 0 && (
                                <span className="text-xs text-teal-600 ml-1">
                                  ({category.children.length})
                                </span>
                              )}
                            </div>
                          </div>
                          {category.children?.length > 0 && (
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
                              hoveredCategory?._id === category._id ? 'translate-x-1 text-teal-600' : ''
                            }`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Level 2: Sub Categories */}
              {hoveredCategory && hoveredCategory.children?.length > 0 && (
                <motion.div
                  ref={subMenuRef}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="w-72 bg-white border-r border-gray-200 overflow-y-auto"
                  onMouseEnter={handleSubMenuEnter}
                  onMouseLeave={() => {
                    // Only clear if not hovering over sub-sub menu
                    setTimeout(() => {
                      if (!subSubMenuRef.current?.matches(':hover')) {
                        setHoveredSubCategory(null);
                      }
                    }, 100);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {hoveredCategory.name}
                      </h4>
                      <Link
                        to={`/category/${hoveredCategory.slug}`}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                        onClick={closeDropdown}
                      >
                        View All
                      </Link>
                    </div>
                    <div className="space-y-1">
                      {hoveredCategory.children.map((subCategory) => (
                        <div
                          key={subCategory._id}
                          ref={el => subCategoryRefs.current[subCategory._id] = el}
                          onMouseEnter={() => handleSubCategoryHover(subCategory)}
                          className={`
                            relative px-3 py-2.5 rounded-lg cursor-pointer
                            transition-all duration-200
                            ${hoveredSubCategory?._id === subCategory._id
                              ? 'bg-teal-50 border border-teal-100'
                              : 'hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {getCategoryIcon(subCategory)}
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-700 block truncate">
                                  {subCategory.name}
                                </span>
                                {subCategory.stats?.productCount > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {subCategory.stats.productCount} items
                                  </span>
                                )}
                                {subCategory.children?.length > 0 && (
                                  <span className="text-xs text-teal-600 ml-1">
                                    ({subCategory.children.length})
                                  </span>
                                )}
                              </div>
                            </div>
                            {subCategory.children?.length > 0 && (
                              <ChevronRight className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
                                hoveredSubCategory?._id === subCategory._id ? 'translate-x-1 text-teal-600' : ''
                              }`} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Level 3: Sub Sub Categories */}
              {hoveredSubCategory && hoveredSubCategory.children?.length > 0 && (
                <motion.div
                  ref={subSubMenuRef}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="w-72 bg-white overflow-y-auto"
                  onMouseEnter={handleSubSubMenuEnter}
                  onMouseLeave={() => {
                    // Small delay before clearing
                    setTimeout(() => {
                      setHoveredSubSubCategory(null);
                    }, 100);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {hoveredSubCategory.name}
                      </h4>
                      <Link
                        to={`/category/${hoveredSubCategory.slug}`}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                        onClick={closeDropdown}
                      >
                        View All
                      </Link>
                    </div>
                    <div className="space-y-1">
                      {hoveredSubCategory.children.map((subSubCategory) => (
                        <Link
                          key={subSubCategory._id}
                          ref={el => subSubCategoryRefs.current[subSubCategory._id] = el}
                          to={`/category/${subSubCategory.slug}`}
                          onMouseEnter={() => handleSubSubCategoryHover(subSubCategory)}
                          onClick={closeDropdown}
                          className={`
                            block px-3 py-2.5 rounded-lg
                            transition-all duration-200
                            ${hoveredSubSubCategory?._id === subSubCategory._id
                              ? 'bg-teal-50 border border-teal-100'
                              : 'hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(subSubCategory)}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-700 block truncate">
                                {subSubCategory.name}
                              </span>
                              {subSubCategory.stats?.productCount > 0 && (
                                <span className="text-xs text-gray-500">
                                  {subSubCategory.stats.productCount} items
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Category Banner */}
                    {getCategoryImage(hoveredSubCategory) && (
                      <Link
                        to={`/category/${hoveredSubCategory.slug}`}
                        className="block mt-6 pt-4 border-t border-gray-200"
                        onClick={closeDropdown}
                      >
                        <div className="relative h-32 rounded-lg overflow-hidden group">
                          <img 
                            src={getCategoryImage(hoveredSubCategory)}
                            alt={hoveredSubCategory.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center p-4">
                            <div>
                              <p className="text-white text-sm font-semibold">Shop {hoveredSubCategory.name}</p>
                              <p className="text-white/80 text-xs mt-1">
                                {hoveredSubCategory.stats?.productCount || 0} products
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Empty States */}
              {hoveredCategory && (!hoveredCategory.children || hoveredCategory.children.length === 0) && (
                <div className="flex-1 flex items-center justify-center bg-white">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No subcategories</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Browse products in this category
                    </p>
                    <Link
                      to={`/category/${hoveredCategory.slug}`}
                      className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
                      onClick={closeDropdown}
                    >
                      View Products
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">
                  {totalProducts} products
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {categories.length} main categories
                </span>
              </div>
              <Link
                to="/categories"
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                onClick={closeDropdown}
              >
                Browse All Categories →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            {/* Mobile Header */}
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-500 text-white p-4 shadow-lg z-10">
              <div className="flex items-center">
                {mobileNavStack.length > 0 && (
                  <button
                    onClick={handleMobileBack}
                    className="p-2 mr-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={closeDropdown}
                  className="p-2 mr-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
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

            {/* Mobile Content */}
            <div className="divide-y divide-gray-100">
              {currentView.items.map((item) => (
                <div
                  key={item._id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <button
                    onClick={() => handleMobileCategoryClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(item)}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      {item.stats?.productCount > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({item.stats.productCount})
                        </span>
                      )}
                      {item.children?.length > 0 && (
                        <span className="ml-1 text-xs text-teal-600">
                          ({item.children.length})
                        </span>
                      )}
                    </div>
                    {item.children?.length > 0 && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Show preview of subcategories if available */}
                  {item.children?.length > 0 && (
                    <div className="px-4 pb-3 ml-11">
                      <div className="flex flex-wrap gap-2">
                        {item.children.slice(0, 3).map((subItem) => (
                          <Link
                            key={subItem._id}
                            to={`/category/${subItem.slug}`}
                            className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-teal-100 hover:text-teal-700 transition-colors"
                            onClick={closeDropdown}
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

            {/* Quick Links */}
            <div className="p-4 mt-4 bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Quick Links
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/new-arrivals"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={closeDropdown}
                >
                  <Sparkles className="w-5 h-5 text-purple-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700">New Arrivals</span>
                </Link>
                <Link
                  to="/best-sellers"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={closeDropdown}
                >
                  <Zap className="w-5 h-5 text-orange-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Best Sellers</span>
                </Link>
                <Link
                  to="/offers"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={closeDropdown}
                >
                  <Percent className="w-5 h-5 text-green-600 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Special Offers</span>
                </Link>
                <Link
                  to="/gifts"
                  className="p-3 bg-white rounded-xl text-left hover:shadow-md transition-shadow"
                  onClick={closeDropdown}
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