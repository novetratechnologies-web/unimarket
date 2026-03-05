// admin/src/pages/categories/components/CategoryMedia.jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  FiImage, 
  FiUpload, 
  FiMaximize, 
  FiTrash2, 
  FiInfo,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw,
  FiDownload,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryMedia = ({ 
  formData, 
  onInputChange, 
  onImageChange, 
  imageFiles,
  imagePreviews = { image: null, banner: null, icon: null },
  errors,
  showToast 
}) => {
  const [altTexts, setAltTexts] = useState({
    image: '',
    banner: ''
  });
  const [activeLightbox, setActiveLightbox] = useState(null);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState({ image: false, banner: false, icon: false });
  const [imageDimensions, setImageDimensions] = useState({});
  const [showImageInfo, setShowImageInfo] = useState({});

  const fileInputs = {
    image: useRef(),
    banner: useRef(),
    icon: useRef()
  };

  const dropZoneRefs = {
    image: useRef(),
    banner: useRef(),
    icon: useRef()
  };

  // Update alt texts when formData changes - FIXED: Handle both string and object formats
  useEffect(() => {
    if (formData.image) {
      if (typeof formData.image === 'object' && formData.image.alt) {
        setAltTexts(prev => ({ ...prev, image: formData.image.alt }));
      } else if (typeof formData.image === 'string') {
        // If it's a string, no alt text
        setAltTexts(prev => ({ ...prev, image: '' }));
      }
    }
    if (formData.banner) {
      if (typeof formData.banner === 'object' && formData.banner.alt) {
        setAltTexts(prev => ({ ...prev, banner: formData.banner.alt }));
      } else if (typeof formData.banner === 'string') {
        setAltTexts(prev => ({ ...prev, banner: '' }));
      }
    }
  }, [formData.image, formData.banner]);

  // Handle file validation
  const validateFile = useCallback((file) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

    if (file.size > maxSize) {
      showToast?.('File size must be less than 2MB', { type: 'error' });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      showToast?.('File must be an image (JPEG, PNG, WebP, GIF, or SVG)', { type: 'error' });
      return false;
    }

    return true;
  }, [showToast]);

  // Get image dimensions
  const getImageDimensions = useCallback((file, type) => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions(prev => ({
        ...prev,
        [type]: { width: img.width, height: img.height }
      }));
      
      // Check recommended dimensions
      if (type === 'image' && (img.width < 400 || img.height < 400)) {
        showToast?.('Image is smaller than recommended (800x800)', { type: 'warning' });
      } else if (type === 'banner' && (img.width < 1200 || img.height < 250)) {
        showToast?.('Banner is smaller than recommended (1920x400)', { type: 'warning' });
      }
    };
    img.src = URL.createObjectURL(file);
  }, [showToast]);

  // Handle file select with progress simulation
  const handleFileSelect = (type, file) => {
    if (file && validateFile(file)) {
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev[type] >= 100) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, [type]: (prev[type] || 0) + 10 };
        });
      }, 100);

      getImageDimensions(file, type);

      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, [type]: 100 }));
        onImageChange(type, file);
        showToast?.(`${type} uploaded successfully`, { type: 'success' });
        
        setTimeout(() => {
          setUploadProgress(prev => ({ ...prev, [type]: null }));
        }, 1000);
      }, 1000);
    }
  };

  const handleRemoveImage = (type) => {
    onImageChange(type, null);
    if (fileInputs[type].current) {
      fileInputs[type].current.value = '';
    }
    setImageDimensions(prev => ({ ...prev, [type]: null }));
    if (type === 'image' || type === 'banner') {
      setAltTexts(prev => ({ ...prev, [type]: '' }));
      if (type === 'image') {
        onInputChange('image', null);
      } else if (type === 'banner') {
        onInputChange('banner', null);
      }
    }
    showToast?.(`${type} removed`, { type: 'info' });
  };

  const handleAltTextChange = (type, value) => {
    setAltTexts(prev => ({ ...prev, [type]: value }));
    
    if (type === 'image') {
      const currentImage = formData.image || {};
      onInputChange('image', { ...currentImage, alt: value });
    } else if (type === 'banner') {
      const currentBanner = formData.banner || {};
      onInputChange('banner', { ...currentBanner, alt: value });
    }
  };

  // Handle drag and drop
  const handleDrag = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(type, e.dataTransfer.files[0]);
    }
  };

  // Lightbox controls
  const openLightbox = (type) => {
    setActiveLightbox(type);
    setLightboxScale(1);
    setLightboxRotation(0);
  };

  const closeLightbox = () => {
    setActiveLightbox(null);
    setLightboxScale(1);
    setLightboxRotation(0);
  };

  const zoomIn = () => setLightboxScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setLightboxScale(prev => Math.max(prev - 0.25, 0.5));
  const rotate = () => setLightboxRotation(prev => (prev + 90) % 360);
  const resetImage = () => {
    setLightboxScale(1);
    setLightboxRotation(0);
  };

  const downloadImage = (type) => {
    const url = imagePreviews[type] || getImageUrl(formData[type]);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${Date.now()}.jpg`;
      a.click();
      showToast?.(`${type} downloaded`, { type: 'success' });
    }
  };

  // Helper function to safely get image URL - FIXED
  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (typeof image === 'object' && image.url) return image.url;
    return null;
  };

  // Helper function to check if image exists - FIXED
  const hasImage = (type) => {
    return !!(imageFiles[type] || 
              imagePreviews[type] || 
              getImageUrl(formData[type]) || 
              (type === 'icon' && getImageUrl(formData.iconImage)));
  };

  const ImageUploader = ({ type, label, description, aspectRatio }) => {
    // Get the appropriate image URL - FIXED
    const getPreviewUrl = () => {
      // Priority: 1. New upload preview, 2. Existing image URL
      if (imagePreviews[type]) return imagePreviews[type];
      
      const imageData = type === 'icon' ? formData.iconImage : formData[type];
      return getImageUrl(imageData);
    };

    const previewUrl = getPreviewUrl();
    const hasImageValue = hasImage(type);
    const progress = uploadProgress[type];
    const dimensions = imageDimensions[type];
    const isDragging = dragActive[type];
    const showInfo = showImageInfo[type];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-2 rounded-xl p-5 transition-all duration-300 ${
          hasImageValue ? 'border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white' : 'border-gray-200 hover:border-indigo-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center">
              {label}
              {hasImageValue && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  Uploaded
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          {hasImageValue && (
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openLightbox(type)}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Preview"
              >
                <FiEye className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => downloadImage(type)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Download"
              >
                <FiDownload className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowImageInfo(prev => ({ ...prev, [type]: !prev[type] }))}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Image info"
              >
                <FiInfo className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRemoveImage(type)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove image"
              >
                <FiTrash2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Image Info Panel */}
        <AnimatePresence>
          {showInfo && dimensions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-xs font-medium text-blue-800 mb-2">Image Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-blue-700">Dimensions:</div>
                  <div className="text-blue-900 font-medium">{dimensions.width} x {dimensions.height}px</div>
                  <div className="text-blue-700">Aspect Ratio:</div>
                  <div className="text-blue-900 font-medium">{(dimensions.width / dimensions.height).toFixed(2)}:1</div>
                  <div className="text-blue-700">File Size:</div>
                  <div className="text-blue-900 font-medium">
                    {imageFiles[type] ? (imageFiles[type].size / 1024).toFixed(1) : 'N/A'} KB
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress */}
        {progress !== null && progress !== undefined && progress < 100 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          ref={dropZoneRefs[type]}
          onDragEnter={(e) => handleDrag(type, e)}
          onDragLeave={(e) => handleDrag(type, e)}
          onDragOver={(e) => handleDrag(type, e)}
          onDrop={(e) => handleDrop(type, e)}
          onClick={() => fileInputs[type].current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer
            transition-all duration-300
            ${hasImageValue ? 'border-indigo-300' : isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'}
            ${aspectRatio === 'banner' ? 'h-40' : 'h-56'}
          `}
        >
          {previewUrl ? (
            <motion.div 
              className="relative w-full h-full group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={previewUrl}
                alt={type === 'icon' ? 'Icon preview' : altTexts[type] || label}
                className="w-full h-full object-contain bg-gray-50"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400?text=Error+loading+image';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  className="bg-white rounded-full p-3 shadow-lg"
                >
                  <FiMaximize className="w-6 h-6 text-indigo-600" />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center"
              animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <FiUpload className={`w-10 h-10 mb-3 transition-colors ${
                isDragging ? 'text-indigo-600' : 'text-gray-400'
              }`} />
              <p className={`text-sm font-medium transition-colors ${
                isDragging ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                {isDragging ? 'Drop to upload' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PNG, JPG, WebP, GIF up to 2MB
              </p>
            </motion.div>
          )}
        </div>

        <input
          ref={fileInputs[type]}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(type, file);
          }}
          className="hidden"
        />

        {errors?.[type] && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-sm text-red-600 flex items-center bg-red-50 p-2 rounded-lg"
          >
            <FiAlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {errors[type]}
          </motion.p>
        )}

        {/* File info */}
        {imageFiles[type] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-2 bg-gray-50 rounded-lg"
          >
            <p className="text-xs text-gray-600 flex items-center justify-between">
              <span className="font-medium truncate max-w-[200px]">{imageFiles[type].name}</span>
              <span className="text-gray-400">{(imageFiles[type].size / 1024).toFixed(1)} KB</span>
            </p>
          </motion.div>
        )}

        {/* Image dimensions info */}
        {type === 'image' && (
          <p className="mt-2 text-xs text-gray-400 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            Recommended: 800x800px square image
          </p>
        )}
        {type === 'banner' && (
          <p className="mt-2 text-xs text-gray-400 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            Recommended: 1920x400px banner (16:9 ratio)
          </p>
        )}
        {type === 'icon' && (
          <p className="mt-2 text-xs text-gray-400 flex items-center">
            <FiInfo className="w-3 h-3 mr-1" />
            Recommended: 64x64px icon (square)
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <div className="space-y-8">
        {/* Main Category Image */}
        <ImageUploader
          type="image"
          label="Category Image"
          description="Main image displayed for the category"
          aspectRatio="square"
        />

        {/* Banner Image */}
        <ImageUploader
          type="banner"
          label="Banner Image"
          description="Wide banner for category page header"
          aspectRatio="banner"
        />

        {/* Icon Image */}
        <ImageUploader
          type="icon"
          label="Icon Image"
          description="Small icon for menus and listings (optional)"
          aspectRatio="icon"
        />

        {/* Alt Text for Main Image */}
        {hasImage('image') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200"
          >
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FiInfo className="w-4 h-4 mr-2 text-indigo-600" />
              Image Alt Text
            </h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Main Image Alt Text
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={altTexts.image}
                  onChange={(e) => handleAltTextChange('image', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-24"
                  placeholder="e.g., 'Electronics category showing various gadgets'"
                  maxLength="125"
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full ${
                  altTexts.image.length > 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {altTexts.image.length}/125
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Helps with SEO and accessibility
                </p>
                {!altTexts.image && (
                  <span className="text-xs text-yellow-600 flex items-center">
                    <FiAlertCircle className="w-3 h-3 mr-1" />
                    Recommended for better SEO
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Alt Text for Banner */}
        {hasImage('banner') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200"
          >
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FiInfo className="w-4 h-4 mr-2 text-indigo-600" />
              Banner Alt Text
            </h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Banner Alt Text
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={altTexts.banner}
                  onChange={(e) => handleAltTextChange('banner', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-24"
                  placeholder="e.g., 'Seasonal sale banner for electronics'"
                  maxLength="125"
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full ${
                  altTexts.banner.length > 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {altTexts.banner.length}/125
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Helps with SEO and accessibility
                </p>
                {!altTexts.banner && (
                  <span className="text-xs text-yellow-600 flex items-center">
                    <FiAlertCircle className="w-3 h-3 mr-1" />
                    Recommended for better SEO
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Helper text for icon */}
        {!hasImage('icon') && !formData.iconImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5"
          >
            <p className="text-sm text-blue-800 flex items-start">
              <FiInfo className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>
                <strong className="block mb-1">💡 Tip:</strong> 
                The icon field in Basic Info accepts Font Awesome classes (e.g., "fas fa-folder"). 
                Upload an icon image here only if you want to use a custom image instead.
              </span>
            </p>
          </motion.div>
        )}

        {/* Icon upload info */}
        {(imageFiles.icon || imagePreviews.icon || formData.iconImage) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5"
          >
            <p className="text-sm text-green-800 flex items-start">
              <FiCheck className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-600" />
              <span>
                <strong className="block mb-1">✓ Custom icon uploaded:</strong>
                This will override the Font Awesome icon selected in the Basic Info tab.
              </span>
            </p>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-6xl max-h-[90vh] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Controls */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={zoomOut}
                  className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
                  title="Zoom Out"
                >
                  <FiZoomOut className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={zoomIn}
                  className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
                  title="Zoom In"
                >
                  <FiZoomIn className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={rotate}
                  className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
                  title="Rotate"
                >
                  <FiRotateCw className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetImage}
                  className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
                  title="Reset"
                >
                  <FiRefreshCw className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadImage(activeLightbox)}
                  className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
                  title="Download"
                >
                  <FiDownload className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeLightbox}
                  className="p-3 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
                  title="Close"
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Image */}
              <motion.img
                src={imagePreviews[activeLightbox] || getImageUrl(formData[activeLightbox])}
                alt={altTexts[activeLightbox] || 'Preview'}
                className="max-w-full max-h-[85vh] object-contain"
                style={{
                  scale: lightboxScale,
                  rotate: `${lightboxRotation}deg`,
                  transition: 'transform 0.3s ease'
                }}
              />

              {/* Image info overlay */}
              {imageDimensions[activeLightbox] && (
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-lg text-white px-4 py-2 rounded-lg text-sm">
                  {imageDimensions[activeLightbox].width} x {imageDimensions[activeLightbox].height}px
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CategoryMedia;