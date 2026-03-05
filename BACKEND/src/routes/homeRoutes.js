// routes/homeRoutes.js
import express from 'express';
import Home from '../models/Home.js'; // Model for homepage content
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import University from '../models/University.js';
import Testimonial from '../models/Testimonial.js';

const router = express.Router();

// GET /api/home - Complete homepage data
router.get('/', async (req, res) => {
  try {
    // Get homepage configuration from admin panel
    const homeConfig = await Home.findOne().sort({ updatedAt: -1 });
    
    // Fetch categories (active only)
    const categories = await Category.find({ 
      isActive: true,
      showOnHomepage: true 
    }).limit(6).select('name icon image listingCount color');
    
    // Fetch featured listings
    const listings = await Product.find({
      isActive: true,
      isFeatured: true,
      status: 'available'
    })
    .populate('seller', 'firstName lastName university rating')
    .populate('category', 'name')
    .sort({ featuredAt: -1 })
    .limit(6);
    
    // Fetch universities with most listings
    const universities = await University.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'university',
          as: 'listings'
        }
      },
      {
        $match: {
          'listings.status': 'available',
          'listings.isActive': true
        }
      },
      {
        $project: {
          name: 1,
          image: 1,
          listingCount: { $size: '$listings' },
          featuredListings: { $slice: ['$listings', 3] }
        }
      },
      { $sort: { listingCount: -1 } },
      { $limit: 4 }
    ]);
    
    // Get homepage stats
    const stats = await getHomeStats();
    
    res.json({
      success: true,
      data: {
        config: homeConfig,
        categories,
        listings,
        universities,
        stats
      }
    });
    
  } catch (error) {
    console.error('Homepage data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load homepage data'
    });
  }
});

// GET /api/home/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ 
      isActive: true,
      showOnHomepage: true 
    }).limit(6);
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load categories'
    });
  }
});

// GET /api/home/listings/featured
router.get('/listings/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const listings = await Product.find({
      isActive: true,
      isFeatured: true,
      status: 'available'
    })
    .populate('seller', 'firstName lastName university rating avatar')
    .populate('category', 'name')
    .sort({ featuredAt: -1, createdAt: -1 })
    .limit(limit);
    
    const stats = await getHomeStats();
    
    res.json({
      success: true,
      listings,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load featured listings'
    });
  }
});

// GET /api/home/universities/spotlight
router.get('/universities/spotlight', async (req, res) => {
  try {
    const universities = await University.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'university',
          as: 'listings'
        }
      },
      {
        $match: {
          'listings.status': 'available',
          'listings.isActive': true
        }
      },
      {
        $project: {
          name: 1,
          image: 1,
          abbreviation: 1,
          location: 1,
          listingCount: { $size: '$listings' }
        }
      },
      { $sort: { listingCount: -1 } },
      { $limit: 4 }
    ]);
    
    res.json({
      success: true,
      universities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load universities'
    });
  }
});

// GET /api/home/testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      isActive: true,
      isApproved: true
    })
    .populate('user', 'firstName lastName university avatar')
    .sort({ createdAt: -1 })
    .limit(3);
    
    res.json({
      success: true,
      testimonials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load testimonials'
    });
  }
});

// GET /api/home/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await getHomeStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load stats'
    });
  }
});

// Helper function to get stats
const getHomeStats = async () => {
  try {
    const [
      totalListings,
      totalUsers,
      totalCategories,
      todayListings,
      featuredListings
    ] = await Promise.all([
      Product.countDocuments({ isActive: true, status: 'available' }),
      User.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Product.countDocuments({ 
        isActive: true, 
        status: 'available',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Product.countDocuments({ 
        isActive: true, 
        status: 'available',
        isFeatured: true 
      })
    ]);
    
    return {
      totalListings,
      totalUsers,
      totalCategories,
      todayListings,
      featuredListings,
      updatedAt: new Date()
    };
  } catch (error) {
    return {
      totalListings: 0,
      totalUsers: 0,
      totalCategories: 0,
      todayListings: 0,
      featuredListings: 0,
      updatedAt: new Date()
    };
  }
};

export default router;