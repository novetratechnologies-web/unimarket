// components/home/FeaturedProducts.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../../../components/shared/ProductCard';
import { ChevronRight, Link } from 'lucide-react';

const FeaturedProducts = () => {
  const { data: products = [] } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.products.getFeatured({ limit: 8 }),
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Featured Products
        </h2>
        <Link 
          to="/products/featured"
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
export default FeaturedProducts;