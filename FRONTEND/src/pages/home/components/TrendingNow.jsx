// components/home/TrendingNow.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../../../components/shared/ProductCard';
import { Flame } from 'lucide-react';

const TrendingNow = () => {
  const { data: products = [] } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: () => api.products.getTrending({ limit: 8 }),
  });

  return (
    <section>
      <div className="flex items-center gap-2 mb-8">
        <Flame className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-900">
          Trending Now
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default TrendingNow;