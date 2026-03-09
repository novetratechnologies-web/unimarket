// src/components/deals/DealCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Tag, 
  ShoppingBag, 
  ChevronRight,
  Flame,
  Users,
  Percent,
  Zap,
  Gift,
  Sparkles
} from 'lucide-react';

const DealCard = ({ deal }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [isExpired, setIsExpired] = useState(false);

  const {
    _id,
    name,
    slug,
    image,
    originalPrice,
    discountedPrice,
    discount,
    endDate,
    claimedCount = 0,
    limit = 100,
    type = 'flash', // flash, bundle, clearance, seasonal
    badge = null,
    vendor,
    freeShipping = false,
    isNew = false
  } = deal || {};

  // Calculate discount percentage if not provided
  const discountPercentage = discount || (originalPrice && discountedPrice 
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) 
    : 0);

  // Countdown timer
  useEffect(() => {
    if (!endDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        setIsExpired(true);
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  // Get badge color based on deal type
  const getBadgeStyles = () => {
    switch (type) {
      case 'flash':
        return {
          bg: 'from-orange-500 to-red-500',
          icon: <Flame className="w-4 h-4" />,
          text: 'FLASH SALE'
        };
      case 'bundle':
        return {
          bg: 'from-purple-500 to-pink-500',
          icon: <Gift className="w-4 h-4" />,
          text: 'BUNDLE'
        };
      case 'clearance':
        return {
          bg: 'from-blue-500 to-cyan-500',
          icon: <Tag className="w-4 h-4" />,
          text: 'CLEARANCE'
        };
      case 'seasonal':
        return {
          bg: 'from-green-500 to-emerald-500',
          icon: <Sparkles className="w-4 h-4" />,
          text: 'SEASONAL'
        };
      default:
        return {
          bg: 'from-teal-500 to-cyan-500',
          icon: <Zap className="w-4 h-4" />,
          text: 'SPECIAL OFFER'
        };
    }
  };

  const badgeStyle = getBadgeStyles();

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('KES', 'KSh');
  };

  if (isExpired) return null;

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Deal Badge */}
      <div className={`absolute top-4 left-4 z-10 bg-gradient-to-r ${badgeStyle.bg} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1`}>
        {badgeStyle.icon}
        {badgeStyle.text}
      </div>

      {/* Discount Badge */}
      <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
        <Percent className="w-4 h-4" />
        {discountPercentage}% OFF
      </div>

      {/* Product Image */}
      <Link to={`/product/${slug}`} className="block relative h-48 overflow-hidden">
        <img
          src={image || 'https://via.placeholder.com/300x200?text=Deal'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

        {/* Quick Stats */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-xs bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
            <Users className="w-3 h-3" />
            <span>{claimedCount} claimed</span>
          </div>
          {freeShipping && (
            <div className="text-xs bg-green-500/80 backdrop-blur-sm px-2 py-1 rounded-full">
              Free Shipping
            </div>
          )}
        </div>

        {/* New Badge */}
        {isNew && (
          <div className="absolute top-4 left-20 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            NEW
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link to={`/product/${slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>

        {/* Vendor */}
        {vendor && (
          <p className="text-xs text-gray-500 mb-2">
            by {vendor.storeName || vendor.name}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(discountedPrice || originalPrice)}
          </span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Claimed</span>
            <span className="font-medium text-gray-900">
              {claimedCount}/{limit}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${(claimedCount / limit) * 100}%` }}
            />
          </div>
        </div>

        {/* Countdown Timer */}
        {endDate && timeLeft && Object.keys(timeLeft).length > 0 && (
          <div className="bg-orange-50 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 text-orange-600 text-xs font-medium mb-2">
              <Clock className="w-4 h-4" />
              <span>Ends in:</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {timeLeft.days > 0 && (
                <div className="bg-white rounded-lg p-1">
                  <div className="text-lg font-bold text-gray-900">{timeLeft.days}</div>
                  <div className="text-xs text-gray-500">days</div>
                </div>
              )}
              <div className="bg-white rounded-lg p-1">
                <div className="text-lg font-bold text-gray-900">{timeLeft.hours || '00'}</div>
                <div className="text-xs text-gray-500">hrs</div>
              </div>
              <div className="bg-white rounded-lg p-1">
                <div className="text-lg font-bold text-gray-900">{timeLeft.minutes || '00'}</div>
                <div className="text-xs text-gray-500">min</div>
              </div>
              <div className="bg-white rounded-lg p-1">
                <div className="text-lg font-bold text-gray-900">{timeLeft.seconds || '00'}</div>
                <div className="text-xs text-gray-500">sec</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link
          to={`/product/${slug}`}
          className="block w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-center font-medium rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Grab Deal
        </Link>
      </div>
    </div>
  );
};

export default DealCard;