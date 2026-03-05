// components/admin/products/tabs/MediaTab.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FiImage, 
  FiVideo, 
  FiFile, 
  FiUpload,
  FiPlus, 
  FiX, 
  FiStar, 
  FiTrash2, 
  FiMove,
  FiEye,
  FiLink,
  FiYoutube,
  FiPlay,
  FiFileText,
  FiFilePlus,
  FiCheck,
  FiAlertCircle,
  FiMaximize2,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiEdit2,
  FiExternalLink
} from 'react-icons/fi';

const MediaTab = ({ formData, onInputChange, errors }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [editingImageId, setEditingImageId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize arrays if they don't exist with safe defaults
  const images = Array.isArray(formData.images) ? formData.images : [];
  const videos = Array.isArray(formData.videos) ? formData.videos : [];
  const documents = Array.isArray(formData.documents) ? formData.documents : [];

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
        if (image?.thumbnailUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(image.thumbnailUrl);
        }
      });
    };
  }, [images]);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    
    const newImages = [...images];
    
    for (const file of acceptedFiles) {
      // Create object URL for preview
      const previewUrl = URL.createObjectURL(file);
      
      const newImage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url: previewUrl,
        thumbnailUrl: previewUrl,
        mediumUrl: previewUrl,
        largeUrl: previewUrl,
        alt: file.name,
        title: file.name,
        caption: '',
        isPrimary: images.length === 0 && newImages.length === 0,
        sortOrder: newImages.length,
        size: file.size,
        format: file.type.split('/')[1] || file.name.split('.').pop() || 'unknown',
        uploadedAt: new Date().toISOString(),
        isUploading: true,
        _file: file,
        tags: []
      };
      
      newImages.push(newImage);
      onInputChange('images', newImages);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));
        
        if (progress >= 100) {
          clearInterval(interval);
          
          setTimeout(() => {
            const updatedImages = newImages.map(img => 
              img.id === newImage.id 
                ? { ...img, isUploading: false }
                : img
            );
            onInputChange('images', updatedImages);
            
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          }, 500);
        }
      }, 200);
    }
    
    setUploading(false);
  }, [images, onInputChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg', '.bmp']
    },
    maxSize: 10485760, // 10MB
    multiple: true
  });

  const removeImage = (id) => {
    const imageToRemove = images.find(img => img.id === id);
    
    if (imageToRemove?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    if (imageToRemove?.thumbnailUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.thumbnailUrl);
    }
    
    const newImages = images.filter(img => img.id !== id);
    
    if (imageToRemove?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    onInputChange('images', newImages);
    
    if (selectedImage === id) {
      setSelectedImage(null);
    }
    if (editingImageId === id) {
      setEditingImageId(null);
    }
  };

  const setPrimaryImage = (id) => {
    const newImages = images.map(img => ({
      ...img,
      isPrimary: img.id === id
    }));
    onInputChange('images', newImages);
  };

  const updateImageField = (id, field, value) => {
    const newImages = images.map(img => 
      img.id === id ? { ...img, [field]: value } : img
    );
    onInputChange('images', newImages);
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50', 'border-indigo-500');
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    e.currentTarget.classList.remove('opacity-50', 'border-indigo-500');
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over', 'border-indigo-500', 'bg-indigo-50');
    });
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over', 'border-indigo-500', 'bg-indigo-50');
    });
    
    e.currentTarget.classList.add('drag-over', 'border-indigo-500', 'bg-indigo-50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over', 'border-indigo-500', 'bg-indigo-50');
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over', 'border-indigo-500', 'bg-indigo-50');
    
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;
    
    const newImages = [...images];
    const [draggedImage] = newImages.splice(sourceIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);
    
    newImages.forEach((img, i) => {
      img.sortOrder = i;
    });
    
    onInputChange('images', newImages);
    setDraggedItem(null);
  };

  const handleImageClick = (image) => {
    setLightboxImage(image);
    setLightboxOpen(true);
  };

  const addVideo = () => {
    const newVideos = [...videos];
    newVideos.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: '',
      embedUrl: '',
      title: '',
      description: '',
      platform: 'youtube',
      thumbnailUrl: '',
      videoId: '',
      duration: null,
      sortOrder: videos.length,
      autoplay: false,
      loop: false,
      mute: false,
      uploadedAt: new Date().toISOString()
    });
    onInputChange('videos', newVideos);
  };

  const updateVideo = (index, field, value) => {
    const newVideos = [...videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    
    if (field === 'url' && value) {
      const videoInfo = extractVideoInfo(value);
      if (videoInfo) {
        newVideos[index].platform = videoInfo.platform;
        newVideos[index].videoId = videoInfo.id;
        newVideos[index].embedUrl = videoInfo.embedUrl;
        newVideos[index].thumbnailUrl = videoInfo.thumbnailUrl;
        
        if (!newVideos[index].title) {
          newVideos[index].title = videoInfo.title || `Video ${index + 1}`;
        }
      }
    }
    
    onInputChange('videos', newVideos);
  };

  const removeVideo = (index) => {
    const newVideos = videos.filter((_, i) => i !== index);
    onInputChange('videos', newVideos);
  };

  const extractVideoInfo = (url) => {
    if (!url) return null;
    
    // YouTube
    let match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (match && match[2] && match[2].length === 11) {
      return {
        platform: 'youtube',
        id: match[2],
        embedUrl: `https://www.youtube.com/embed/${match[2]}`,
        thumbnailUrl: `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`,
        title: 'YouTube Video'
      };
    }
    
    // Vimeo
    match = url.match(/^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/);
    if (match && match[5]) {
      return {
        platform: 'vimeo',
        id: match[5],
        embedUrl: `https://player.vimeo.com/video/${match[5]}`,
        thumbnailUrl: `https://vumbnail.com/${match[5]}.jpg`,
        title: 'Vimeo Video'
      };
    }
    
    return null;
  };

  // ✅ FIXED: Document functions with proper number handling
  const addDocument = () => {
    const newDocs = [...documents];
    newDocs.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: '',
      title: '',
      description: '',
      fileType: 'pdf',
      fileSize: 0, // Changed from null to 0
      pages: 0,    // Changed from null to 0
      sortOrder: documents.length,
      uploadedAt: new Date().toISOString()
    });
    onInputChange('documents', newDocs);
  };

  const updateDocument = (index, field, value) => {
    const newDocs = [...documents];
    
    // Parse numeric fields
    if (field === 'fileSize' || field === 'pages') {
      // Convert empty string or invalid values to 0
      const numValue = value === '' || value === null || value === undefined 
        ? 0 
        : Number(value);
      newDocs[index] = { ...newDocs[index], [field]: isNaN(numValue) ? 0 : numValue };
    } else {
      newDocs[index] = { ...newDocs[index], [field]: value };
    }
    
    onInputChange('documents', newDocs);
  };

  const removeDocument = (index) => {
    const newDocs = documents.filter((_, i) => i !== index);
    onInputChange('documents', newDocs);
  };

  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FiFileText className="w-6 h-6 text-red-500" />;
      case 'manual':
      case 'spec':
        return <FiFileText className="w-6 h-6 text-blue-500" />;
      case 'cert':
        return <FiFileText className="w-6 h-6 text-green-500" />;
      default:
        return <FiFile className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Helper functions for upload
  const getUploadFiles = () => {
    return images
      .filter(img => img._file instanceof File)
      .map(img => img._file);
  };

  const getCleanImages = () => {
    return images.map(img => {
      const cleanImg = { ...img };
      delete cleanImg._file;
      return cleanImg;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-100 mr-4">
            <FiImage className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Media & Assets</h3>
            <p className="text-sm text-gray-600">
              Upload product images, videos, documents, and 3D models. High-quality media helps customers make informed decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiImage className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Product Images</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {images.length} / 10
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'grid' ? 'List view' : 'Grid view'}
              >
                {viewMode === 'grid' ? <FiList className="w-4 h-4" /> : <FiGrid className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <FiUpload className="w-4 h-4 mr-2" />
                Upload Images
              </button>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            {uploading ? (
              <div className="text-gray-600">
                <FiRefreshCw className="animate-spin h-10 w-10 mx-auto text-indigo-600" />
                <p className="mt-3 text-sm font-medium">Uploading...</p>
              </div>
            ) : (
              <div>
                <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                  <FiUpload className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-base font-medium text-gray-700">
                  {isDragActive ? 'Drop files here' : 'Drag & drop images or click to browse'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  PNG, JPG, GIF, WEBP up to 10MB
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  First image will be used as the product thumbnail
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 space-y-3">
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      {filename}
                    </span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="mt-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      draggable={!image.isUploading}
                      onDragStart={(e) => !image.isUploading && handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => !image.isUploading && handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => !image.isUploading && handleDrop(e, index)}
                      className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        !image.isUploading ? 'cursor-move' : 'cursor-default'
                      } ${
                        image.isPrimary 
                          ? 'border-indigo-500 shadow-lg' 
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      } ${draggedItem === index ? 'opacity-50' : ''}`}
                    >
                      <div className="aspect-square bg-gray-100">
                        {image.isUploading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <FiRefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                          </div>
                        ) : (
                          <img
                            src={image.thumbnailUrl || image.url}
                            alt={image.alt || ''}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => handleImageClick(image)}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300?text=Image+Error';
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          {!image.isPrimary && !image.isUploading && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryImage(image.id);
                              }}
                              className="p-2 bg-white rounded-full hover:bg-indigo-50 transition-colors shadow-lg"
                              title="Set as primary"
                            >
                              <FiStar className="w-4 h-4 text-indigo-600" />
                            </button>
                          )}
                          {!image.isUploading && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingImageId(editingImageId === image.id ? null : image.id);
                              }}
                              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                              title="Edit details"
                            >
                              <FiEdit2 className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(image.id);
                            }}
                            className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors shadow-lg"
                            title="Remove"
                          >
                            <FiTrash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Primary badge */}
                      {image.isPrimary && !image.isUploading && (
                        <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-lg">
                          <FiStar className="w-3 h-3 mr-1" />
                          Primary
                        </div>
                      )}

                      {/* Uploading badge */}
                      {image.isUploading && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-lg">
                          <FiRefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Uploading
                        </div>
                      )}

                      {/* Drag handle */}
                      {!image.isUploading && (
                        <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <FiMove className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                      )}

                      {/* Image info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-xs text-white truncate">
                          {image.alt || image.title || `Image ${index + 1}`}
                        </p>
                      </div>

                      {/* Edit panel */}
                      {editingImageId === image.id && !image.isUploading && (
                        <div className="absolute inset-0 bg-white p-3 overflow-y-auto z-10">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Alt Text
                              </label>
                              <input
                                type="text"
                                value={image.alt || ''}
                                onChange={(e) => updateImageField(image.id, 'alt', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                placeholder="Image description"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={image.title || ''}
                                onChange={(e) => updateImageField(image.id, 'title', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                placeholder="Image title"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Caption
                              </label>
                              <input
                                type="text"
                                value={image.caption || ''}
                                onChange={(e) => updateImageField(image.id, 'caption', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                placeholder="Image caption"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingImageId(null)}
                              className="w-full px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // List view
                <div className="space-y-2">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      draggable={!image.isUploading}
                      onDragStart={(e) => !image.isUploading && handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => !image.isUploading && handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => !image.isUploading && handleDrop(e, index)}
                      className={`flex items-center p-3 rounded-lg border ${
                        !image.isUploading ? 'cursor-move' : 'cursor-default'
                      } ${
                        image.isPrimary 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-indigo-300'
                      } ${draggedItem === index ? 'opacity-50' : ''}`}
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {image.isUploading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <FiRefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                          </div>
                        ) : (
                          <img
                            src={image.thumbnailUrl || image.url}
                            alt={image.alt || ''}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => handleImageClick(image)}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300?text=Error';
                            }}
                          />
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.title || `Image ${index + 1}`}
                          {image.isUploading && <span className="ml-2 text-xs text-yellow-600">(Uploading...)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {image.alt || 'No alt text'} • {image.format?.toUpperCase() || 'Unknown'} • {formatFileSize(image.size)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {!image.isUploading && <FiMove className="w-4 h-4 text-gray-400" />}
                        {!image.isPrimary && !image.isUploading && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(image.id)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Set as primary"
                          >
                            <FiStar className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Remove"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reorder hint */}
              <p className="mt-3 text-xs text-gray-500 flex items-center">
                <FiMove className="w-3 h-3 mr-1" />
                Drag images to reorder. First image is used as thumbnail.
              </p>
            </div>
          )}

          {images.length === 0 && (
            <div className="mt-6 text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No images uploaded yet</p>
              <p className="text-xs text-gray-400">Upload high-quality product images to showcase your product</p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && lightboxImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <FiX className="w-8 h-8" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute inset-0 w-full h-full"
          />
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={lightboxImage.largeUrl || lightboxImage.url}
              alt={lightboxImage.alt || ''}
              className="max-w-full max-h-[90vh] object-contain relative z-20"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/800?text=Image+Error';
              }}
            />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black bg-opacity-50 py-2 px-4 mx-auto w-fit rounded-full z-20">
              <p className="text-sm">{lightboxImage.alt || lightboxImage.title || 'Product image'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Videos Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiVideo className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Product Videos</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                {videos.length} videos
              </span>
            </div>
            <button
              type="button"
              onClick={addVideo}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Video
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {videos.map((video, index) => (
              <div key={video.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    {video.platform === 'youtube' ? (
                      <FiYoutube className="w-5 h-5 text-red-600 mr-2" />
                    ) : (
                      <FiVideo className="w-5 h-5 text-indigo-600 mr-2" />
                    )}
                    <h5 className="text-sm font-medium text-gray-900">
                      {video.title || `Video ${index + 1}`}
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Video URL
                    </label>
                    <div className="relative">
                      <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={video.url || ''}
                        onChange={(e) => updateVideo(index, 'url', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={video.title || ''}
                      onChange={(e) => updateVideo(index, 'title', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Video title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Platform
                    </label>
                    <select
                      value={video.platform || 'youtube'}
                      onChange={(e) => updateVideo(index, 'platform', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={video.description || ''}
                      onChange={(e) => updateVideo(index, 'description', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Video description"
                    />
                  </div>
                </div>

                {/* Video Preview */}
                {video.thumbnailUrl && (
                  <div className="mt-4 relative group">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title || ''}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x150?text=Video+Preview';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <FiPlay className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )}

                {/* Video settings */}
                <div className="mt-4 flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={video.autoplay || false}
                      onChange={(e) => updateVideo(index, 'autoplay', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-600">Autoplay</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={video.loop || false}
                      onChange={(e) => updateVideo(index, 'loop', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-600">Loop</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={video.mute || false}
                      onChange={(e) => updateVideo(index, 'mute', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-600">Muted</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {videos.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiVideo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No videos added yet</p>
              <p className="text-xs text-gray-400">Add product videos from YouTube, Vimeo, or other platforms</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiFile className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Documents</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                {documents.length} files
              </span>
            </div>
            <button
              type="button"
              onClick={addDocument}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <FiFilePlus className="w-4 h-4 mr-2" />
              Add Document
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getFileIcon(doc.fileType)}
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-gray-900">
                        {doc.title || `Document ${index + 1}`}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {doc.fileType?.toUpperCase() || 'Unknown'} • {formatFileSize(doc.fileSize)}
                        {doc.pages > 0 && ` • ${doc.pages} pages`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Open document"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Document URL
                    </label>
                    <input
                      type="url"
                      value={doc.url || ''}
                      onChange={(e) => updateDocument(index, 'url', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={doc.title || ''}
                      onChange={(e) => updateDocument(index, 'title', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Document title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      File Type
                    </label>
                    <select
                      value={doc.fileType || 'pdf'}
                      onChange={(e) => updateDocument(index, 'fileType', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="manual">User Manual</option>
                      <option value="spec">Specification Sheet</option>
                      <option value="cert">Certificate</option>
                      <option value="datasheet">Datasheet</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={doc.description || ''}
                      onChange={(e) => updateDocument(index, 'description', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Brief description"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      File Size (bytes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={doc.fileSize || 0}
                      onChange={(e) => updateDocument(index, 'fileSize', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Number of Pages
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={doc.pages || 0}
                      onChange={(e) => updateDocument(index, 'pages', e.target.value)}
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {documents.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiFile className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No documents added yet</p>
              <p className="text-xs text-gray-400">Add manuals, spec sheets, certificates, or other documents</p>
            </div>
          )}
        </div>
      </div>

      {/* 3D Model / AR Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center">
            <FiMaximize2 className="w-5 h-5 text-indigo-600 mr-2" />
            <h4 className="text-md font-medium text-gray-900">3D Model & AR</h4>
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              Advanced
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="threeDModel" className="block text-sm font-medium text-gray-700 mb-1">
                3D Model URL
              </label>
              <div className="relative">
                <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  id="threeDModel"
                  value={formData.threeDModel?.url || ''}
                  onChange={(e) => onInputChange('threeDModel', {
                    ...(formData.threeDModel || {}),
                    url: e.target.value
                  })}
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Supports .glb, .gltf, .usdz formats</p>
            </div>

            <div>
              <label htmlFor="modelFormat" className="block text-sm font-medium text-gray-700 mb-1">
                Model Format
              </label>
              <select
                id="modelFormat"
                value={formData.threeDModel?.format || 'glb'}
                onChange={(e) => onInputChange('threeDModel', {
                  ...(formData.threeDModel || {}),
                  format: e.target.value
                })}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="glb">GLB</option>
                <option value="gltf">GLTF</option>
                <option value="usdz">USDZ</option>
                <option value="obj">OBJ</option>
                <option value="fbx">FBX</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <input
              id="enableAR"
              type="checkbox"
              checked={formData.augmentedReality?.enabled || false}
              onChange={(e) => onInputChange('augmentedReality', {
                ...(formData.augmentedReality || {}),
                enabled: e.target.checked
              })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="enableAR" className="text-sm text-gray-700">
              Enable Augmented Reality (AR) view
            </label>
          </div>

          {formData.augmentedReality?.enabled && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="arUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  AR Model URL
                </label>
                <div className="relative">
                  <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    id="arUrl"
                    value={formData.augmentedReality?.url || ''}
                    onChange={(e) => onInputChange('augmentedReality', {
                      ...(formData.augmentedReality || {}),
                      url: e.target.value
                    })}
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label htmlFor="arScale" className="block text-sm font-medium text-gray-700 mb-1">
                  AR Scale
                </label>
                <input
                  type="number"
                  id="arScale"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={formData.augmentedReality?.scale || 1}
                  onChange={(e) => onInputChange('augmentedReality', {
                    ...(formData.augmentedReality || {}),
                    scale: parseFloat(e.target.value) || 1
                  })}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FiEye className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Media Summary</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{images.length}</div>
            <div className="text-xs text-gray-500">Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{videos.length}</div>
            <div className="text-xs text-gray-500">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{documents.length}</div>
            <div className="text-xs text-gray-500">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {formData.threeDModel?.url ? 1 : 0}
            </div>
            <div className="text-xs text-gray-500">3D Models</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaTab;