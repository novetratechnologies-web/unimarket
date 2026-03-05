// src/components/shared/UniversityCard.jsx
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

const UniversityCard = ({ university }) => {
  return (
    <Link to={`/university/${university._id || university.id}`}>
      <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="relative h-64 overflow-hidden">
          <img 
            src={university.image || 'https://via.placeholder.com/400x300'}
            alt={university.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-xl font-bold mb-2">{university.name}</h3>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>{university.listingCount || 0} listings</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default UniversityCard;