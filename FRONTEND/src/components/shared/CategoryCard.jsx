// src/components/shared/CategoryCard.jsx
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  const getIcon = () => {
    // You can map category names to icons
    return category.icon || '📚';
  };

  const getColor = () => {
    return category.color || 'bg-teal-500';
  };

  return (
    <Link to={`/category/${category.slug || category.name.toLowerCase()}`}>
      <div className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 text-center">
        <div className={`w-12 h-12 rounded-xl ${getColor()} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
          <span className="text-2xl">{getIcon()}</span>
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
        <p className="text-sm text-gray-500">
          {category.listingCount || 0} {category.listingCount === 1 ? 'item' : 'items'}
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;