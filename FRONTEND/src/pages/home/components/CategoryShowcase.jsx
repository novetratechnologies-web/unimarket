// components/home/CategoryShowcase.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  Package
} from 'lucide-react';
import api from '../../../api/index';

const CategoryShowcase = () => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  // Fetch categories from backend
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'homepage'],
    queryFn: async () => {
      console.log('📡 Fetching homepage categories...');
      const response = await api.categories.getHomepageCategories({ limit: 12 });
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle scroll arrows visibility
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setScrollPosition(scrollLeft);
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-2xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-50/30 to-transparent pointer-events-none"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                Categories
              </span>
              <span className="text-sm text-gray-500">
                {categories.length} categories
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Shop by{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Category
              </span>
            </h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Explore our wide range of products organized by category. Find exactly what you need for your campus life.
            </p>
          </div>

          {/* Featured Categories */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
              <TrendingUp className="w-4 h-4" />
              Trending
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
              <Award className="w-4 h-4" />
              Best Sellers
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              <Clock className="w-4 h-4" />
              New Arrivals
            </button>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="relative">
          {/* Left Scroll Button */}
          <AnimatePresence>
            {showLeftArrow && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Right Scroll Button */}
          <AnimatePresence>
            {showRightArrow && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Categories Grid - Horizontal Scroll */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(25%-12px)] lg:w-[calc(16.666%-14px)] xl:w-[calc(12.5%-14px)] snap-start"
                onMouseEnter={() => setHoveredCategory(category._id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={`/category/${category.slug}`}
                  className="group block relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Category Image/Banner */}
                  <div className="relative aspect-square overflow-hidden">
                    {category.banner || category.image ? (
                      <img
                        src={category.banner || category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <Package className="w-12 h-12 text-white opacity-50" />
                      </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    {/* Category Icon (if available) */}
                    {category.iconImage && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <img
                          src={category.iconImage}
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                      </div>
                    )}

                    {/* Category Name Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                        {category.name}
                      </h3>
                      {category.productCount > 0 && (
                        <p className="text-white/80 text-sm">
                          {category.productCount.toLocaleString()} items
                        </p>
                      )}
                    </div>

                    {/* Hover Effect - Quick Stats */}
                    <AnimatePresence>
                      {hoveredCategory === category._id && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-0 bg-gradient-to-t from-teal-600/90 via-teal-600/50 to-transparent flex items-end p-4"
                        >
                          <div className="text-white">
                            <p className="text-sm font-medium mb-1">Shop Now</p>
                            <p className="text-xs opacity-90">
                              {category.subcategoryCount || 0} subcategories
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mobile/Simple View (for small screens) */}
                  <div className="lg:hidden p-3">
                    <div className="flex items-center gap-2">
                      {category.iconImage ? (
                        <img
                          src={category.iconImage}
                          alt=""
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900 text-sm">
                        {category.name}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.reduce((acc, cat) => acc + (cat.productCount || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">24/7</p>
                <p className="text-sm text-gray-600">Support</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600">Secure</p>
              </div>
            </div>
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            Browse All Categories
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;