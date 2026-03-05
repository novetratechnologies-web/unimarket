// src/pages/Home.jsx - FIXED
import { useState, useEffect } from 'react';
// REMOVE this import: import HeaderMiddle from '../../components/layout/header/HeaderMiddle';
import HeroSection from '../../components/home/HeroSection';
import CategoriesSection from '../../components/home/CategoriesSection';
import FeaturedListings from '../../components/home/FeaturedListings';
import HowItWorks from '../../components/home/HowItWorks';
import UniversitySpotlight from '../../components/home/UniversitySpotlight';
import TestimonialsSection from '../../components/home/TestimonialsSection';
import CTASection from '../../components/home/CTASection';
// REMOVE this import: import Footer from '../../components/layout/footer/Footer';
import { api } from '../../api/index';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const Home = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        const [categoriesResponse, listingsResponse, universitiesResponse] = await Promise.all([
          api.get('/categories'),
          api.get('/featured-listings'),
          api.get('/universities')
        ]);

        setHomeData({
          categories: categoriesResponse.data?.categories || [],
          listings: listingsResponse.data?.listings || [],
          universities: universitiesResponse.data?.universities || [],
          stats: listingsResponse.data?.stats || {}
        });
        
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('Failed to load homepage data');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* REMOVE HeaderMiddle from loading state */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* REMOVE HeaderMiddle from error state */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Page</h3>
            <p className="text-gray-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* REMOVE HeaderMiddle from here */}
      
      <HeroSection stats={homeData.stats} />
      
      <CategoriesSection categories={homeData.categories} />
      
      <FeaturedListings 
        listings={homeData.listings}
        loading={loading}
      />
      
      <HowItWorks />
      
      <UniversitySpotlight universities={homeData.universities} />
      
      <TestimonialsSection />
      
      <CTASection />
      
      {/* REMOVE Footer from here - App.jsx already renders it */}
    </div>
  );
};

export default Home;