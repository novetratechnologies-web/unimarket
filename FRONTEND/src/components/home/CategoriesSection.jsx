// src/components/home/CategoriesSection.jsx
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CategoryCard from '../shared/CategoryCard';
import EmptyState from '../shared/EmptyState';

const CategoriesSection = ({ categories = [] }) => {
  if (categories.length === 0) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon="📚"
            title="No categories available"
            message="Categories will appear here once added by admin"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Browse Categories</h2>
            <p className="text-gray-600 mt-2">Find items by category</p>
          </div>
          <Link 
            to="/categories"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <CategoryCard key={category._id || category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;