// src/pages/home/components/SpecialOffers.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tag, ChevronRight } from 'lucide-react';
import api from '../../../api/index';
import DealCard from '../../../components/shared/DealCard';

const SpecialOffers = () => {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', 'special'],
    queryFn: async () => {
      console.log('📡 Fetching special offers...');
      // You'll need to create this API endpoint
      // For now, return mock data
      return [
        {
          _id: '1',
          name: 'MacBook Pro 13" - Student Discount',
          slug: 'macbook-pro-student',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          originalPrice: 129999,
          discountedPrice: 109999,
          discount: 15,
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          claimedCount: 45,
          limit: 100,
          type: 'flash',
          vendor: { name: 'Campus Tech Store' },
          freeShipping: true,
          isNew: true
        },
        {
          _id: '2',
          name: 'Textbook Bundle: Computer Science',
          slug: 'cs-textbook-bundle',
          image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
          originalPrice: 15999,
          discountedPrice: 11999,
          discount: 25,
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          claimedCount: 78,
          limit: 150,
          type: 'bundle',
          vendor: { name: 'Student Textbook Exchange' },
          freeShipping: true
        },
        {
          _id: '3',
          name: 'Dorm Room Essentials Package',
          slug: 'dorm-essentials',
          image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
          originalPrice: 24999,
          discountedPrice: 17999,
          discount: 28,
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          claimedCount: 32,
          limit: 75,
          type: 'clearance',
          vendor: { name: 'Dorm Essentials' }
        },
        {
          _id: '4',
          name: 'Scientific Calculator - Back to School',
          slug: 'scientific-calculator',
          image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=400',
          originalPrice: 3499,
          discountedPrice: 2799,
          discount: 20,
          endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          claimedCount: 92,
          limit: 120,
          type: 'seasonal',
          vendor: { name: 'Campus Bookstore' },
          freeShipping: true,
          isNew: true
        }
      ];
    },
  });

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Special Offers
            </h2>
          </div>
          <Link
            to="/deals"
            className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            View All Deals <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {deals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((deal) => (
              <DealCard key={deal._id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No deals available
            </h3>
            <p className="text-gray-600">
              Check back later for exciting offers!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SpecialOffers;