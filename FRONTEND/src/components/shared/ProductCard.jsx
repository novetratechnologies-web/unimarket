// src/components/shared/ProductCard.jsx
import { Link } from 'react-router-dom';
import { MapPin, Eye, Heart, Clock } from 'lucide-react';
import Badge from '../ui/Badge';

const ProductCard = ({ product }) => {
  return (
    <Link to={`/product/${product._id || product.id}`}>
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">
        <div className="relative">
          <img 
            src={product.images?.[0] || product.image || 'https://via.placeholder.com/400x300'}
            alt={product.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.isFeatured && <Badge variant="featured">⭐ Featured</Badge>}
            {product.isNew && <Badge variant="new">NEW</Badge>}
            {product.isTrending && <Badge variant="trending">🔥 Trending</Badge>}
          </div>
          
          {/* Wishlist Button */}
          <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
          
          {/* Time Left */}
          {product.timeLeft && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
              <Clock className="w-3 h-3 inline mr-1" />
              {product.timeLeft}
            </div>
          )}
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">
              {product.title}
            </h3>
            <div className="text-right">
              <div className="text-lg font-bold text-teal-600">
                Ksh {product.price?.toLocaleString() || '0'}
              </div>
              {product.originalPrice && (
                <div className="text-sm text-gray-500 line-through">
                  Ksh {product.originalPrice.toLocaleString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 mb-3">
            {/* Rating stars would go here */}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {product.university || product.seller?.university || 'Campus'}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {product.views || 0} views
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;