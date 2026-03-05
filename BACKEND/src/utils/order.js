// utils/order.js
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AdminVendor from '../models/AdminVendor.js';
import TaxRate from '../models/TaxRate.js'; // You may need to create this model
import ShippingZone from '../models/ShippingZone.js'; // You may need to create this model
import axios from 'axios';

/**
 * Generate unique order number
 * Format: INV-YYMMDD-XXXX (e.g., INV-240213-0001)
 */
export const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Get count of orders today for sequential number
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
  
  const sequential = (count + 1).toString().padStart(4, '0');
  
  return `INV-${year}${month}${day}-${sequential}`;
};

/**
 * Alternative order number formats
 */
export const generateOrderNumberCustom = async (prefix = 'ORD', format = 'date-seq') => {
  const date = new Date();
  
  switch (format) {
    case 'timestamp':
      return `${prefix}-${Date.now()}`;
      
    case 'random':
      const random = Math.floor(100000 + Math.random() * 900000);
      return `${prefix}-${random}`;
      
    case 'date-seq':
    default:
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const sequential = (count + 1).toString().padStart(4, '0');
      return `${prefix}-${year}${month}${day}-${sequential}`;
  }
};

/**
 * Calculate tax for order items
 */
export const calculateTax = async (items, shippingAddress) => {
  try {
    if (!items || !shippingAddress) {
      return 0;
    }

    let totalTax = 0;

    // Get tax rate based on shipping address
    const taxRate = await getTaxRate(shippingAddress);

    // Calculate tax for each item
    for (const item of items) {
      // Check if product is tax exempt
      const product = await Product.findById(item.productId || item.product);
      if (product?.taxExempt) {
        continue;
      }

      const itemSubtotal = (item.price || item.variant?.price || 0) * item.quantity;
      const itemTax = itemSubtotal * (taxRate / 100);
      
      // Store tax breakdown per item
      item.tax = itemTax;
      totalTax += itemTax;
    }

    return totalTax;
  } catch (error) {
    console.error('Tax calculation error:', error);
    return 0;
  }
};

/**
 * Calculate tax with detailed breakdown
 */
export const calculateTaxDetailed = async (items, shippingAddress) => {
  try {
    const taxBreakdown = [];
    let totalTax = 0;

    // Get applicable tax rates
    const taxRates = await getTaxRatesForLocation(shippingAddress);

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      
      if (product?.taxExempt) {
        continue;
      }

      const itemSubtotal = (item.price || item.variant?.price || 0) * item.quantity;
      
      // Calculate tax for each applicable rate
      for (const rate of taxRates) {
        const itemTax = itemSubtotal * (rate.rate / 100);
        
        taxBreakdown.push({
          name: rate.name,
          rate: rate.rate,
          amount: itemTax,
          jurisdiction: rate.jurisdiction,
          itemId: item._id || item.productId
        });
        
        totalTax += itemTax;
      }
    }

    return {
      total: totalTax,
      breakdown: taxBreakdown
    };
  } catch (error) {
    console.error('Detailed tax calculation error:', error);
    return { total: 0, breakdown: [] };
  }
};

/**
 * Calculate shipping cost
 */
export const calculateShipping = async (items, shippingAddress) => {
  try {
    if (!items || !shippingAddress) {
      return 0;
    }

    // Get shipping zone based on address
    const shippingZone = await getShippingZone(shippingAddress);
    
    if (!shippingZone) {
      // Default shipping calculation
      return calculateDefaultShipping(items);
    }

    // Calculate total weight and dimensions
    const totalWeight = await calculateTotalWeight(items);
    const totalValue = items.reduce((sum, item) => 
      sum + ((item.price || item.variant?.price || 0) * item.quantity), 0
    );

    // Find applicable shipping method
    const shippingMethod = findBestShippingMethod(shippingZone, {
      weight: totalWeight,
      value: totalValue,
      items: items.length
    });

    return shippingMethod?.rate || 0;
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return 0;
  }
};

/**
 * Calculate shipping with options
 */
export const calculateShippingDetailed = async (items, shippingAddress) => {
  try {
    const shippingOptions = [];

    // Get shipping zone
    const shippingZone = await getShippingZone(shippingAddress);
    
    if (!shippingZone) {
      // Return default options
      return [{
        method: 'Standard Shipping',
        carrier: 'Standard',
        rate: calculateDefaultShipping(items),
        estimatedDays: { min: 5, max: 7 },
        guaranteed: false
      }];
    }

    // Calculate total weight and dimensions
    const totalWeight = await calculateTotalWeight(items);
    const totalValue = items.reduce((sum, item) => 
      sum + ((item.price || item.variant?.price || 0) * item.quantity), 0
    );

    // Get all available shipping methods for this zone
    for (const method of shippingZone.methods) {
      if (isShippingMethodEligible(method, { weight: totalWeight, value: totalValue })) {
        shippingOptions.push({
          id: method._id,
          method: method.name,
          carrier: method.carrier,
          rate: method.rate,
          freeShippingThreshold: method.freeShippingThreshold,
          estimatedDays: method.estimatedDays,
          guaranteed: method.guaranteed || false,
          requiresSignature: method.requiresSignature || false
        });
      }
    }

    return shippingOptions;
  } catch (error) {
    console.error('Detailed shipping calculation error:', error);
    return [];
  }
};

/**
 * Get tax rate for location
 */
