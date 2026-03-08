// controllers/admin/dashboard.controller.js
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AdminVendor from '../models/AdminVendor.js';
import Category from '../models/Category.cjs';
import Payout from '../models/Payout.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

const getDateRange = (period = 'today') => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'yesterday':
      startDate = new Date(now.setDate(now.getDate() - 1));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'thisWeek':
      startDate = new Date(now.setDate(now.getDate() - 7));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    default:
      // Custom range or default to last 30 days
      startDate = new Date(now.setDate(now.getDate() - 30));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

const formatCurrency = (amount) => {
  return parseFloat(amount || 0).toFixed(2);
};

const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
};

// ============================================
// MAIN DASHBOARD STATS
// ============================================

export const getDashboardStats = async (req, res) => {
  try {
    const { period = 'thisMonth' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    // Previous period for comparison
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(startDate);
    const periodLength = endDate - startDate;
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
    previousPeriodEnd.setTime(startDate.getTime() - 1);

    // Run all queries in parallel
    const [
      currentPeriodStats,
      previousPeriodStats,
      totalStats,
      recentOrders,
      topProducts,
      topVendors,
      recentActivities,
      notificationStats,
      payoutStats,
      categoryStats,
      userGrowth
    ] = await Promise.allSettled([
      // Current period stats
      Order.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              paymentStatus: 'paid',
              status: { $ne: 'cancelled' }
            }
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$total' },
              orders: { $sum: 1 },
              averageOrderValue: { $avg: '$total' },
              commission: { $sum: { $sum: '$vendors.commission' } },
              itemsSold: { $sum: { $sum: '$items.quantity' } }
            }
          }
        ],
        { maxTimeMS: 5000 }
      ),

      // Previous period stats
      Order.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
              paymentStatus: 'paid',
              status: { $ne: 'cancelled' }
            }
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$total' },
              orders: { $sum: 1 },
              itemsSold: { $sum: { $sum: '$items.quantity' } }
            }
          }
        ],
        { maxTimeMS: 5000 }
      ),

      // Total stats
      Promise.all([
        User.countDocuments({ isDeleted: false }),
        AdminVendor.countDocuments({ role: 'vendor', isDeleted: false }),
        Product.countDocuments({ status: 'active', isDeleted: false }),
        Order.countDocuments({ paymentStatus: 'paid' }),
        Category.countDocuments({ isActive: true }),
        Notification.countDocuments({ read: false }),
        Payout.countDocuments({ status: 'pending' })
      ]),

      // Recent orders with full details
      Order.find()
        .sort('-createdAt')
        .limit(10)
        .populate({
          path: 'customer',
          select: 'firstName lastName email avatar'
        })
        .populate({
          path: 'items.product',
          select: 'name images price'
        })
        .lean()
        .maxTimeMS(3000),

      // Top products
      Product.find({ status: 'active', isDeleted: false })
        .sort('-totalSales')
        .limit(10)
        .select('name sku price totalSales totalRevenue quantity images category vendor')
        .populate('category', 'name')
        .populate('vendor', 'vendorProfile.storeName')
        .lean()
        .maxTimeMS(3000),

      // Top vendors
      AdminVendor.find({ role: 'vendor', isDeleted: false })
        .sort('-vendorProfile.performance.totalRevenue')
        .limit(10)
        .select('firstName lastName email vendorProfile.storeName vendorProfile.performance vendorProfile.verification')
        .lean()
        .maxTimeMS(3000),

      // Recent activities
      ActivityLog.find()
        .sort('-createdAt')
        .limit(10)
        .populate('user', 'firstName lastName email avatar')
        .lean()
        .maxTimeMS(2000),

      // Notification stats
      Notification.aggregate(
        [
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              unread: { $sum: { $cond: ['$read', 0, 1] } }
            }
          }
        ],
        { maxTimeMS: 2000 }
      ),

      // Payout stats
      Payout.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$status',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        { maxTimeMS: 3000 }
      ),

      // Category stats
      Category.aggregate(
        [
          { $match: { isActive: true } },
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'category',
              as: 'products'
            }
          },
          {
            $project: {
              name: 1,
              slug: 1,
              productCount: { $size: '$products' },
              image: 1
            }
          },
          { $sort: { productCount: -1 } },
          { $limit: 10 }
        ],
        { maxTimeMS: 3000 }
      ),

      // User growth
      User.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              isDeleted: false
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ],
        { maxTimeMS: 3000 }
      )
    ]);

    // Extract values with fallbacks
    const current = currentPeriodStats.status === 'fulfilled' ? currentPeriodStats.value[0] : null;
    const previous = previousPeriodStats.status === 'fulfilled' ? previousPeriodStats.value[0] : null;
    const totals = totalStats.status === 'fulfilled' ? totalStats.value : [0, 0, 0, 0, 0, 0, 0];
    const recentOrdersList = recentOrders.status === 'fulfilled' ? recentOrders.value : [];
    const topProductsList = topProducts.status === 'fulfilled' ? topProducts.value : [];
    const topVendorsList = topVendors.status === 'fulfilled' ? topVendors.value : [];
    const recentActivitiesList = recentActivities.status === 'fulfilled' ? recentActivities.value : [];
    const notificationStatsList = notificationStats.status === 'fulfilled' ? notificationStats.value : [];
    const payoutStatsList = payoutStats.status === 'fulfilled' ? payoutStats.value : [];
    const categoryStatsList = categoryStats.status === 'fulfilled' ? categoryStats.value : [];
    const userGrowthData = userGrowth.status === 'fulfilled' ? userGrowth.value : [];

    const currentRevenue = current?.revenue || 0;
    const previousRevenue = previous?.revenue || 0;
    const currentOrders = current?.orders || 0;
    const previousOrders = previous?.orders || 0;
    const currentItemsSold = current?.itemsSold || 0;
    const previousItemsSold = previous?.itemsSold || 0;

    // Calculate notification counts
    const unreadNotifications = notificationStatsList.reduce((acc, curr) => acc + (curr.unread || 0), 0);
    const totalNotifications = notificationStatsList.reduce((acc, curr) => acc + (curr.count || 0), 0);

    // Calculate payout stats
    const pendingPayouts = payoutStatsList.find(p => p._id === 'pending')?.total || 0;
    const completedPayouts = payoutStatsList.find(p => p._id === 'completed')?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          revenue: {
            current: formatCurrency(currentRevenue),
            previous: formatCurrency(previousRevenue),
            growth: calculateGrowth(currentRevenue, previousRevenue)
          },
          orders: {
            current: currentOrders,
            previous: previousOrders,
            growth: calculateGrowth(currentOrders, previousOrders)
          },
          averageOrderValue: {
            current: formatCurrency(current?.averageOrderValue || 0),
            previous: formatCurrency(previous?.averageOrderValue || 0),
            growth: calculateGrowth(
              current?.averageOrderValue || 0,
              previous?.averageOrderValue || 0
            )
          },
          commission: {
            current: formatCurrency(current?.commission || 0),
            previous: formatCurrency(previous?.commission || 0),
            growth: calculateGrowth(current?.commission || 0, previous?.commission || 0)
          },
          itemsSold: {
            current: currentItemsSold,
            previous: previousItemsSold,
            growth: calculateGrowth(currentItemsSold, previousItemsSold)
          }
        },
        counts: {
          users: totals[0] || 0,
          vendors: totals[1] || 0,
          products: totals[2] || 0,
          orders: totals[3] || 0,
          categories: totals[4] || 0,
          unreadNotifications: unreadNotifications,
          totalNotifications: totalNotifications,
          pendingPayouts: pendingPayouts,
          completedPayouts: completedPayouts
        },
        recentOrders: recentOrdersList,
        topProducts: topProductsList,
        topVendors: topVendorsList,
        recentActivities: recentActivitiesList,
        notificationStats: notificationStatsList,
        payoutStats: payoutStatsList,
        categoryStats: categoryStatsList,
        userGrowth: userGrowthData,
        metadata: {
          period,
          startDate,
          endDate,
          generatedAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// REVENUE ANALYTICS
// ============================================

export const getRevenueAnalytics = async (req, res) => {
  try {
    const { interval = 'daily', startDate, endDate, groupBy = 'overall' } = req.query;
    
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
    } else {
      dateRange = getDateRange('thisYear');
    }

    // Determine group format based on interval
    let groupFormat;
    switch (interval) {
      case 'hourly':
        groupFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
        break;
      case 'daily':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'weekly':
        groupFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      case 'monthly':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'yearly':
        groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    let groupByField = groupFormat;
    if (groupBy !== 'overall' && groupBy !== 'timeline') {
      groupByField = `$${groupBy}`;
    }

    const revenueData = await Order.aggregate(
      [
        {
          $match: {
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            paymentStatus: 'paid',
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: groupBy === 'timeline' ? groupFormat : groupByField,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: '$total' },
            commission: { $sum: { $sum: '$vendors.commission' } },
            itemsSold: { $sum: { $sum: '$items.quantity' } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ],
      { maxTimeMS: 8000 }
    );

    // Get revenue by payment method
    const revenueByMethod = await Order.aggregate(
      [
        {
          $match: {
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            paymentStatus: 'paid',
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            commission: { $sum: { $sum: '$vendors.commission' } }
          }
        },
        {
          $sort: { revenue: -1 }
        }
      ],
      { maxTimeMS: 5000 }
    );

    // Get revenue by category
    const revenueByCategory = await Order.aggregate(
      [
        {
          $match: {
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            paymentStatus: 'paid',
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$category.name', 'Uncategorized'] },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $addToSet: '$_id' },
            itemsSold: { $sum: '$items.quantity' }
          }
        },
        {
          $project: {
            _id: 1,
            revenue: 1,
            orders: { $size: '$orders' },
            itemsSold: 1
          }
        },
        {
          $sort: { revenue: -1 }
        }
      ],
      { maxTimeMS: 8000 }
    );

    // Get revenue by vendor
    const revenueByVendor = await Order.aggregate(
      [
        {
          $match: {
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            paymentStatus: 'paid',
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$vendors' },
        {
          $lookup: {
            from: 'adminvendors',
            localField: 'vendors.vendor',
            foreignField: '_id',
            as: 'vendor'
          }
        },
        { $unwind: '$vendor' },
        {
          $group: {
            _id: '$vendor._id',
            storeName: { $first: '$vendor.vendorProfile.storeName' },
            revenue: { $sum: '$vendors.total' },
            commission: { $sum: '$vendors.commission' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 }
      ],
      { maxTimeMS: 8000 }
    );

    res.status(200).json({
      success: true,
      data: {
        timeline: revenueData,
        byMethod: revenueByMethod,
        byCategory: revenueByCategory,
        byVendor: revenueByVendor,
        summary: {
          totalRevenue: revenueData.reduce((acc, curr) => acc + curr.revenue, 0),
          totalOrders: revenueData.reduce((acc, curr) => acc + curr.orders, 0),
          averageOrderValue: revenueData.reduce((acc, curr) => acc + curr.averageOrderValue, 0) / revenueData.length || 0,
          totalCommission: revenueData.reduce((acc, curr) => acc + curr.commission, 0),
          totalItemsSold: revenueData.reduce((acc, curr) => acc + (curr.itemsSold || 0), 0)
        },
        metadata: {
          interval,
          groupBy,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      }
    });
  } catch (error) {
    console.error('❌ Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// SALES ANALYTICS
// ============================================

export const getSalesAnalytics = async (req, res) => {
  try {
    const { type = 'overview', startDate, endDate, limit = 20 } = req.query;
    
    const dateRange = (startDate && endDate) 
      ? { startDate: new Date(startDate), endDate: new Date(endDate) }
      : getDateRange('thisMonth');

    let data = [];

    switch (type) {
      case 'overview':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                sales: { $sum: '$total' },
                orders: { $sum: 1 },
                itemsSold: { $sum: { $sum: '$items.quantity' } }
              }
            },
            { $sort: { _id: 1 } }
          ],
          { maxTimeMS: 5000 }
        );
        break;

      case 'category':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            { $unwind: '$items' },
            {
              $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $unwind: '$product' },
            {
              $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'category'
              }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: { $ifNull: ['$category.name', 'Uncategorized'] },
                sales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                quantity: { $sum: '$items.quantity' },
                orders: { $addToSet: '$_id' }
              }
            },
            {
              $project: {
                _id: 1,
                sales: 1,
                quantity: 1,
                orders: { $size: '$orders' },
                averageOrderValue: { $divide: ['$sales', '$orders'] }
              }
            },
            { $sort: { sales: -1 } }
          ],
          { maxTimeMS: 8000 }
        );
        break;

      case 'product':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            { $unwind: '$items' },
            {
              $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $unwind: '$product' },
            {
              $group: {
                _id: '$product._id',
                name: { $first: '$product.name' },
                sku: { $first: '$product.sku' },
                price: { $first: '$product.price' },
                image: { $first: { $arrayElemAt: ['$product.images', 0] } },
                category: { $first: '$product.category' },
                sales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                quantity: { $sum: '$items.quantity' },
                orders: { $addToSet: '$_id' }
              }
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryInfo'
              }
            },
            {
              $project: {
                _id: 1,
                name: 1,
                sku: 1,
                price: 1,
                image: 1,
                sales: 1,
                quantity: 1,
                orders: { $size: '$orders' },
                category: { $arrayElemAt: ['$categoryInfo.name', 0] },
                averageOrderValue: { $divide: ['$sales', '$orders'] }
              }
            },
            { $sort: { sales: -1 } },
            { $limit: parseInt(limit) }
          ],
          { maxTimeMS: 8000 }
        );
        break;

      case 'vendor':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            { $unwind: '$vendors' },
            {
              $lookup: {
                from: 'adminvendors',
                localField: 'vendors.vendor',
                foreignField: '_id',
                as: 'vendor'
              }
            },
            { $unwind: '$vendor' },
            {
              $group: {
                _id: '$vendor._id',
                storeName: { $first: '$vendor.vendorProfile.storeName' },
                email: { $first: '$vendor.email' },
                logo: { $first: '$vendor.vendorProfile.logo' },
                sales: { $sum: '$vendors.total' },
                commission: { $sum: '$vendors.commission' },
                orders: { $sum: 1 },
                itemsSold: { $sum: { $sum: '$items.quantity' } }
              }
            },
            {
              $project: {
                _id: 1,
                storeName: 1,
                email: 1,
                logo: 1,
                sales: 1,
                commission: 1,
                orders: 1,
                itemsSold: 1,
                averageOrderValue: { $divide: ['$sales', '$orders'] }
              }
            },
            { $sort: { sales: -1 } },
            { $limit: parseInt(limit) }
          ],
          { maxTimeMS: 8000 }
        );
        break;

      case 'hourly':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            {
              $group: {
                _id: { $hour: '$createdAt' },
                sales: { $sum: '$total' },
                orders: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          { maxTimeMS: 5000 }
        );
        break;

      case 'weekday':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            {
              $group: {
                _id: { $dayOfWeek: '$createdAt' },
                sales: { $sum: '$total' },
                orders: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          { maxTimeMS: 5000 }
        );
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        type,
        data,
        metadata: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          totalSales: data.reduce((acc, curr) => acc + (curr.sales || 0), 0),
          totalOrders: data.reduce((acc, curr) => acc + (curr.orders || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error('❌ Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// USER ANALYTICS
// ============================================

export const getUserAnalytics = async (req, res) => {
  try {
    const { type = 'overview', startDate, endDate, limit = 20 } = req.query;
    
    const dateRange = (startDate && endDate) 
      ? { startDate: new Date(startDate), endDate: new Date(endDate) }
      : getDateRange('thisYear');

    let data = [];

    switch (type) {
      case 'overview':
        const [totalUsers, newUsers, activeUsers, verifiedUsers, userGrowth, userByRole] = await Promise.all([
          User.countDocuments({ isDeleted: false }),
          User.countDocuments({
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            isDeleted: false
          }),
          User.countDocuments({
            lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            isDeleted: false
          }),
          User.countDocuments({ isVerified: true, isDeleted: false }),
          User.aggregate(
            [
              {
                $match: {
                  createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                  isDeleted: false
                }
              },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ],
            { maxTimeMS: 5000 }
          ),
          User.aggregate(
            [
              {
                $match: {
                  isDeleted: false
                }
              },
              {
                $group: {
                  _id: '$role',
                  count: { $sum: 1 }
                }
              }
            ],
            { maxTimeMS: 3000 }
          )
        ]);

        res.status(200).json({
          success: true,
          data: {
            type: 'overview',
            data: {
              total: totalUsers,
              new: newUsers,
              active: activeUsers,
              verified: verifiedUsers,
              unverified: totalUsers - verifiedUsers,
              growth: userGrowth,
              byRole: userByRole,
              retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
            }
          }
        });
        return;

      case 'demographics':
        data = await User.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                isDeleted: false
              }
            },
            {
              $facet: {
                byGender: [
                  {
                    $group: {
                      _id: { $ifNull: ['$gender', 'unspecified'] },
                      count: { $sum: 1 }
                    }
                  }
                ],
                byUniversity: [
                  {
                    $group: {
                      _id: { $ifNull: ['$university', 'unspecified'] },
                      count: { $sum: 1 }
                    }
                  },
                  { $sort: { count: -1 } },
                  { $limit: parseInt(limit) }
                ],
                byAge: [
                  {
                    $bucket: {
                      groupBy: '$age',
                      boundaries: [18, 25, 35, 45, 55, 65, 100],
                      default: 'unknown',
                      output: {
                        count: { $sum: 1 }
                      }
                    }
                  }
                ],
                byCountry: [
                  {
                    $group: {
                      _id: { $ifNull: ['$address.country', 'unknown'] },
                      count: { $sum: 1 }
                    }
                  },
                  { $sort: { count: -1 } },
                  { $limit: 10 }
                ]
              }
            }
          ],
          { maxTimeMS: 8000 }
        );
        break;

      case 'retention':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            {
              $group: {
                _id: '$customer',
                orderCount: { $sum: 1 },
                firstOrder: { $min: '$createdAt' },
                lastOrder: { $max: '$createdAt' },
                totalSpent: { $sum: '$total' },
                averageOrderValue: { $avg: '$total' }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: '$user' },
            {
              $project: {
                _id: 1,
                email: '$user.email',
                name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
                avatar: '$user.avatar',
                orderCount: 1,
                firstOrder: 1,
                lastOrder: 1,
                totalSpent: 1,
                averageOrderValue: 1,
                daysSinceLastOrder: {
                  $divide: [
                    { $subtract: [new Date(), '$lastOrder'] },
                    1000 * 60 * 60 * 24
                  ]
                }
              }
            },
            { $sort: { orderCount: -1, totalSpent: -1 } },
            { $limit: parseInt(limit) }
          ],
          { maxTimeMS: 8000 }
        );
        break;

      case 'acquisition':
        data = await User.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                isDeleted: false
              }
            },
            {
              $group: {
                _id: { $ifNull: ['$source', 'direct'] },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          { maxTimeMS: 5000 }
        );
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        type,
        data: data[0] || data,
        metadata: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      }
    });
  } catch (error) {
    console.error('❌ User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// PRODUCT ANALYTICS
// ============================================

export const getProductAnalytics = async (req, res) => {
  try {
    const { type = 'overview', limit = 20, category, vendor } = req.query;

    const matchFilter = { isDeleted: false };
    if (category) matchFilter.category = mongoose.Types.ObjectId(category);
    if (vendor) matchFilter.vendor = mongoose.Types.ObjectId(vendor);

    switch (type) {
      case 'overview':
        const [totalProducts, activeProducts, lowStockProducts, outOfStock, byCategory, byStatus] = await Promise.all([
          Product.countDocuments({ isDeleted: false }),
          Product.countDocuments({ status: 'active', isDeleted: false }),
          Product.countDocuments({ 
            quantity: { $lte: '$lowStockThreshold' }, 
            quantity: { $gt: 0 },
            isDeleted: false 
          }),
          Product.countDocuments({ quantity: 0, isDeleted: false }),
          Product.aggregate(
            [
              { $match: { isDeleted: false } },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'category',
                  foreignField: '_id',
                  as: 'category'
                }
              },
              { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
              {
                $group: {
                  _id: { $ifNull: ['$category.name', 'Uncategorized'] },
                  count: { $sum: 1 },
                  totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                  averagePrice: { $avg: '$price' }
                }
              },
              { $sort: { count: -1 } }
            ],
            { maxTimeMS: 5000 }
          ),
          Product.aggregate(
            [
              { $match: { isDeleted: false } },
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            { maxTimeMS: 3000 }
          )
        ]);

        res.status(200).json({
          success: true,
          data: {
            type: 'overview',
            data: {
              total: totalProducts,
              active: activeProducts,
              lowStock: lowStockProducts,
              outOfStock,
              byCategory,
              byStatus,
              inventoryValue: byCategory.reduce((acc, curr) => acc + curr.totalValue, 0)
            }
          }
        });
        return;

      case 'top':
        const topProducts = await Product.find({ status: 'active', isDeleted: false })
          .sort('-totalSales')
          .limit(parseInt(limit))
          .select('name sku price totalSales totalRevenue quantity category images vendor')
          .populate('category', 'name')
          .populate('vendor', 'vendorProfile.storeName')
          .lean()
          .maxTimeMS(5000);

        res.status(200).json({
          success: true,
          data: {
            type: 'top',
            data: topProducts
          }
        });
        return;

      case 'trending':
        const { startDate, endDate } = getDateRange('thisWeek');
        
        const trendingProducts = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                status: { $ne: 'cancelled' }
              }
            },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.product',
                quantity: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                orders: { $addToSet: '$_id' }
              }
            },
            {
              $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $unwind: '$product' },
            {
              $match: matchFilter
            },
            {
              $project: {
                _id: 1,
                name: '$product.name',
                sku: '$product.sku',
                price: '$product.price',
                image: { $arrayElemAt: ['$product.images', 0] },
                category: '$product.category',
                vendor: '$product.vendor',
                quantity: 1,
                revenue: 1,
                orders: { $size: '$orders' },
                growth: {
                  $multiply: [
                    { $divide: ['$quantity', { $add: ['$quantity', 1] }] },
                    100
                  ]
                }
              }
            },
            { $sort: { quantity: -1 } },
            { $limit: parseInt(limit) }
          ],
          { maxTimeMS: 8000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'trending',
            data: trendingProducts,
            metadata: { startDate, endDate }
          }
        });
        return;

      case 'low_stock':
        const lowStock = await Product.find({
          $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
          quantity: { $gt: 0 },
          isDeleted: false,
          ...matchFilter
        })
          .sort('quantity')
          .limit(parseInt(limit))
          .select('name sku price quantity lowStockThreshold category images vendor')
          .populate('category', 'name')
          .populate('vendor', 'vendorProfile.storeName')
          .lean()
          .maxTimeMS(5000);

        res.status(200).json({
          success: true,
          data: {
            type: 'low_stock',
            data: lowStock
          }
        });
        return;

      case 'performance':
        const performance = await Product.aggregate(
          [
            { $match: { isDeleted: false, ...matchFilter } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalRevenue' },
                totalSales: { $sum: '$totalSales' },
                averagePrice: { $avg: '$price' },
                totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                uniqueProducts: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                totalRevenue: 1,
                totalSales: 1,
                averagePrice: 1,
                totalValue: 1,
                uniqueProducts: 1,
                revenuePerProduct: { $divide: ['$totalRevenue', '$uniqueProducts'] },
                salesPerProduct: { $divide: ['$totalSales', '$uniqueProducts'] }
              }
            }
          ],
          { maxTimeMS: 5000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'performance',
            data: performance[0] || {}
          }
        });
        return;
    }
  } catch (error) {
    console.error('❌ Product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// VENDOR ANALYTICS
// ============================================

export const getVendorAnalytics = async (req, res) => {
  try {
    const { type = 'overview', limit = 20, status, verified } = req.query;

    const matchFilter = { role: 'vendor', isDeleted: false };
    if (status) matchFilter.status = status;
    if (verified !== undefined) {
      matchFilter['vendorProfile.verification.status'] = verified === 'true' ? 'approved' : 'pending';
    }

    switch (type) {
      case 'overview':
        const [totalVendors, pendingVendors, approvedVendors, suspendedVendors, byVerification, performance] = await Promise.all([
          AdminVendor.countDocuments({ role: 'vendor', isDeleted: false }),
          AdminVendor.countDocuments({ 
            role: 'vendor', 
            'vendorProfile.verification.status': 'pending',
            isDeleted: false 
          }),
          AdminVendor.countDocuments({ 
            role: 'vendor', 
            'vendorProfile.verification.status': 'approved',
            isDeleted: false 
          }),
          AdminVendor.countDocuments({ 
            role: 'vendor', 
            status: 'suspended',
            isDeleted: false 
          }),
          AdminVendor.aggregate(
            [
              { $match: { role: 'vendor', isDeleted: false } },
              {
                $group: {
                  _id: '$vendorProfile.verification.status',
                  count: { $sum: 1 }
                }
              }
            ],
            { maxTimeMS: 3000 }
          ),
          AdminVendor.aggregate(
            [
              { $match: { role: 'vendor', isDeleted: false } },
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: '$vendorProfile.performance.totalRevenue' },
                  totalOrders: { $sum: '$vendorProfile.performance.totalOrders' },
                  totalCommission: { $sum: '$vendorProfile.performance.totalCommission' },
                  averageRating: { $avg: '$vendorProfile.performance.customerRating.average' }
                }
              }
            ],
            { maxTimeMS: 3000 }
          )
        ]);

        res.status(200).json({
          success: true,
          data: {
            type: 'overview',
            data: {
              total: totalVendors,
              pending: pendingVendors,
              approved: approvedVendors,
              suspended: suspendedVendors,
              byVerification,
              performance: performance[0] || {
                totalRevenue: 0,
                totalOrders: 0,
                totalCommission: 0,
                averageRating: 0
              },
              approvalRate: totalVendors > 0 ? (approvedVendors / totalVendors) * 100 : 0
            }
          }
        });
        return;

      case 'top':
        const topVendors = await AdminVendor.find(matchFilter)
          .sort('-vendorProfile.performance.totalRevenue')
          .limit(parseInt(limit))
          .select('firstName lastName email vendorProfile.storeName vendorProfile.logo vendorProfile.performance vendorProfile.verification')
          .lean()
          .maxTimeMS(5000);

        res.status(200).json({
          success: true,
          data: {
            type: 'top',
            data: topVendors.map(v => ({
              ...v,
              performance: {
                ...v.vendorProfile?.performance,
                averageRating: v.vendorProfile?.performance?.customerRating?.average || 0
              }
            }))
          }
        });
        return;

      case 'performance':
        const performanceData = await AdminVendor.aggregate(
          [
            { $match: matchFilter },
            {
              $project: {
                _id: 1,
                storeName: '$vendorProfile.storeName',
                logo: '$vendorProfile.logo',
                totalRevenue: '$vendorProfile.performance.totalRevenue',
                totalOrders: '$vendorProfile.performance.totalOrders',
                totalCommission: '$vendorProfile.performance.totalCommission',
                averageRating: '$vendorProfile.performance.customerRating.average',
                fulfillmentRate: '$vendorProfile.performance.fulfillmentRate',
                cancellationRate: '$vendorProfile.performance.cancellationRate',
                refundRate: '$vendorProfile.performance.refundRate',
                monthlyStats: '$vendorProfile.performance.monthlyStats'
              }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: parseInt(limit) }
          ],
          { maxTimeMS: 5000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'performance',
            data: performanceData
          }
        });
        return;

      case 'payouts':
        const payoutData = await Payout.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: '$vendor',
                totalPayouts: { $sum: '$amount' },
                payoutCount: { $sum: 1 },
                averagePayout: { $avg: '$amount' },
                lastPayout: { $max: '$createdAt' }
              }
            },
            {
              $lookup: {
                from: 'adminvendors',
                localField: '_id',
                foreignField: '_id',
                as: 'vendor'
              }
            },
            { $unwind: '$vendor' },
            {
              $project: {
                _id: 1,
                storeName: '$vendor.vendorProfile.storeName',
                totalPayouts: 1,
                payoutCount: 1,
                averagePayout: 1,
                lastPayout: 1
              }
            },
            { $sort: { totalPayouts: -1 } },
            { $limit: parseInt(limit) }
          ],
          { maxTimeMS: 5000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'payouts',
            data: payoutData
          }
        });
        return;
    }
  } catch (error) {
    console.error('❌ Vendor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ORDER ANALYTICS
// ============================================

export const getOrderAnalytics = async (req, res) => {
  try {
    const { type = 'overview', startDate, endDate, limit = 20 } = req.query;
    
    const dateRange = (startDate && endDate) 
      ? { startDate: new Date(startDate), endDate: new Date(endDate) }
      : getDateRange('thisMonth');

    switch (type) {
      case 'overview':
        const [totalOrders, completedOrders, pendingOrders, cancelledOrders, processingOrders, byStatus, byPaymentMethod] = await Promise.all([
          Order.countDocuments({ 
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate } 
          }),
          Order.countDocuments({ 
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            status: 'delivered' 
          }),
          Order.countDocuments({ 
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            status: 'pending' 
          }),
          Order.countDocuments({ 
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            status: 'cancelled' 
          }),
          Order.countDocuments({ 
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            status: 'processing' 
          }),
          Order.aggregate(
            [
              {
                $match: {
                  createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
                }
              },
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  total: { $sum: '$total' }
                }
              }
            ],
            { maxTimeMS: 5000 }
          ),
          Order.aggregate(
            [
              {
                $match: {
                  createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
                }
              },
              {
                $group: {
                  _id: '$paymentMethod',
                  count: { $sum: 1 },
                  total: { $sum: '$total' }
                }
              }
            ],
            { maxTimeMS: 5000 }
          )
        ]);

        res.status(200).json({
          success: true,
          data: {
            type: 'overview',
            data: {
              total: totalOrders,
              completed: completedOrders,
              pending: pendingOrders,
              processing: processingOrders,
              cancelled: cancelledOrders,
              byStatus,
              byPaymentMethod,
              completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
              cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
            },
            metadata: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate
            }
          }
        });
        return;

      case 'timeline':
        const timeline = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: { $sum: 1 },
                revenue: { $sum: '$total' },
                averageValue: { $avg: '$total' }
              }
            },
            { $sort: { _id: 1 } }
          ],
          { maxTimeMS: 5000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'timeline',
            data: timeline
          }
        });
        return;

      case 'fulfillment':
        const fulfillment = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                status: 'delivered'
              }
            },
            {
              $group: {
                _id: null,
                averageProcessingTime: { 
                  $avg: { 
                    $divide: [
                      { $subtract: ['$processedAt', '$createdAt'] },
                      1000 * 60 * 60 // Convert to hours
                    ]
                  } 
                },
                averageShippingTime: { 
                  $avg: { 
                    $divide: [
                      { $subtract: ['$deliveredAt', '$shippedAt'] },
                      1000 * 60 * 60
                    ]
                  } 
                },
                averageDeliveryTime: { 
                  $avg: { 
                    $divide: [
                      { $subtract: ['$deliveredAt', '$createdAt'] },
                      1000 * 60 * 60
                    ]
                  } 
                },
                onTimeDelivery: {
                  $sum: {
                    $cond: [
                      { $lte: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 7 * 24 * 60 * 60 * 1000] },
                      1,
                      0
                    ]
                  }
                },
                totalDelivered: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                averageProcessingTime: 1,
                averageShippingTime: 1,
                averageDeliveryTime: 1,
                onTimeRate: {
                  $multiply: [
                    { $divide: ['$onTimeDelivery', '$totalDelivered'] },
                    100
                  ]
                }
              }
            }
          ],
          { maxTimeMS: 5000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'fulfillment',
            data: fulfillment[0] || {
              averageProcessingTime: 0,
              averageShippingTime: 0,
              averageDeliveryTime: 0,
              onTimeRate: 0
            }
          }
        });
        return;

      case 'geographic':
        const geographic = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
              }
            },
            {
              $group: {
                _id: {
                  country: '$shippingAddress.country',
                  state: '$shippingAddress.state',
                  city: '$shippingAddress.city'
                },
                orders: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            },
            {
              $group: {
                _id: '$_id.country',
                orders: { $sum: '$orders' },
                revenue: { $sum: '$revenue' },
                states: {
                  $push: {
                    name: '$_id.state',
                    orders: '$orders',
                    revenue: '$revenue',
                    cities: '$_id.city'
                  }
                }
              }
            },
            { $sort: { orders: -1 } },
            { $limit: parseInt(limit) }
          ],
          { maxTimeMS: 8000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'geographic',
            data: geographic
          }
        });
        return;
    }
  } catch (error) {
    console.error('❌ Order analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// PERFORMANCE METRICS
// ============================================

export const getPerformanceMetrics = async (req, res) => {
  try {
    const { type = 'overview' } = req.query;

    // Get database stats
    const dbStats = await mongoose.connection.db.stats();

    // Get collection counts
    const [usersCount, vendorsCount, productsCount, ordersCount, notificationsCount, activitiesCount] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      AdminVendor.countDocuments({ role: 'vendor', isDeleted: false }),
      Product.countDocuments({ isDeleted: false }),
      Order.countDocuments({}),
      Notification.countDocuments({}),
      ActivityLog.countDocuments({})
    ]);

    // Get recent response times from logs (simulated)
    const responseTimes = {
      average: 245,
      p95: 450,
      p99: 800,
      max: 1200,
      min: 120,
      histogram: [
        { range: '0-100ms', count: 1250 },
        { range: '100-200ms', count: 3450 },
        { range: '200-300ms', count: 2800 },
        { range: '300-400ms', count: 1200 },
        { range: '400-500ms', count: 450 },
        { range: '500ms+', count: 150 }
      ]
    };

    // Calculate error rates
    const totalRequests = 15234; // This would come from request logs
    const errorCount = 132;
    const errorRate = (errorCount / totalRequests) * 100;

    // Get active connections
    const activeConnections = mongoose.connections.length;

    // Get cache stats (simulated)
    const cacheStats = {
      hitRate: 0.85,
      missRate: 0.15,
      memory: '156 MB',
      keys: 2345,
      evictions: 12,
      hitRateByEndpoint: [
        { endpoint: '/api/products', hits: 456, misses: 78 },
        { endpoint: '/api/orders', hits: 389, misses: 45 },
        { endpoint: '/api/users', hits: 234, misses: 67 },
        { endpoint: '/api/dashboard', hits: 567, misses: 89 }
      ]
    };

    // Get system resources
    const systemResources = {
      cpu: {
        usage: 42,
        cores: 4,
        loadAverage: [2.5, 2.1, 1.8]
      },
      memory: {
        total: 16 * 1024 * 1024 * 1024, // 16GB in bytes
        used: 9.5 * 1024 * 1024 * 1024,
        free: 6.5 * 1024 * 1024 * 1024,
        usagePercentage: 59
      },
      disk: {
        total: 100 * 1024 * 1024 * 1024, // 100GB
        used: 34 * 1024 * 1024 * 1024,
        free: 66 * 1024 * 1024 * 1024,
        usagePercentage: 34
      },
      network: {
        requestsPerSecond: 23,
        dataIn: 15.6 * 1024 * 1024, // 15.6 MB/s
        dataOut: 8.4 * 1024 * 1024   // 8.4 MB/s
      }
    };

    // Get endpoint performance
    const endpointPerformance = [
      { endpoint: '/api/auth/login', avgTime: 180, requests: 2345, errorRate: 0.5 },
      { endpoint: '/api/products', avgTime: 320, requests: 4567, errorRate: 1.2 },
      { endpoint: '/api/orders', avgTime: 450, requests: 3456, errorRate: 2.1 },
      { endpoint: '/api/dashboard', avgTime: 890, requests: 1234, errorRate: 3.4 },
      { endpoint: '/api/users', avgTime: 280, requests: 2345, errorRate: 0.8 }
    ];

    res.status(200).json({
      success: true,
      data: {
        type,
        data: {
          database: {
            totalSize: dbStats.dataSize,
            indexSize: dbStats.indexSize,
            collections: dbStats.collections,
            documents: usersCount + vendorsCount + productsCount + ordersCount,
            avgDocumentSize: dbStats.avgObjSize,
            indexes: dbStats.indexes,
            connections: activeConnections
          },
          collections: {
            users: usersCount,
            vendors: vendorsCount,
            products: productsCount,
            orders: ordersCount,
            notifications: notificationsCount,
            activities: activitiesCount
          },
          api: {
            responseTimes,
            totalRequests,
            errorCount,
            errorRate,
            endpointPerformance
          },
          cache: cacheStats,
          system: systemResources,
          uptime: process.uptime(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    console.error('❌ Performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// REAL-TIME METRICS
// ============================================

export const getRealTimeMetrics = async (req, res) => {
  try {
    const { type = 'overview' } = req.query;

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    switch (type) {
      case 'overview':
        const [activeUsers, recentOrders, recentSales, pageViews, conversions] = await Promise.all([
          // Users active in last 5 minutes
          User.countDocuments({ lastActive: { $gte: fiveMinutesAgo } }),
          // Orders in last 5 minutes
          Order.countDocuments({ createdAt: { $gte: fiveMinutesAgo } }),
          // Sales in last 5 minutes
          Order.aggregate(
            [
              {
                $match: {
                  createdAt: { $gte: fiveMinutesAgo },
                  paymentStatus: 'paid'
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$total' },
                  count: { $sum: 1 }
                }
              }
            ],
            { maxTimeMS: 2000 }
          ),
          // Page views (simulated from analytics)
          456,
          // Conversion rate (simulated)
          3.2
        ]);

        res.status(200).json({
          success: true,
          data: {
            type: 'overview',
            data: {
              activeUsers,
              recentOrders,
              recentSales: recentSales[0]?.total || 0,
              recentSalesCount: recentSales[0]?.count || 0,
              pageViews,
              conversions,
              timestamp: now,
              activeSessions: Math.floor(activeUsers * 1.5), // Simulated
              bounceRate: 42, // Simulated
              avgSessionDuration: 245 // seconds
            }
          }
        });
        return;

      case 'visitors':
        // Real-time visitor count (from WebSocket connections)
        const io = req.app.get('io');
        const visitorCount = io?.engine?.clientsCount || 0;

        // Get visitors by page (simulated)
        const visitorsByPage = [
          { page: '/', visitors: 234 },
          { page: '/products', visitors: 156 },
          { page: '/dashboard', visitors: 89 },
          { page: '/orders', visitors: 67 },
          { page: '/profile', visitors: 45 }
        ];

        res.status(200).json({
          success: true,
          data: {
            type: 'visitors',
            data: {
              count: visitorCount,
              unique: Math.floor(visitorCount * 0.8),
              returning: Math.floor(visitorCount * 0.3),
              new: Math.floor(visitorCount * 0.5),
              byPage: visitorsByPage,
              timestamp: now
            }
          }
        });
        return;

      case 'orders':
        // Real-time orders in last minute
        const orders = await Order.find({
          createdAt: { $gte: new Date(now.getTime() - 60 * 1000) }
        })
          .sort('-createdAt')
          .limit(10)
          .select('orderNumber total status customer items paymentMethod')
          .populate('customer', 'firstName lastName email')
          .populate('items.product', 'name images')
          .lean()
          .maxTimeMS(2000);

        // Get order statistics for last hour
        const hourlyStats = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: oneHourAgo }
              }
            },
            {
              $group: {
                _id: {
                  minute: { $minute: '$createdAt' },
                  status: '$status'
                },
                count: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            },
            { $sort: { '_id.minute': 1 } }
          ],
          { maxTimeMS: 3000 }
        );

        res.status(200).json({
          success: true,
          data: {
            type: 'orders',
            data: {
              recent: orders,
              hourly: hourlyStats,
              totalLastHour: orders.length,
              revenueLastHour: orders.reduce((acc, o) => acc + o.total, 0),
              timestamp: now
            }
          }
        });
        return;

      case 'traffic':
        // Real-time traffic sources
        const trafficSources = [
          { source: 'Direct', visitors: 345, percentage: 35 },
          { source: 'Organic Search', visitors: 234, percentage: 24 },
          { source: 'Social Media', visitors: 156, percentage: 16 },
          { source: 'Referral', visitors: 123, percentage: 13 },
          { source: 'Email', visitors: 78, percentage: 8 },
          { source: 'Paid Ads', visitors: 45, percentage: 4 }
        ];

        res.status(200).json({
          success: true,
          data: {
            type: 'traffic',
            data: {
              sources: trafficSources,
              total: trafficSources.reduce((acc, s) => acc + s.visitors, 0),
              timestamp: now
            }
          }
        });
        return;

      case 'events':
        // Recent events from activity log
        const recentEvents = await ActivityLog.find({
          createdAt: { $gte: fiveMinutesAgo }
        })
          .sort('-createdAt')
          .limit(20)
          .populate('user', 'firstName lastName email avatar')
          .lean()
          .maxTimeMS(2000);

        res.status(200).json({
          success: true,
          data: {
            type: 'events',
            data: {
              events: recentEvents,
              count: recentEvents.length,
              timestamp: now
            }
          }
        });
        return;
    }
  } catch (error) {
    console.error('❌ Real-time metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// RECENT ORDERS FOR DASHBOARD
// ============================================

export const getRecentOrders = async (req, res) => {
  try {
    const { 
      limit = 10,
      startDate,
      endDate,
      status,
      search,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query filter
    const filter = {};
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Status filter
    if (status) {
      const statuses = status.split(',');
      filter.status = { $in: statuses };
    }

    // Search by order number or customer name/email
    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { 'customer.name': new RegExp(search, 'i') },
        { 'customer.email': new RegExp(search, 'i') },
        { guestName: new RegExp(search, 'i') },
        { guestEmail: new RegExp(search, 'i') }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with pagination and population
    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'customer',
          select: 'name email firstName lastName avatar'
        })
        .populate({
          path: 'items.product',
          select: 'name sku images price'
        })
        .populate({
          path: 'vendor',
          select: 'vendorProfile.storeName email'
        })
        .lean()
        .maxTimeMS(5000),
      
      Order.countDocuments(filter)
    ]);

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
      status: order.status || 'pending',
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      paymentMethod: order.paymentMethod || 'unknown',
      paymentStatus: order.paymentStatus || 'pending',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      processedAt: order.processedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      
      // Customer info
      customer: order.customer ? {
        id: order.customer._id,
        name: order.customer.name || 
              `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 
              'Guest',
        email: order.customer.email,
        avatar: order.customer.avatar
      } : {
        name: order.guestName || 'Guest',
        email: order.guestEmail || null
      },
      
      // Shipping address
      shippingAddress: order.shippingAddress || null,
      
      // Items summary
      items: order.items ? order.items.map(item => ({
        id: item._id,
        productId: item.product?._id,
        name: item.product?.name || item.name || 'Product',
        sku: item.product?.sku || item.sku,
        price: item.price || 0,
        quantity: item.quantity || 1,
        total: (item.price || 0) * (item.quantity || 1),
        image: item.product?.images?.[0] || item.image
      })) : [],
      
      // Items count
      itemCount: order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0,
      
      // Vendor info if applicable
      vendor: order.vendor ? {
        id: order.vendor._id,
        storeName: order.vendor.vendorProfile?.storeName || 'Vendor',
        email: order.vendor.email
      } : null
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Recent orders fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// REPORTS
// ============================================

export const getReports = async (req, res) => {
  try {
    const reports = [
      {
        id: 'sales',
        name: 'Sales Report',
        description: 'Detailed sales analysis with breakdowns by product, category, and time period',
        formats: ['csv', 'pdf', 'excel'],
        available: true,
        endpoints: ['/sales', '/sales/by-product', '/sales/by-category', '/sales/by-vendor']
      },
      {
        id: 'tax',
        name: 'Tax Report',
        description: 'Tax collection and remittance summary by jurisdiction',
        formats: ['csv', 'pdf', 'excel'],
        available: true,
        endpoints: ['/tax/collected', '/tax/remitted', '/tax/summary']
      },
      {
        id: 'inventory',
        name: 'Inventory Report',
        description: 'Current stock levels, valuation, and reorder recommendations',
        formats: ['csv', 'excel'],
        available: true,
        endpoints: ['/inventory/current', '/inventory/low-stock', '/inventory/valuation']
      },
      {
        id: 'users',
        name: 'Users Report',
        description: 'User registration, activity, and engagement metrics',
        formats: ['csv', 'pdf', 'excel'],
        available: true,
        endpoints: ['/users/registration', '/users/activity', '/users/retention']
      },
      {
        id: 'vendors',
        name: 'Vendors Report',
        description: 'Vendor performance, payouts, and verification status',
        formats: ['csv', 'pdf', 'excel'],
        available: true,
        endpoints: ['/vendors/performance', '/vendors/payouts', '/vendors/verification']
      },
      {
        id: 'commission',
        name: 'Commission Report',
        description: 'Commission earned, paid, and pending by vendor',
        formats: ['csv', 'excel'],
        available: true,
        endpoints: ['/commission/earned', '/commission/paid', '/commission/pending']
      },
      {
        id: 'orders',
        name: 'Orders Report',
        description: 'Order volume, status distribution, and fulfillment metrics',
        formats: ['csv', 'pdf', 'excel'],
        available: true,
        endpoints: ['/orders/volume', '/orders/status', '/orders/fulfillment']
      },
      {
        id: 'products',
        name: 'Products Report',
        description: 'Product performance, sales, and inventory turnover',
        formats: ['csv', 'pdf', 'excel'],
        available: true,
        endpoints: ['/products/performance', '/products/sales', '/products/inventory']
      }
    ];

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// EXPORT REPORT
// ============================================

export const exportReport = async (req, res) => {
  try {
    const { reportType, format = 'csv', dateRange, filters = {} } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    const { startDate, endDate } = dateRange || getDateRange('thisMonth');

    let data = [];
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}`;

    // Generate report data based on type
    switch (reportType) {
      case 'sales':
        data = await Order.aggregate(
          [
            {
              $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                ...filters
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerInfo'
              }
            },
            { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                orderNumber: 1,
                date: '$createdAt',
                customerName: { $concat: ['$customerInfo.firstName', ' ', '$customerInfo.lastName'] },
                customerEmail: '$customerInfo.email',
                total: 1,
                status: 1,
                paymentMethod: 1,
                itemsCount: { $size: '$items' },
                'items.product': 1,
                'items.quantity': 1,
                'items.price': 1
              }
            },
            { $sort: { date: -1 } }
          ],
          { maxTimeMS: 10000 }
        );
        break;

      case 'users':
        data = await User.find({
          createdAt: { $gte: startDate, $lte: endDate },
          isDeleted: false,
          ...filters
        })
          .select('firstName lastName email phone university isVerified createdAt lastActive role status')
          .sort('-createdAt')
          .lean()
          .maxTimeMS(10000);
        break;

      case 'inventory':
        data = await Product.find({ isDeleted: false, ...filters })
          .select('name sku price quantity lowStockThreshold category vendor totalSales totalRevenue createdAt')
          .populate('category', 'name')
          .populate('vendor', 'vendorProfile.storeName')
          .sort('name')
          .lean()
          .maxTimeMS(10000);
        break;

      case 'vendors':
        data = await AdminVendor.find({ role: 'vendor', isDeleted: false, ...filters })
          .select('firstName lastName email vendorProfile.storeName vendorProfile.verification.status vendorProfile.performance createdAt status')
          .lean()
          .maxTimeMS(10000);
        break;

      case 'orders':
        data = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate },
          ...filters
        })
          .select('orderNumber total status paymentMethod createdAt updatedAt')
          .populate('customer', 'email')
          .sort('-createdAt')
          .lean()
          .maxTimeMS(10000);
        break;

      case 'products':
        data = await Product.find({ isDeleted: false, ...filters })
          .select('name sku price quantity totalSales totalRevenue status createdAt')
          .populate('category', 'name')
          .populate('vendor', 'vendorProfile.storeName')
          .sort('-totalSales')
          .lean()
          .maxTimeMS(10000);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Generate filename with date
    filename = `${filename}.${format}`;

    // For now, return JSON data
    // In production, you'd generate actual CSV/PDF files here
    res.status(200).json({
      success: true,
      data: {
        reportType,
        format,
        generatedAt: new Date(),
        count: data.length,
        data,
        filename
      }
    });

  } catch (error) {
    console.error('❌ Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// RECENT ACTIVITIES
// ============================================

export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await ActivityLog.find()
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName email avatar')
      .lean()
      .maxTimeMS(3000);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('❌ Recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getActivityStats = async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      }
    ], { maxTimeMS: 3000 });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity stats'
    });
  }
};


