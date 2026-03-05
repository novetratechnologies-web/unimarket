// src/components/home/FeaturedListings.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import ProductCard from '../shared/ProductCard';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';

const FeaturedListings = ({ 
  listings = [], 
  loading = false,
  title = "Featured Listings",
  subtitle = "Hand-picked items from across campuses"
}) => {
  const [activeFilter, setActiveFilter] = useState('featured');

  const filteredListings = listings.filter(listing => {
    if (activeFilter === 'featured') return listing.isFeatured;
    if (activeFilter === 'new') return listing.isNew;
    if (activeFilter === 'trending') return listing.isTrending;
    return true;
  });

  if (loading && listings.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner text="Loading featured listings..." />
        </div>
      </section>
    );
  }

  if (!loading && listings.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon="🛒"
            title="No listings yet"
            message="Be the first to list an item!"
            actionText="Sell Now"
            actionLink="/sell"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setActiveFilter('featured')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'featured' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Featured
            </button>
            <button
              onClick={() => setActiveFilter('new')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'new' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              New
            </button>
            <button
              onClick={() => setActiveFilter('trending')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeFilter === 'trending' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Trending
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.slice(0, 6).map((listing) => (
            <ProductCard key={listing._id || listing.id} product={listing} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link 
            to="/listings"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
          >
            View All Listings
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;