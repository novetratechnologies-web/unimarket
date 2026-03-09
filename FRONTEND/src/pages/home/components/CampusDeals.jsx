// src/components/home/CampusDeals.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  GraduationCap, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Tag, 
  Percent,
  Users,
  Flame,
  Sparkles,
  Gift,
  Zap,
  Store
} from 'lucide-react';
import api from '../../../api/index';
import ProductCard from '../../../components/shared/ProductCard';

// University colors and themes
const universityThemes = {
  'uon': {
    name: 'University of Nairobi',
    color: 'from-blue-600 to-blue-700',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    icon: '🎓',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 to-transparent'
  },
  'ku': {
    name: 'Kenyatta University',
    color: 'from-green-600 to-green-700',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
    icon: '📚',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100 to-transparent'
  },
  'strath': {
    name: 'Strathmore University',
    color: 'from-purple-600 to-purple-700',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    icon: '⚡',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100 to-transparent'
  },
  'jkuat': {
    name: 'JKUAT',
    color: 'from-orange-600 to-orange-700',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    icon: '🔧',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100 to-transparent'
  },
  'mku': {
    name: 'Mount Kenya University',
    color: 'from-red-600 to-red-700',
    lightColor: 'bg-red-50',
    textColor: 'text-red-600',
    icon: '⛰️',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-100 to-transparent'
  },
  'daystar': {
    name: 'Daystar University',
    color: 'from-yellow-600 to-yellow-700',
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    icon: '⭐',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-100 to-transparent'
  },
  'default': {
    name: 'Campus Deals',
    color: 'from-teal-600 to-cyan-600',
    lightColor: 'bg-teal-50',
    textColor: 'text-teal-600',
    icon: '🏫',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100 to-transparent'
  }
};

const CampusDeals = () => {
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  // Fetch campus deals
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', 'campus', selectedUniversity],
    queryFn: async () => {
      console.log('📡 Fetching campus deals...');
      const params = {
        type: 'campus',
        university: selectedUniversity !== 'all' ? selectedUniversity : undefined,
        limit: 6,
        sortBy: 'discount',
        sortOrder: 'desc'
      };
      const response = await api.products.getDeals(params);
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch popular universities (for the filter tabs)
  const { data: universities = [] } = useQuery({
    queryKey: ['universities', 'popular'],
    queryFn: async () => {
      // You'll need to create this API endpoint
      // For now, return mock data
      return [
        { id: 'uon', name: 'UoN' },
        { id: 'ku', name: 'KU' },
        { id: 'strath', name: 'Strathmore' },
        { id: 'jkuat', name: 'JKUAT' },
        { id: 'mku', name: 'MKU' }
      ];
    },
  });

  // Countdown timer for flash deals
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date().setHours(23, 59, 59, 999); // End of day
      const distance = endTime - now;
      
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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

  // Get university theme
  const getUniversityTheme = (universityId) => {
    return universityThemes[universityId] || universityThemes.default;
  };

  // Calculate discount badge color
  const getDiscountColor = (discount) => {
    if (discount >= 50) return 'from-red-500 to-red-600';
    if (discount >= 30) return 'from-orange-500 to-orange-600';
    if (discount >= 20) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  return (
    <section className="py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 opacity-50"></div>
      <div 
            className="absolute inset-0 opacity-20"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
            ></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Gradient */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-100 rounded-full mb-4">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">Student Exclusive</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Campus <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Special Deals</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Exclusive discounts and offers just for students. Show your student ID at checkout!
          </p>
        </div>

        {/* Flash Sale Timer */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">Flash Sale Ends In</h3>
                <p className="text-white/80 text-sm">Grab them before they're gone!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                </div>
                <span className="text-xs mt-1 block">Hours</span>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                </div>
                <span className="text-xs mt-1 block">Minutes</span>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
                <span className="text-xs mt-1 block">Seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* University Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedUniversity('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedUniversity === 'all'
                ? 'bg-teal-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-teal-50 hover:text-teal-600'
            }`}
          >
            All Campuses
          </button>
          {universities.map((uni) => {
            const theme = getUniversityTheme(uni.id);
            return (
              <button
                key={uni.id}
                onClick={() => setSelectedUniversity(uni.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedUniversity === uni.id
                    ? `bg-gradient-to-r ${theme.color} text-white shadow-lg scale-105`
                    : `bg-white text-gray-600 hover:${theme.lightColor} hover:${theme.textColor}`
                }`}
              >
                <span>{theme.icon}</span>
                {uni.name}
              </button>
            );
          })}
        </div>

        {/* Deals Grid */}
        {deals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => {
              const theme = getUniversityTheme(deal.universityId);
              return (
                <div
                  key={deal._id}
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Deal Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`px-3 py-1.5 bg-gradient-to-r ${getDiscountColor(deal.discount)} text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1`}>
                      <Percent className="w-4 h-4" />
                      {deal.discount}% OFF
                    </span>
                  </div>

                  {/* University Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1.5 ${theme.lightColor} ${theme.textColor} text-xs font-medium rounded-full shadow-lg flex items-center gap-1`}>
                      <MapPin className="w-3 h-3" />
                      {theme.name}
                    </span>
                  </div>

                  {/* Product Image */}
                  <Link to={`/product/${deal.slug}`} className="block relative h-48 overflow-hidden">
                    <img
                      src={deal.images?.[0] || '/placeholder-product.jpg'}
                      alt={deal.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Quick Stats */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{deal.purchasedCount || 0} bought</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{deal.endsIn || 'Limited time'}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link to={`/product/${deal.slug}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-1">
                        {deal.name}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl font-bold text-gray-900">
                        KSh {deal.discountedPrice?.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        KSh {deal.originalPrice?.toLocaleString()}
                      </span>
                    </div>

                    {/* Vendor & Location */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Store className="w-4 h-4" />
                        {deal.vendor?.storeName || 'Campus Store'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {deal.location || 'Main Campus'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Claimed</span>
                        <span className="font-medium text-gray-900">
                          {deal.claimedCount || 0}/{deal.limit || 100}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${((deal.claimedCount || 0) / (deal.limit || 100)) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/product/${deal.slug}`}
                      className="mt-4 block w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-center font-medium rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Grab Deal
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
              <Gift className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Campus Deals Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Check back later for exclusive student offers!
            </p>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
            >
              Browse All Deals
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* View All Link */}
        {deals.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/campus-deals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-colors shadow-lg hover:shadow-xl"
            >
              View All Campus Deals
              <Zap className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default CampusDeals;