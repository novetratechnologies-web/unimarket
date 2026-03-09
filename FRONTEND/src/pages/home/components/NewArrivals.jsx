// src/components/home/NewArrivals.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../../api/index';
import ProductCard from '../../../components/shared/ProductCard';

const NewArrivals = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: async () => {
      console.log('📡 Fetching new arrivals...');
      const response = await api.products.getAll({ 
        sortBy: 'createdAt', 
        sortOrder: 'desc',
        limit: 8,
        status: 'active'
      });
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Loading state
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Don't render if no products
  if (!products.length) {
    return null;
  }

  // Format date to show how old the product is
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const productDate = new Date(dateString);
    const diffHours = Math.floor((now - productDate) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full blur-md opacity-50"></div>
            <div className="relative w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <p className="text-sm text-gray-500 mt-1">Fresh items just added to the marketplace</p>
          </div>
        </div>
        <Link 
          to="/products/new-arrivals"
          className="group flex items-center gap-2 px-4 py-2 text-teal-600 hover:text-teal-700 font-medium rounded-lg hover:bg-teal-50 transition-all"
        >
          View All 
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="group relative">
            {/* New Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                NEW
              </span>
            </div>

            {/* Time Ago Badge */}
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-600 text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTimeAgo(product.createdAt)}
              </span>
            </div>

            {/* Product Card */}
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* View All Link for Mobile */}
      <div className="mt-8 text-center lg:hidden">
        <Link 
          to="/products/new-arrivals"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-50 text-teal-600 rounded-xl font-medium hover:bg-teal-100 transition-colors"
        >
          Browse All New Arrivals
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Floating action button for quick scroll (optional) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 lg:hidden w-12 h-12 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-colors"
        aria-label="Back to top"
      >
        <ChevronRight className="w-5 h-5 rotate-[-90deg]" />
      </button>
    </section>
  );
};

export default NewArrivals;