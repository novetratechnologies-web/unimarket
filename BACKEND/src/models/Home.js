// models/Home.js - For homepage configuration
import mongoose from 'mongoose';

const homeSchema = new mongoose.Schema({
  // Hero Section
  heroTitle: { type: String, default: 'Buy & Sell Within Your Campus Community' },
  heroSubtitle: { type: String, default: 'The safest marketplace for university students' },
  heroImage: { type: String },
  heroBackground: { type: String, default: 'gradient' },
  
  // Featured Categories
  featuredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  
  // Number of featured listings to show
  listingsLimit: { type: Number, default: 6 },
  
  // Enable/disable sections
  showCategories: { type: Boolean, default: true },
  showListings: { type: Boolean, default: true },
  showUniversities: { type: Boolean, default: true },
  showTestimonials: { type: Boolean, default: true },
  showHowItWorks: { type: Boolean, default: true },
  
  // CTA Section
  ctaTitle: { type: String, default: 'Ready to Buy or Sell on Campus?' },
  ctaDescription: { type: String, default: 'Join our campus marketplace today!' },
  ctaButtonText: { type: String, default: 'Get Started' },
  ctaButtonLink: { type: String, default: '/register' },
  
  // Admin
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const Home = mongoose.model('Home', homeSchema);
export default Home;