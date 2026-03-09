// src/components/home/TopRated.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, ChevronRight } from 'lucide-react';
import api from '../../../api/index';
import ProductCard from '../../../components/shared/ProductCard';

const TopRated = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'top-rated'],
    queryFn: async () => {
      const response = await api.products.getAll({ 
        sortBy: 'rating', 
        sortOrder: 'desc',
        limit: 8 
      });
      return response?.data || [];
    },
  });

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Top Rated</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Top Rated</h2>
        </div>
        <Link 
          to="/products/top-rated"
          className="text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default TopRated;