async function getTaxRate(address) {
  try {
    // Try to get from database first
    const taxRate = await TaxRate.findOne({
      country: address.country,
      state: address.state,
      city: address.city,
      active: true
    });

    if (taxRate) {
      return taxRate.rate;
    }

    // Fallback to default rate or API
    return await getTaxRateFromAPI(address);
  } catch (error) {
    console.error('Get tax rate error:', error);
    return 0; // Default to no tax
  }
}

/**
 * Get all tax rates for location
 */
async function getTaxRatesForLocation(address) {
  try {
    const taxRates = await TaxRate.find({
      $or: [
        { country: address.country, state: address.state, city: address.city },
        { country: address.country, state: address.state, city: null },
        { country: address.country, state: null, city: null }
      ],
      active: true
    }).sort({ priority: 1 });

    return taxRates;
  } catch (error) {
    console.error('Get tax rates error:', error);
    return [];
  }
}

/**
 * Get shipping zone for address
 */
async function getShippingZone(address) {
  try {
    const zone = await ShippingZone.findOne({
      $or: [
        { 'countries.country': address.country, 'countries.state': address.state },
        { 'countries.country': address.country, 'countries.state': null }
      ],
      active: true
    }).populate('methods');

    return zone;
  } catch (error) {
    console.error('Get shipping zone error:', error);
    return null;
  }
}

/**
 * Calculate total weight of items
 */
async function calculateTotalWeight(items) {
  let totalWeight = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId || item.product);
    if (product?.weight) {
      totalWeight += product.weight * item.quantity;
    }
  }

  return totalWeight;
}

/**
 * Find best shipping method based on criteria
 */
function findBestShippingMethod(zone, criteria) {
  if (!zone?.methods || zone.methods.length === 0) {
    return null;
  }

  // Sort by rate and find eligible method
  const eligibleMethods = zone.methods
    .filter(method => isShippingMethodEligible(method, criteria))
    .sort((a, b) => a.rate - b.rate);

  return eligibleMethods[0] || null;
}

/**
 * Check if shipping method is eligible
 */
function isShippingMethodEligible(method, criteria) {
  if (method.minWeight && criteria.weight < method.minWeight) return false;
  if (method.maxWeight && criteria.weight > method.maxWeight) return false;
  if (method.minValue && criteria.value < method.minValue) return false;
  if (method.maxValue && criteria.value > method.maxValue) return false;
  
  return true;
}

/**
 * Calculate default shipping rate
 */
function calculateDefaultShipping(items) {
  const baseRate = 5.99;
  const perItemRate = 1.99;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return baseRate + (perItemRate * totalItems);
}

/**
 * Get tax rate from external API
 */
async function getTaxRateFromAPI(address) {
  try {
    // Example using TaxJar API (you'll need to sign up and get API key)
    if (process.env.TAXJAR_API_KEY) {
      const response = await axios.get('https://api.taxjar.com/v2/rates', {
        params: {
          street: address.addressLine1,
          city: address.city,
          state: address.state,
          country: address.country,
          zip: address.postalCode
        },
        headers: {
          'Authorization': `Bearer ${process.env.TAXJAR_API_KEY}`
        }
      });

      return response.data.rate?.combined_rate || 0;
    }

    // Fallback to simple rate based on country/state
    const rates = {
      'US': {
        'CA': 8.25,
        'NY': 8.875,
        'TX': 6.25,
        'FL': 6.0,
        'default': 5.0
      },
      'CA': {
        'ON': 13.0,
        'BC': 12.0,
        'QC': 14.975,
        'default': 11.0
      },
      'GB': 20.0,
      'AU': 10.0,
      'default': 10.0
    };

    const countryRates = rates[address.country];
    if (countryRates) {
      if (typeof countryRates === 'object') {
        return countryRates[address.state] || countryRates.default || 0;
      }
      return countryRates;
    }

    return 0;
  } catch (error) {
    console.error('Tax API error:', error);
    return 0;
  }
}

/**
 * Validate shipping address
 */
export const validateShippingAddress = (address) => {
  const required = ['firstName', 'lastName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
  const missing = required.filter(field => !address[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate postal code format (basic)
  const postalCodeRegex = /^[A-Z0-9]{3,10}$/i;
  if (!postalCodeRegex.test(address.postalCode.replace(/\s/g, ''))) {
    throw new Error('Invalid postal code format');
  }

  return true;
};

/**
 * Calculate order totals
 */
export const calculateOrderTotals = (items) => {
  const subtotal = items.reduce((sum, item) => 
    sum + ((item.price || 0) * (item.quantity || 1)), 0
  );
  
  const discount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const tax = items.reduce((sum, item) => sum + (item.tax || 0), 0);
  const shipping = items.reduce((sum, item) => sum + (item.shipping || 0), 0);
  
  const total = subtotal - discount + shipping + tax;

  return {
    subtotal,
    discount,
    tax,
    shipping,
    total,
    itemCount: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    uniqueItemCount: items.length
  };
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Generate order summary
 */
export const generateOrderSummary = (order) => {
  return {
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    customer: order.customerName || order.guestEmail,
    items: order.items?.length || 0,
    subtotal: formatCurrency(order.subtotal),
    discount: formatCurrency(order.discountTotal),
    shipping: formatCurrency(order.shippingTotal),
    tax: formatCurrency(order.taxTotal),
    total: formatCurrency(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus
  };
};

export default {
  generateOrderNumber,
  generateOrderNumberCustom,
  calculateTax,
  calculateTaxDetailed,
  calculateShipping,
  calculateShippingDetailed,
  validateShippingAddress,
  calculateOrderTotals,
  formatCurrency,
  generateOrderSummary
};