// src/components/home/HeroSection.jsx
import { Search, Shield, MapPin, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HeroSection = ({ stats = {} }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSellClick = () => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/sell');
    } else {
      navigate('/sell');
    }
  };

  return (
    <section className="relative bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted Campus Marketplace</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Campus Commerce
              <span className="block text-teal-200 mt-2">Made Simple</span>
            </h1>
            
            <p className="text-xl text-teal-100 mb-8 max-w-xl">
              Buy, sell, and trade with verified university students. Safe, secure, and campus-focused.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <div className="text-2xl font-bold">{stats.totalListings || '1K+'}</div>
                <div className="text-sm text-teal-200">Active Listings</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalUsers || '500+'}</div>
                <div className="text-sm text-teal-200">Verified Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalCategories || '20+'}</div>
                <div className="text-sm text-teal-200">Categories</div>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                <div className="pl-4">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search textbooks, electronics, furniture..."
                  className="flex-1 py-4 px-4 outline-none text-gray-700 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="bg-teal-600 text-white px-8 py-4 font-semibold hover:bg-teal-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSellClick}
                className="bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-all shadow-lg"
              >
                List an Item
              </button>
              <button
                onClick={() => navigate('/categories')}
                className="bg-white/20 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
              >
                Browse Categories
              </button>
            </div>
          </div>

          {/* Right Content - Visual Element */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {/* You can add product images or campus scenes here */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-teal-200" />
                    <div className="text-lg font-bold text-white">Verified</div>
                  </div>
                  <div className="text-teal-200 text-sm">Student accounts only</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-teal-200" />
                    <div className="text-lg font-bold text-white">Campus Focus</div>
                  </div>
                  <div className="text-teal-200 text-sm">Local pickup available</div>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-teal-200" />
                    <div className="text-lg font-bold text-white">Great Deals</div>
                  </div>
                  <div className="text-teal-200 text-sm">Up to 70% off retail</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-lg font-bold text-white">24/7</div>
                  <div className="text-teal-200 text-sm">Support available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-20" viewBox="0 0 1440 120" fill="none">
          <path d="M0 60L60 52C120 44 240 28 360 28C480 28 600 44 720 44C840 44 960 28 1080 28C1200 28 1320 44 1380 52L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V60Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;