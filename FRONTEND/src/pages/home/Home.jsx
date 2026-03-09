// pages/Homepage.jsx
import React from 'react';
import HeroSection from './components/HeroSection';
import CategoryShowcase from './components/CategoryShowcase';
import FeaturedProducts from './components/FeaturedProducts';
import TrendingNow from './components/TrendingNow';
import SpecialOffers from './components/SpecialOffers';
import NewArrivals from './components/NewArrivals';
import TopRated from './components/TopRated';
import VendorSpotlight from './components/VendorSpotlight';
import CampusDeals from './components/CampusDeals';
import WhyChooseUs from './components/WhyChooseUs';
import Newsletter from './components/Newsletter';
import MobileApp from './components/MobileApp';

const Homepage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Full width with search */}
      <HeroSection />
      
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* Category Showcase - Visual category grid */}
        <CategoryShowcase />
        
        {/* Featured Products - Curated selection */}
        <FeaturedProducts />
        
        {/* Trending Now - Popular items */}
        <TrendingNow />
        
        {/* Special Offers - Discounted items */}
        <SpecialOffers />
        
        {/* New Arrivals - Latest products */}
        <NewArrivals />
        
        {/* Top Rated - Best reviewed products */}
        <TopRated />
        
        {/* Vendor Spotlight - Featured vendors */}
        <VendorSpotlight />
        
        {/* Campus Deals - University-specific deals */}
        <CampusDeals />
        
        {/* Why Choose Us - Value propositions */}
        <WhyChooseUs />
        
        {/* Newsletter Signup */}
        <Newsletter />
        
        {/* Mobile App Promotion */}
        <MobileApp />
      </div>
    </div>
  );
};

export default Homepage;