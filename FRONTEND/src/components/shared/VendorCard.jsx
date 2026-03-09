// src/components/shared/VendorCard.jsx (Simple Version)
import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, MapPin, Package, ChevronRight } from 'lucide-react';

const VendorCard = ({ vendor }) => {
  const {
    _id,
    storeName = vendor?.name || 'Store Name',
    logo = null,
    rating = 4.5,
    productCount = 0,
    location = 'Campus',
    slug = _id
  } = vendor || {};

  return (
    <Link
      to={`/vendor/${slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="h-20 bg-gradient-to-r from-teal-500 to-cyan-500 relative">
        {logo && (
          <div className="absolute -bottom-8 left-4">
            <img
              src={logo}
              alt={storeName}
              className="w-16 h-16 rounded-xl border-4 border-white shadow-lg object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pt-10">
        <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
          {storeName}
        </h3>
        
        <div className="flex items-center gap-2 mt-1 mb-2">
          <div className="flex items-center gap-0.5">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating}</span>
          </div>
          <span className="text-xs text-gray-500">•</span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package className="w-3 h-3" />
            {productCount} products
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="w-3 h-3" />
          {location}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-teal-600">View Store</span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default VendorCard;