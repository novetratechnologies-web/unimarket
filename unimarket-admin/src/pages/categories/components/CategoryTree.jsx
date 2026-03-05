// admin/src/pages/categories/components/CategoryTree.jsx
import React from 'react';
import { 
  FiFolder, 
  FiChevronRight, 
  FiChevronDown, 
  FiEdit2, 
  FiEye, 
  FiEyeOff,
  FiStar,
  FiGrid
} from 'react-icons/fi';

const CategoryTree = ({ 
  categories, 
  selectedCategory, 
  onSelect,
  expandedNodes,
  setExpandedNodes,
  viewMode = 'tree'
}) => {
  const toggleNode = (categoryId, e) => {
    e.stopPropagation();
    setExpandedNodes(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getCategoryIcon = (category) => {
    if (!category.settings?.isActive) return 'text-gray-400';
    if (category.settings?.isFeatured) return 'text-yellow-500';
    if (category.children?.length > 0) return 'text-indigo-500';
    return 'text-blue-500';
  };

  const renderTreeView = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.includes(category._id);
    const isSelected = selectedCategory?._id === category._id;
    const hasProducts = category.stats?.productCount > 0;

    return (
      <div key={category._id} className="select-none">
        <div
          onClick={() => onSelect(category)}
          className={`
            flex items-center py-2 px-2 rounded-lg cursor-pointer group
            transition-all duration-200
            ${level > 0 ? 'ml-6' : ''}
            ${isSelected 
              ? 'bg-indigo-50 border border-indigo-200 shadow-sm' 
              : 'hover:bg-gray-50 border border-transparent'
            }
          `}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleNode(category._id, e)}
              className="p-1 hover:bg-gray-200 rounded mr-1 transition-colors"
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <FiChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          {/* Category icon */}
          <FiFolder className={`w-4 h-4 mr-2 ${getCategoryIcon(category)}`} />
          
          {/* Category name */}
          <span className={`flex-1 text-sm font-medium ${
            !category.settings?.isActive ? 'text-gray-400 line-through' : 'text-gray-700'
          }`}>
            {category.name}
          </span>
          
          {/* Status indicators */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {category.settings?.isFeatured && (
              <FiStar className="w-3 h-3 text-yellow-500" title="Featured" />
            )}
            {!category.settings?.isVisible && (
              <FiEyeOff className="w-3 h-3 text-gray-400" title="Hidden" />
            )}
            {hasProducts && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {category.stats.productCount}
              </span>
            )}
            {category.attributes?.length > 0 && (
              <FiGrid className="w-3 h-3 text-purple-500" title="Has attributes" />
            )}
          </div>
          
          {/* Edit indicator */}
          {isSelected && (
            <FiEdit2 className="w-3 h-3 ml-2 text-indigo-600" />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children.map(child => 
              renderTreeView(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderListView = (category, level = 0) => {
    const isSelected = selectedCategory?._id === category._id;

    return (
      <React.Fragment key={category._id}>
        <div
          onClick={() => onSelect(category)}
          className={`
            flex items-center py-2 px-4 cursor-pointer group
            transition-colors duration-200
            ${isSelected 
              ? 'bg-indigo-50' 
              : 'hover:bg-gray-50'
            }
          `}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <FiFolder className={`w-4 h-4 mr-3 ${getCategoryIcon(category)}`} />
          <span className={`flex-1 text-sm ${
            !category.settings?.isActive ? 'text-gray-400 line-through' : 'text-gray-700'
          }`}>
            {category.name}
          </span>
          <div className="flex items-center space-x-2">
            {category.settings?.isFeatured && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
            {hasProducts && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {category.stats.productCount} products
              </span>
            )}
          </div>
        </div>
        {category.children?.map(child => renderListView(child, level + 1))}
      </React.Fragment>
    );
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8">
        <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No categories to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {viewMode === 'tree' 
        ? categories.map(category => renderTreeView(category))
        : categories.map(category => renderListView(category))
      }
    </div>
  );
};

export default CategoryTree;