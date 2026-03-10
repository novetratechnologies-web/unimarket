// components/category/CategoryBanner.jsx
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ChevronRight, 
  Package, 
  Eye, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

const CategoryBanner = ({ category, breadcrumb, categoryIcons, onNavigate }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax effect - reduced intensity
  const y = useTransform(scrollY, [0, 300], [0, 50]);
  const scale = useTransform(scrollY, [0, 300], [1, 1.05]);

  // Get the image URL
  const imageUrl = category?.banner?.url || category?.image?.url || null;

  // Generate a gradient based on category name
  const getGradient = () => {
    const gradients = [
      'from-teal-600 via-teal-500 to-cyan-600',
      'from-purple-600 via-purple-500 to-pink-600',
      'from-orange-600 via-orange-500 to-red-600',
      'from-green-600 via-green-500 to-emerald-600',
      'from-blue-600 via-blue-500 to-indigo-600',
      'from-yellow-600 via-yellow-500 to-amber-600',
    ];
    const index = (category?.name?.length || 0) % gradients.length;
    return gradients[index];
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="relative h-[500px] overflow-hidden">
      {/* Parallax Background Image */}
      <motion.div 
        style={{ y, scale }}
        className="absolute inset-0"
      >
        {imageUrl && !imageError ? (
          <motion.img 
            src={imageUrl}
            alt={category?.name || 'Category'}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="eager"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${getGradient()}`} />
        )}
      </motion.div>

      {/* Lighter gradient overlay - 40% instead of 80% to show image better */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white max-w-3xl"
        >
          {/* Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-white/90 text-sm mb-4 flex-wrap"
          >
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => onNavigate('/categories')}
              className="hover:text-white transition-colors"
            >
              Categories
            </button>
            <ChevronRight className="w-4 h-4" />
            {breadcrumb?.map((item, index) => (
              <React.Fragment key={item._id}>
                {index < breadcrumb.length - 1 ? (
                  <>
                    <button
                      onClick={() => onNavigate(`/category/${item.slug}`)}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </button>
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <span className="text-white font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {item.name}
                  </span>
                )}
              </React.Fragment>
            ))}
          </motion.div>

          {/* Category Icon and Name */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6 mb-4"
          >
            {category?.iconImage?.url && (
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <img 
                  src={category.iconImage.url} 
                  alt={category.name} 
                  className="w-12 h-12 object-contain"
                />
              </div>
            )}
            <h1 className="text-5xl md:text-6xl font-bold drop-shadow-lg">
              {category?.name}
            </h1>
          </motion.div>

          {/* Description */}
          {category?.description && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/95 mb-6 max-w-2xl leading-relaxed drop-shadow"
            >
              {category.description}
            </motion.p>
          )}

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Package className="w-4 h-4 text-teal-300" />
              <span className="text-sm font-medium">{category?.stats?.productCount || 0} Products</span>
            </div>

            {category?.stats?.totalViews > 0 && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Eye className="w-4 h-4 text-cyan-300" />
                <span className="text-sm font-medium">{category.stats.totalViews} Views</span>
              </div>
            )}

            {category?.stats?.activeProductCount > 0 && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <TrendingUp className="w-4 h-4 text-green-300" />
                <span className="text-sm font-medium">{category.stats.activeProductCount} Active</span>
              </div>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex gap-3"
          >
            <button
              className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Shop Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/30"
            >
              View Deals
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Simple bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-teal-50/30 to-transparent" />
    </div>
  );
};

export default CategoryBanner;