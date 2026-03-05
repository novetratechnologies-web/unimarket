// src/components/home/CTASection.jsx
import { Link } from 'react-router-dom';
import { Shield, Truck, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CTASection = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-4xl font-bold mb-6">Ready to Join Campus Commerce?</h2>
        <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto">
          Thousands of students are already buying and selling on our platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated() ? (
            <>
              <Link 
                to="/sell"
                className="bg-white text-teal-700 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg"
              >
                List an Item
              </Link>
              <Link 
                to="/listings"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
              >
                Browse Marketplace
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/register"
                className="bg-white text-teal-700 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg"
              >
                Join Free
              </Link>
              <Link 
                to="/login"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
        
        <div className="mt-8 text-teal-200 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>Verified Students</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            <span>Campus Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span>Secure Chat</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;