// ============================================
// GET PRODUCT CATEGORIES FOR DASHBOARD
// ============================================

/**
 * @desc    Get product categories with counts and revenue for dashboard
 * @route   GET /api/admin/dashboard/categories
 * @access  Private (Admin)
 */
export const getDashboardCategories = async (req, res) => {
  try {
    console.log('📡 Fetching dashboard categories...');
    
    const { limit = 10, sortBy = 'productCount', sortOrder = 'desc' } = req.query;

    // Get all active categories
    const categories = await Category.find({ isActive: true })
      .select('name slug description image sortOrder')
      .sort('sortOrder')
      .lean()
      .maxTimeMS(3000);

    if (!categories.length) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get product counts and revenue for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        // Get product count
        const productCount = await Product.countDocuments({ 
          category: category._id,
          isDeleted: false,
          status: 'active'
        });

        // Get revenue from orders for this category
        const revenueData = await Order.aggregate([
          { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
          { $unwind: '$items' },
          {
            $lookup: {
              from: 'products',
              localField: 'items.product',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' },
          {
            $match: {
              'product.category': category._id
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { 
                $sum: { $multiply: ['$items.price', '$items.quantity'] } 
              },
              totalSold: { $sum: '$items.quantity' }
            }
          }
        ]).maxTimeMS(3000);

        // Get top products in this category
        const topProducts = await Product.find({ 
          category: category._id,
          isDeleted: false,
          status: 'active'
        })
          .sort('-totalSales')
          .limit(3)
          .select('name price totalSales images')
          .lean()
          .maxTimeMS(2000);

        return {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          productCount,
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          totalSold: revenueData[0]?.totalSold || 0,
          topProducts,
          color: getCategoryColor(category.name)
        };
      })
    );

    // Filter out categories with no products (optional - remove if you want to show all)
    const filteredCategories = categoriesWithStats.filter(c => c.productCount > 0);

    // Sort based on query params
    const sortedCategories = filteredCategories.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Apply limit
    const limitedCategories = sortedCategories.slice(0, parseInt(limit));

    // Get summary statistics
    const summary = {
      totalCategories: categories.length,
      totalProducts: filteredCategories.reduce((acc, c) => acc + c.productCount, 0),
      totalRevenue: filteredCategories.reduce((acc, c) => acc + c.totalRevenue, 0),
      topCategory: filteredCategories.length > 0 
        ? filteredCategories.reduce((max, c) => c.productCount > max.productCount ? c : max).name 
        : 'N/A'
    };

    res.status(200).json({
      success: true,
      data: limitedCategories,
      summary
    });

  } catch (error) {
    console.error('❌ Dashboard categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to assign colors to categories
const getCategoryColor = (categoryName) => {
  const colors = [
    'blue', 'purple', 'green', 'orange', 'red', 
    'indigo', 'pink', 'yellow', 'teal', 'cyan',
    'amber', 'lime', 'emerald', 'violet', 'rose'
  ];
  
  // Simple hash function to get consistent color
  const hash = categoryName.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};
// ============================================
// DASHBOARD USERS
// ============================================

export const getDashboardUsers = async (req, res) => {
  try {
    const { 
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find({ isDeleted: false })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('firstName lastName email role status createdAt lastActive avatar')
        .lean()
        .maxTimeMS(3000),
      User.countDocuments({ isDeleted: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Dashboard users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const { timeRange = 'last30' } = req.query;
    const { startDate } = getDateRange(timeRange);

    const stats = await User.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          newUsers: [
            { $match: { createdAt: { $gte: startDate } } },
            { $count: 'count' }
          ],
          activeUsers: [
            { $match: { lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $count: 'count' }
          ]
        }
      }
    ], { maxTimeMS: 5000 });

    res.status(200).json({
      success: true,
      data: {
        total: stats[0]?.total[0]?.count || 0,
        byRole: stats[0]?.byRole || [],
        byStatus: stats[0]?.byStatus || [],
        newUsers: stats[0]?.newUsers[0]?.count || 0,
        activeUsers: stats[0]?.activeUsers[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('❌ User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats'
    });
  }
};