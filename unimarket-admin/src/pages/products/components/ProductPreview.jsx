// components/admin/products/ProductPreview.jsx
import React, { useState } from 'react';
import { 
  FiX, 
  FiPackage, 
  FiTruck, 
  FiStar, 
  FiTag, 
  FiClock,
  FiDollarSign,
  FiShoppingBag,
  FiPercent,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiEye,
  FiHeart,
  FiShare2,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiGrid,
  FiList
} from 'react-icons/fi';

const ProductPreview = ({ formData, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'KSh 0.00';
    
    const currency = formData.currency || 'KES';
    
    if (currency === 'KES') {
      return `KSh ${parseFloat(price).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getStockStatus = () => {
    const quantity = formData.quantity || 0;
    const threshold = formData.lowStockThreshold || 5;
    
    if (quantity <= 0) {
      return {
        text: formData.allowBackorder ? 'Available for Backorder' : 'Out of Stock',
        color: formData.allowBackorder ? 'yellow' : 'red',
        icon: formData.allowBackorder ? FiClock : FiXCircle
      };
    }
    if (quantity <= threshold) {
      return {
        text: 'Low Stock',
        color: 'orange',
        icon: FiAlertCircle
      };
    }
    return {
      text: 'In Stock',
      color: 'green',
      icon: FiCheckCircle
    };
  };

  const stockStatus = getStockStatus();
  const StatusIcon = stockStatus.icon;

  const calculateDiscount = () => {
    if (formData.compareAtPrice && formData.compareAtPrice > formData.price) {
      const discount = ((formData.compareAtPrice - formData.price) / formData.compareAtPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discount = calculateDiscount();

  const primaryImage = formData.images?.find(img => img.isPrimary) || formData.images?.[0];
  const allImages = formData.images || [];

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl overflow-hidden sticky top-24 border border-gray-200 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <FiEye className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Product Preview</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close preview"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        {/* Image Gallery */}
        <div className="mb-4">
          <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
            {allImages.length > 0 ? (
              <>
                <img
                  src={allImages[selectedImageIndex]?.mediumUrl || allImages[selectedImageIndex]?.url}
                  alt={allImages[selectedImageIndex]?.alt || formData.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                  }}
                />
                
                {/* Image Navigation */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <FiImage className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex mt-2 space-x-2 overflow-x-auto pb-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index 
                      ? 'border-indigo-500 ring-2 ring-indigo-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.alt || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Name & SKU */}
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {formData.name || 'Product Name'}
          </h2>
          {formData.sku && (
            <p className="text-sm text-gray-500 flex items-center">
              <FiTag className="w-4 h-4 mr-1" />
              SKU: {formData.sku}
            </p>
          )}
        </div>

        {/* Price Section */}
        <div className="mb-4">
          {discount > 0 ? (
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(formData.price)}
              </span>
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(formData.compareAtPrice)}
              </span>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full flex items-center">
                <FiPercent className="w-3 h-3 mr-1" />
                {discount}% OFF
              </span>
            </div>
          ) : (
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(formData.price)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <StatusIcon className={`w-5 h-5 text-${stockStatus.color}-500 mr-2`} />
            <div>
              <span className={`text-sm font-medium text-${stockStatus.color}-700`}>
                {stockStatus.text}
              </span>
              {formData.quantity > 0 && (
                <p className="text-xs text-gray-500">
                  {formData.quantity} units available
                </p>
              )}
            </div>
          </div>
          {formData.allowBackorder && formData.quantity <= 0 && (
            <span className="text-xs text-gray-500">
              Ships in {formData.backorderLeadTime || 3} days
            </span>
          )}
        </div>

        {/* Short Description */}
        {formData.shortDescription && (
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-900">
              {formData.shortDescription}
            </p>
          </div>
        )}

        {/* Highlights */}
        {formData.highlights?.filter(h => h.trim()).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <FiStar className="w-4 h-4 text-yellow-500 mr-1" />
              Highlights
            </h4>
            <ul className="space-y-1">
              {formData.highlights.filter(h => h.trim()).map((highlight, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specifications Grid */}
        {formData.specifications?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <FiGrid className="w-4 h-4 text-gray-500 mr-1" />
              Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {formData.specifications.slice(0, 4).map((spec, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">{spec.name}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {spec.value} {spec.unit}
                  </p>
                </div>
              ))}
              {formData.specifications.length > 4 && (
                <button className="text-xs text-indigo-600 hover:text-indigo-800 col-span-2 text-center">
                  +{formData.specifications.length - 4} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categories & Tags */}
        <div className="mb-4 space-y-2">
          {formData.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.categories.map((cat, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {typeof cat === 'string' ? cat : cat.name || `Category ${index + 1}`}
                </span>
              ))}
            </div>
          )}

          {formData.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Shipping Info */}
        {formData.requiresShipping && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <FiTruck className="w-4 h-4 text-gray-500 mr-1" />
              Shipping Information
            </h4>
            <div className="space-y-1">
              {formData.freeShipping ? (
                <p className="text-sm text-green-600 font-medium">Free Shipping</p>
              ) : (
                <>
                  {formData.weight && (
                    <p className="text-sm text-gray-600">
                      Weight: {formData.weight} {formData.weightUnit}
                    </p>
                  )}
                  {formData.dimensions?.length && (
                    <p className="text-sm text-gray-600">
                      Dimensions: {formData.dimensions.length} x {formData.dimensions.width} x {formData.dimensions.height} {formData.dimensions.unit}
                    </p>
                  )}
                </>
              )}
              {formData.estimatedDelivery && (
                <p className="text-sm text-gray-600">
                  Estimated Delivery: {formData.estimatedDelivery.min}-{formData.estimatedDelivery.max} {formData.estimatedDelivery.unit}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Variants Preview */}
        {formData.hasVariants && formData.variants?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <FiPackage className="w-4 h-4 text-gray-500 mr-1" />
              Available Variants
            </h4>
            <div className="flex flex-wrap gap-2">
              {formData.variants.slice(0, 3).map((variant, index) => (
                <div key={index} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                  {variant.name}
                </div>
              ))}
              {formData.variants.length > 3 && (
                <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                  +{formData.variants.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          {formData.status === 'active' && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
              <FiCheckCircle className="w-3 h-3 mr-1" />
              Active
            </span>
          )}
          {formData.status === 'draft' && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center">
              <FiClock className="w-3 h-3 mr-1" />
              Draft
            </span>
          )}
          {formData.status === 'pending' && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
              <FiClock className="w-3 h-3 mr-1" />
              Pending Approval
            </span>
          )}
          {formData.featured && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
              <FiStar className="w-3 h-3 mr-1" />
              Featured
            </span>
          )}
          {formData.isNew && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
              <FiTag className="w-3 h-3 mr-1" />
              New
            </span>
          )}
          {formData.isBestSeller && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center">
              <FiShoppingBag className="w-3 h-3 mr-1" />
              Best Seller
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2">
          <button className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center">
            <FiShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </button>
          <button className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FiHeart className="w-5 h-5" />
          </button>
          <button className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FiShare2 className="w-5 h-5" />
          </button>
        </div>

        {/* Product Meta */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Product ID: {formData._id || 'Not saved yet'}</p>
          {formData.createdAt && (
            <p>Created: {new Date(formData.createdAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;