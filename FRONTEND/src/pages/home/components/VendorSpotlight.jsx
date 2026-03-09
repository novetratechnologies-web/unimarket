// src/pages/home/components/VendorSpotlight.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Store, ChevronRight } from 'lucide-react';
import api from '../../../api/index';
import VendorCard from '../../../components/shared/VendorCard';

const VendorSpotlight = () => {
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', 'spotlight'],
    queryFn: async () => {
      console.log('📡 Fetching spotlight vendors...');
      // You'll need to create this API endpoint
      // For now, return mock data
      return [
        {
          _id: '1',
          storeName: 'Campus Tech Store',
          logo: null,
          rating: 4.8,
          reviewCount: 234,
          productCount: 156,
          location: 'Main Campus',
          verified: true,
          featured: true,
          isOpen: true,
          description: 'Your one-stop shop for all electronics, from laptops to accessories.',
          tags: ['Electronics', 'Tech'],
          responseTime: '< 30 mins',
          followers: 1200
        },
        {
          _id: '2',
          storeName: 'Student Textbook Exchange',
          logo: null,
          rating: 4.9,
          reviewCount: 567,
          productCount: 890,
          location: 'Library Complex',
          verified: true,
          featured: false,
          isOpen: true,
          description: 'Buy and sell textbooks, study materials, and academic resources.',
          tags: ['Books', 'Academic'],
          responseTime: '< 15 mins',
          followers: 2300
        },
        {
          _id: '3',
          storeName: 'Campus Fashion',
          logo: null,
          rating: 4.6,
          reviewCount: 189,
          productCount: 245,
          location: 'Student Center',
          verified: false,
          featured: true,
          isOpen: false,
          description: 'Trendy clothing and accessories for the fashion-forward student.',
          tags: ['Fashion', 'Clothing'],
          responseTime: '< 1 hour',
          followers: 890
        },
        {
          _id: '4',
          storeName: 'Dorm Essentials',
          logo: null,
          rating: 4.7,
          reviewCount: 312,
          productCount: 178,
          location: 'North Campus',
          verified: true,
          featured: false,
          isOpen: true,
          description: 'Everything you need for your dorm room, from furniture to decor.',
          tags: ['Home', 'Furniture'],
          responseTime: '< 45 mins',
          followers: 1500
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
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Vendors
          </h2>
        </div>
        <Link
          to="/vendors"
          className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {vendors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vendors.map((vendor) => (
            <VendorCard key={vendor._id} vendor={vendor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No vendors yet
          </h3>
          <p className="text-gray-600">
            Check back later for featured vendors
          </p>
        </div>
      )}
    </section>
  );
};

export default VendorSpotlight;