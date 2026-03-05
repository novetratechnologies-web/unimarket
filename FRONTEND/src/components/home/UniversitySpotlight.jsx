// src/components/home/UniversitySpotlight.jsx
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import UniversityCard from '../shared/UniversityCard';
import EmptyState from '../shared/EmptyState';

const UniversitySpotlight = ({ universities = [] }) => {
  if (universities.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon="🏫"
            title="No universities yet"
            message="University listings will appear here"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-teal-600" />
              <h2 className="text-3xl font-bold text-gray-900">University Spotlight</h2>
            </div>
            <p className="text-gray-600">Popular items from different campuses</p>
          </div>
          <Link 
            to="/universities"
            className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-2"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {universities.map((university) => (
            <UniversityCard key={university._id || university.id} university={university} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UniversitySpotlight;