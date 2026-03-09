// components/home/HeroSection.jsx
import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [university, setUniversity] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}&university=${university}`);
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Buy & Sell on Campus
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            The largest student marketplace for textbooks, electronics, furniture, and more
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                <option value="">All Universities</option>
                <option value="uon">University of Nairobi</option>
                <option value="ku">Kenyatta University</option>
                <option value="strath">Strathmore University</option>
                <option value="jkuat">JKUAT</option>
                <option value="mku">Mount Kenya University</option>
                <option value="daystar">Daystar University</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!searchTerm.trim()}
            >
              Search
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className="flex justify-center gap-12 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold">10K+</div>
            <div className="text-white/80">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">5K+</div>
            <div className="text-white/80">Students</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">50+</div>
            <div className="text-white/80">Universities</div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mt-8 text-sm text-white/70">
          <span>✓ Verified Students</span>
          <span>✓ Secure Payments</span>
          <span>✓ Campus Delivery</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;