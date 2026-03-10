// components/layout/header/MobileCategoryMenu.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  X, 
  ChevronRight,
  Sparkles,
  Zap,
  Percent,
  Gift,
  ShoppingBag,
  Grid,
  Home,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileCategoryMenu = ({ isOpen, onClose, categories, getCategoryIcon, getCategoryGradient }) => {
  const [mobileNavStack, setMobileNavStack] = useState([]);
  const [activeSubCategory, setActiveSubCategory] = useState(null);

  const handleMobileCategoryClick = (category) => {
    if (category.children && category.children.length > 0) {
      setMobileNavStack([...mobileNavStack, category]);
      setActiveSubCategory(null);
    } else {
      window.location.href = `/category/${category.slug}`;
      onClose();
    }
  };

  const handleMobileBack = () => {
    setMobileNavStack(mobileNavStack.slice(0, -1));
    setActiveSubCategory(null);
  };

  const handleMobileViewAll = (category) => {
    window.location.href = `/category/${category.slug}`;
    onClose();
  };

  const handleSubCategoryClick = (e, subCategory) => {
    e.stopPropagation();
    if (subCategory.children && subCategory.children.length > 0) {
      setActiveSubCategory(activeSubCategory === subCategory._id ? null : subCategory._id);
    } else {
      window.location.href = `/category/${subCategory.slug}`;
      onClose();
    }
  };

  // Get current mobile view data
  const getCurrentMobileView = () => {
    if (mobileNavStack.length === 0) {
      return {
        title: 'Categories',
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

  const currentView = getCurrentMobileView();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mobileNavStack.length > 0 ? (
                  <button
                    onClick={handleMobileBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>
              
              <h2 className="font-semibold text-gray-900 flex-1 text-center">
                {currentView.title}
              </h2>
              
              {currentView.parent && (
                <button
                  onClick={() => handleMobileViewAll(currentView.parent)}
                  className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  View All
                </button>
              )}
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {currentView.items.map((item, index) => (
                  <div key={item._id} className="space-y-1">
                    {/* Main Category Button */}
                    <button
                      onClick={() => handleMobileCategoryClick(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      {/* Category Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group-hover:border-teal-200 transition-colors">
                        {item.iconImage?.url ? (
                          <img 
                            src={item.iconImage.url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${item.name}&background=teal&color=fff&size=48`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
                            <ShoppingBag className="w-6 h-6 text-teal-600" />
                          </div>
                        )}
                      </div>

                      {/* Category Info */}
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 group-hover:text-teal-600 transition-colors">
                          {item.name}
                        </h3>
                        {item.stats?.productCount > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.stats.productCount} items
                          </p>
                        )}
                      </div>

                      {/* Arrow or Expand Indicator */}
                      {item.children?.length > 0 && (
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                      )}
                    </button>

                    {/* Subcategories (shown when main category is active in stack) */}
                    {item.children?.length > 0 && mobileNavStack.length === 0 && (
                      <div className="ml-14 mt-1 space-y-1">
                        {item.children.slice(0, 4).map((subItem) => (
                          <div key={subItem._id}>
                            <button
                              onClick={(e) => handleSubCategoryClick(e, subItem)}
                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group/sub"
                            >
                              {/* Subcategory Image */}
                              <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                {subItem.iconImage?.url ? (
                                  <img 
                                    src={subItem.iconImage.url} 
                                    alt={subItem.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://ui-avatars.com/api/?name=${subItem.name}&size=32&background=f0fdf4&color=059669`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <Grid className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              <span className="text-sm text-gray-600 group-hover/sub:text-teal-600 transition-colors flex-1 text-left">
                                {subItem.name}
                              </span>
                              
                              {subItem.children?.length > 0 && (
                                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                  activeSubCategory === subItem._id ? 'rotate-90' : ''
                                }`} />
                              )}
                            </button>

                            {/* Third Level Categories */}
                            {activeSubCategory === subItem._id && subItem.children?.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="ml-8 mt-1 space-y-1"
                              >
                                {subItem.children.map((thirdLevel) => (
                                  <Link
                                    key={thirdLevel._id}
                                    to={`/category/${thirdLevel.slug}`}
                                    onClick={onClose}
                                    className="block p-2 pl-3 text-sm text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                  >
                                    {thirdLevel.name}
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        ))}
                        
                        {item.children.length > 4 && (
                          <button
                            onClick={() => handleMobileCategoryClick(item)}
                            className="text-sm text-teal-600 hover:text-teal-700 font-medium mt-1 ml-2"
                          >
                            +{item.children.length - 4} more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Links */}
              <div className="p-4 mt-2 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/new-arrivals"
                    onClick={onClose}
                    className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-all"
                  >
                    <Sparkles className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-sm font-medium text-gray-700">New Arrivals</span>
                  </Link>
                  <Link
                    to="/best-sellers"
                    onClick={onClose}
                    className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg hover:shadow-md transition-all"
                  >
                    <TrendingUp className="w-5 h-5 text-orange-600 mb-1" />
                    <span className="text-sm font-medium text-gray-700">Best Sellers</span>
                  </Link>
                  <Link
                    to="/offers"
                    onClick={onClose}
                    className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-all"
                  >
                    <Percent className="w-5 h-5 text-green-600 mb-1" />
                    <span className="text-sm font-medium text-gray-700">Special Offers</span>
                  </Link>
                  <Link
                    to="/gifts"
                    onClick={onClose}
                    className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg hover:shadow-md transition-all"
                  >
                    <Gift className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-sm font-medium text-gray-700">Gift Ideas</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileCategoryMenu;