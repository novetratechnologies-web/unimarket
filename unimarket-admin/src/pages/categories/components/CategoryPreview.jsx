// admin/src/pages/categories/components/CategoryPreview.jsx
import React, { useState } from 'react';
import { 
  FiGrid, 
  FiList, 
  FiFilter,
  FiStar,
  FiShoppingBag,
  FiEye,
  FiHeart,
  FiShare2
} from 'react-icons/fi';

const CategoryPreview = ({ formData, categories }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFilters, setSelectedFilters] = useState({});

  // Mock products for preview
  const mockProducts = [
    { id: 1, name: 'Sample Product 1', price: 99.99, rating: 4.5, image: null },
    { id: 2, name: 'Sample Product 2', price: 149.99, rating: 4.8, image: null },
    { id: 3, name: 'Sample Product 3', price: 79.99, rating: 4.2, image: null },
    { id: 4, name: 'Sample Product 4', price: 199.99, rating: 4.9, image: null },
    { id: 5, name: 'Sample Product 5', price: 59.99, rating: 4.0, image: null },
    { id: 6, name: 'Sample Product 6', price: 299.99, rating: 5.0, image: null }
  ];

  // Find parent category name
  const findParentName = (parentId) => {
    if (!parentId) return null;
    
    const findCategory = (cats) => {
      for (const cat of cats) {
        if (cat._id === parentId) return cat.name;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findCategory(categories);
  };

  const parentName = findParentName(formData.parent);

  // Breadcrumb generation
  const generateBreadcrumb = () => {
    const breadcrumb = [
      { name: 'Home', slug: '/' },
      { name: 'Categories', slug: '/categories' }
    ];
    
    if (parentName) {
      breadcrumb.push({ name: parentName, slug: '#' });
    }
    
    breadcrumb.push({ name: formData.name || 'New Category', slug: '#' });
    
    return breadcrumb;
  };

  const breadcrumb = generateBreadcrumb();

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-indigo-900">Live Preview</h3>
          <p className="text-sm text-indigo-700">
            This is how your category will look on the frontend
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            <FiGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            <FiList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Banner */}
        {formData.banner && (
          <div className="h-48 bg-gray-100 relative">
            {typeof formData.banner === 'string' ? (
              <img
                src={formData.banner}
                alt={formData.name}
                className="w-full h-full object-cover"
              />
            ) : formData.banner && (
              <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <p className="text-white text-xl font-bold">Banner Preview</p>
              </div>
            )}
            
            {/* Banner Text Overlay */}
            {formData.content?.bannerText && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="text-center text-white">
                  <h2 className="text-3xl font-bold mb-2">{formData.content.bannerText}</h2>
                  {formData.content.bannerLink && (
                    <a href="#" className="inline-block px-6 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100">
                      Shop Now
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Info */}
        <div className="p-6">
          {/* Breadcrumb */}
          <nav className="flex mb-4 text-sm">
            <ol className="flex items-center space-x-2">
              {breadcrumb.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <li>
                    <a
                      href="#"
                      className={`hover:text-indigo-600 ${
                        index === breadcrumb.length - 1 
                          ? 'text-gray-900 font-medium' 
                          : 'text-gray-500'
                      }`}
                    >
                      {item.name}
                    </a>
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>

          {/* Title and Description */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {formData.name || 'Category Name'}
              </h1>
              {formData.description && (
                <p className="text-gray-600 max-w-2xl">
                  {formData.description}
                </p>
              )}
            </div>
            
            {/* Category Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-gray-900">24</p>
                <p className="text-gray-500">Products</p>
              </div>
              {formData.settings?.isFeatured && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center">
                  <FiStar className="w-4 h-4 mr-1" />
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Header Content */}
          {formData.content?.header && (
            <div className="prose max-w-none mb-6 p-4 bg-gray-50 rounded-lg">
              <div dangerouslySetInnerHTML={{ 
                __html: formData.content.header
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br />')
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {formData.attributes?.length > 0 && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <FiFilter className="w-4 h-4 mr-2 text-indigo-600" />
                Filters
              </h3>
              
              <div className="space-y-4">
                {formData.attributes
                  .filter(attr => attr.isFilterable)
                  .map(attr => (
                    <div key={attr._id}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {attr.name}
                        {attr.unit && <span className="text-xs text-gray-500 ml-1">({attr.unit})</span>}
                      </h4>
                      
                      {attr.type === 'color' && (
                        <div className="flex flex-wrap gap-2">
                          {attr.options?.map(opt => (
                            <button
                              key={opt.value}
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                              style={{ backgroundColor: opt.color || '#ccc' }}
                              title={opt.label || opt.value}
                            />
                          ))}
                        </div>
                      )}
                      
                      {attr.type === 'size' && (
                        <div className="flex flex-wrap gap-2">
                          {attr.options?.map(opt => (
                            <button
                              key={opt.value}
                              className="px-3 py-1 border border-gray-300 rounded hover:border-indigo-500 hover:text-indigo-600"
                            >
                              {opt.label || opt.value}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {(attr.type === 'select' || attr.type === 'multiselect') && (
                        <div className="space-y-2">
                          {attr.options?.map(opt => (
                            <label key={opt.value} className="flex items-center space-x-2">
                              <input
                                type={attr.type === 'multiselect' ? 'checkbox' : 'radio'}
                                name={`filter-${attr._id}`}
                                className="rounded border-gray-300 text-indigo-600"
                              />
                              <span className="text-sm text-gray-600">{opt.label || opt.value}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {attr.type === 'range' && (
                        <div>
                          <input
                            type="range"
                            min={attr.validation?.min || 0}
                            max={attr.validation?.max || 100}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{attr.validation?.min || 0}</span>
                            <span>{attr.validation?.max || 100}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">1-6</span> of{' '}
                <span className="font-medium text-gray-900">24</span> products
              </p>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
                <option>Best Selling</option>
              </select>
            </div>

            {/* Products */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {mockProducts.map(product => (
                <div
                  key={product.id}
                  className={`group cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow'
                      : 'flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md'
                  }`}
                >
                  {/* Product Image */}
                  <div className={viewMode === 'grid' ? 'aspect-square bg-gray-100' : 'w-24 h-24 bg-gray-100 rounded'}>
                    <div className="w-full h-full flex items-center justify-center">
                      <FiShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className={viewMode === 'grid' ? 'p-4' : 'flex-1'}>
                    <h3 className="font-medium text-gray-900 mb-1 group-hover:text-indigo-600">
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating) ? 'fill-current' : ''
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {product.rating}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price}
                      </span>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                          <FiHeart className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">3</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      {formData.content?.footer && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: formData.content.footer
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br />')
            }} />
          </div>
        </div>
      )}

      {/* Missing Info Warning */}
      {!formData.name && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Complete the basic information to see a full preview
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryPreview;