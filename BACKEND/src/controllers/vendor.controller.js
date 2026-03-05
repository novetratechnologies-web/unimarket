import AdminVendor from '../models/AdminVendor.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import OrderItem from '../models/Order.js';
import Payout from '../models/Payout.js';
import Category from '../models/Category.cjs';
import ActivityLog from '../models/ActivityLog.js';
import Commission from '../models/Commission.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import { createAuditLog } from '../middleware/audit.js';
import { uploadToCloudinary } from '../utils/upload.js';
import { generateSKU, generateSlug } from '../utils/helpers.js';

// ============================================
// VENDOR AUTHENTICATION
// ============================================

/**
 * @desc    Vendor Login
 * @route   POST /api/vendor/auth/login
 * @access  Public
 */
export const vendorLogin = async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    const vendor = await AdminVendor.findOne({ 
      email, 
      role: 'vendor',
      isDeleted: false 
    }).select('+password +twoFactorAuth.secret +twoFactorAuth.backupCodes');

    if (!vendor) {
      await createAuditLog({
        user: null,
        action: 'login',
        resourceType: 'vendor',
        status: 'failure',
        description: `Failed vendor login attempt: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (vendor.lockUntil && vendor.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((vendor.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ 
        success: false, 
        message: `Account locked. Try again in ${minutesLeft} minutes`,
        locked: true,
        lockUntil: vendor.lockUntil
      });
    }

    // Check vendor status
    if (vendor.status !== 'active') {
      let message = 'Your account is not active';
      if (vendor.status === 'pending_approval') {
        message = 'Your account is pending approval from admin';
      } else if (vendor.status === 'suspended') {
        message = 'Your account has been suspended. Please contact support';
      } else if (vendor.status === 'rejected') {
        message = 'Your vendor application was rejected';
      }
      
      return res.status(403).json({ success: false, message, status: vendor.status });
    }

    // Verify password
    const isPasswordValid = await vendor.comparePassword(password);
    if (!isPasswordValid) {
      await vendor.incrementLoginAttempts();
      
      await createAuditLog({
        user: vendor._id,
        action: 'login',
        resourceType: 'vendor',
        status: 'failure',
        description: 'Failed vendor login - invalid password',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check 2FA
    if (vendor.twoFactorAuth?.enabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ 
          success: true, 
          requiresTwoFactor: true,
          message: '2FA code required'
        });
      }

      const isValid2FA = await verifyTwoFactorCode(vendor, twoFactorCode);
      if (!isValid2FA) {
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
      }
    }

    // Reset login attempts
    await vendor.resetLoginAttempts();

    // Update last login
    vendor.lastLogin = new Date();
    vendor.lastLoginIp = req.ip;
    
    // Add to login history
    if (!vendor.adminProfile) vendor.adminProfile = {};
    if (!vendor.adminProfile.loginHistory) vendor.adminProfile.loginHistory = [];
    
    vendor.adminProfile.loginHistory.push({
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      location: req.body.location || 'Unknown',
      success: true
    });
    
    await vendor.save();

    // Generate tokens
    const accessToken = generateVendorToken(vendor);
    const refreshToken = generateVendorRefreshToken(vendor);

    // Save refresh token
    vendor.refreshToken = {
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    await vendor.save();

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    if (!vendor.sessionTokens) vendor.sessionTokens = [];
    vendor.sessionTokens.push({
      token: sessionToken,
      deviceInfo: req.body.deviceInfo || {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      lastUsed: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await vendor.save();

    // Audit log
    await createAuditLog({
      user: vendor._id,
      action: 'login',
      resourceType: 'vendor',
      resourceId: vendor._id,
      status: 'success',
      description: `Vendor logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Remove sensitive data
    vendor.password = undefined;
    vendor.twoFactorAuth = undefined;

    res.status(200).json({
      success: true,
      data: {
        user: vendor,
        accessToken,
        refreshToken,
        sessionToken,
        expiresIn: 24 * 60 * 60
      }
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

/**
 * @desc    Vendor Registration
 * @route   POST /api/vendor/auth/register
 * @access  Public
 */
export const vendorRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      storeName,
      storeDescription,
      businessType,
      taxId,
      storeAddress
    } = req.body;

    // Check if vendor exists
    const existingVendor = await AdminVendor.findOne({ 
      $or: [
        { email },
        { 'vendorProfile.storeSlug': generateSlug(storeName) }
      ] 
    });

    if (existingVendor) {
      if (existingVendor.email === email) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      if (existingVendor.vendorProfile?.storeSlug === generateSlug(storeName)) {
        return res.status(400).json({ success: false, message: 'Store name already taken' });
      }
    }

    // Handle file uploads
    let logoUrl = null;
    let bannerUrl = null;

    if (req.files) {
      if (req.files.logo) {
        const logoUpload = await uploadToCloudinary(req.files.logo[0], 'vendors/logos');
        logoUrl = logoUpload.secure_url;
      }
      if (req.files.banner) {
        const bannerUpload = await uploadToCloudinary(req.files.banner[0], 'vendors/banners');
        bannerUrl = bannerUpload.secure_url;
      }
    }

    // Create new vendor
    const newVendor = await AdminVendor.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role: 'vendor',
      status: 'pending_approval',
      emailVerified: false,
      vendorProfile: {
        storeName,
        storeSlug: generateSlug(storeName),
        storeDescription,
        businessType,
        branding: {
          logo: logoUrl ? { url: logoUrl, alt: storeName } : null,
          banner: bannerUrl ? { url: bannerUrl, alt: storeName } : null
        },
        taxInfo: {
          taxId,
          taxIdType: req.body.taxIdType || 'ein'
        },
        addresses: storeAddress ? [{
          type: 'business',
          isDefault: true,
          ...storeAddress
        }] : [],
        verification: {
          status: 'pending',
          documents: []
        },
        performance: {
          totalSales: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalCommission: 0,
          averageOrderValue: 0,
          customerRating: { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
        }
      },
      notificationPreferences: {
        email: {
          orders: true,
          payouts: true,
          products: true,
          reviews: true,
          marketing: false,
          security: true,
          system: true
        }
      }
    });

    // Send verification email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newVendor.verificationToken = verificationToken;
    await newVendor.save();

    await sendEmail({
      to: email,
      subject: 'Verify Your Vendor Account',
      template: 'vendor-verification',
      data: {
        firstName,
        storeName,
        verificationLink: `${process.env.FRONTEND_URL}/vendor/verify-email?token=${verificationToken}`,
        loginUrl: `${process.env.FRONTEND_URL}/vendor/login`
      }
    });

    // Notify admins about new vendor registration
    const admins = await AdminVendor.find({ 
      role: { $in: ['super_admin', 'admin'] },
      status: 'active',
      'notificationPreferences.email.vendors': true
    });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'New Vendor Registration Pending Approval',
        template: 'admin-new-vendor',
        data: {
          adminName: admin.firstName,
          vendorName: `${firstName} ${lastName}`,
          storeName,
          vendorEmail: email,
          approvalLink: `${process.env.FRONTEND_URL}/admin/vendors/${newVendor._id}`
        }
      });
    }

    await createAuditLog({
      user: newVendor._id,
      action: 'create',
      resourceType: 'vendor',
      resourceId: newVendor._id,
      status: 'success',
      description: `New vendor registration: ${storeName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Remove sensitive data
    newVendor.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        id: newVendor._id,
        email: newVendor.email,
        storeName: newVendor.vendorProfile.storeName,
        status: newVendor.status
      }
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

/**
 * @desc    Verify Vendor Email
 * @route   GET /api/vendor/auth/verify-email/:token
 * @access  Public
 */
export const verifyVendorEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const vendor = await AdminVendor.findOne({ 
      verificationToken: token,
      role: 'vendor'
    });

    if (!vendor) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    vendor.emailVerified = true;
    vendor.emailVerifiedAt = new Date();
    vendor.verificationToken = undefined;
    
    // If all verifications are complete, update status
    if (vendor.vendorProfile?.verification?.status === 'pending') {
      vendor.status = 'pending_approval';
    }

    await vendor.save();

    await createAuditLog({
      user: vendor._id,
      action: 'update',
      resourceType: 'vendor',
      resourceId: vendor._id,
      status: 'success',
      description: 'Vendor email verified',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login once your account is approved.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Email verification failed', error: error.message });
  }
};

/**
 * @desc    Vendor Logout
 * @route   POST /api/vendor/auth/logout
 * @access  Private (Vendor)
 */
export const vendorLogout = async (req, res) => {
  try {
    const { sessionToken } = req.body;
    const vendorId = req.user._id;

    const vendor = await AdminVendor.findById(vendorId);
    
    if (vendor) {
      if (sessionToken) {
        vendor.sessionTokens = vendor.sessionTokens.filter(
          token => token.token !== sessionToken
        );
      } else {
        vendor.sessionTokens = [];
      }
      
      vendor.refreshToken = null;
      await vendor.save();

      await createAuditLog({
        user: vendorId,
        action: 'logout',
        resourceType: 'vendor',
        resourceId: vendorId,
        status: 'success',
        description: 'Vendor logged out',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Vendor logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
  }
};

// ============================================
// VENDOR PROFILE MANAGEMENT
// ============================================

/**
 * @desc    Get Vendor Profile
 * @route   GET /api/vendor/profile
 * @access  Private (Vendor)
 */
export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await AdminVendor.findById(req.user._id)
      .select('-password -refreshToken -twoFactorAuth.secret -twoFactorAuth.backupCodes -sessionTokens')
      .populate('vendorProfile.addresses');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Get additional stats
    const [
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock,
      pendingOrders,
      totalPayouts,
      recentPayouts
    ] = await Promise.all([
      Product.countDocuments({ vendor: vendor._id, isDeleted: false }),
      Product.countDocuments({ vendor: vendor._id, status: 'active', isDeleted: false }),
      Product.countDocuments({ vendor: vendor._id, quantity: 0, status: 'active', isDeleted: false }),
      Product.countDocuments({ 
        vendor: vendor._id, 
        quantity: { $gt: 0, $lte: '$lowStockThreshold' },
        status: 'active',
        isDeleted: false 
      }),
      OrderItem.countDocuments({ 
        vendor: vendor._id, 
        status: 'pending',
        order: { $exists: true }
      }),
      Payout.aggregate([
        { $match: { vendor: vendor._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]),
      Payout.find({ vendor: vendor._id })
        .sort('-createdAt')
        .limit(5)
        .select('payoutNumber netAmount status createdAt')
    ]);

    // Calculate completion score
    const completionScore = calculateProfileCompletion(vendor);

    res.status(200).json({
      success: true,
      data: {
        ...vendor.toObject(),
        stats: {
          totalProducts,
          activeProducts,
          outOfStock,
          lowStock,
          pendingOrders,
          totalPayouts: totalPayouts[0]?.total || 0,
          recentPayouts,
          profileCompletion: completionScore
        }
      }
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

/**
 * @desc    Update Vendor Profile
 * @route   PUT /api/vendor/profile
 * @access  Private (Vendor)
 */
export const updateVendorProfile = async (req, res) => {
  try {
    const vendor = await AdminVendor.findById(req.user._id);
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      storeName,
      storeTagline,
      storeDescription,
      storeStory,
      businessType,
      yearEstablished
    } = req.body;

    // Track changes for audit
    const changes = [];

    // Update basic info
    if (firstName && firstName !== vendor.firstName) {
      changes.push({ field: 'firstName', oldValue: vendor.firstName, newValue: firstName });
      vendor.firstName = firstName;
    }
    if (lastName && lastName !== vendor.lastName) {
      changes.push({ field: 'lastName', oldValue: vendor.lastName, newValue: lastName });
      vendor.lastName = lastName;
    }
    if (phoneNumber && phoneNumber !== vendor.phoneNumber) {
      changes.push({ field: 'phoneNumber', oldValue: vendor.phoneNumber, newValue: phoneNumber });
      vendor.phoneNumber = phoneNumber;
    }

    // Update store info
    if (storeName && storeName !== vendor.vendorProfile?.storeName) {
      const newSlug = generateSlug(storeName);
      // Check if slug is available
      const existingVendor = await AdminVendor.findOne({
        'vendorProfile.storeSlug': newSlug,
        _id: { $ne: vendor._id }
      });
      
      if (!existingVendor) {
        changes.push({ field: 'storeName', oldValue: vendor.vendorProfile?.storeName, newValue: storeName });
        vendor.vendorProfile.storeName = storeName;
        vendor.vendorProfile.storeSlug = newSlug;
      } else {
        return res.status(400).json({ success: false, message: 'Store name already taken' });
      }
    }

    if (storeTagline) vendor.vendorProfile.storeTagline = storeTagline;
    if (storeDescription) vendor.vendorProfile.storeDescription = storeDescription;
    if (storeStory) vendor.vendorProfile.storeStory = storeStory;
    if (businessType) vendor.vendorProfile.businessType = businessType;
    if (yearEstablished) vendor.vendorProfile.yearEstablished = parseInt(yearEstablished);

    // Handle logo upload
    if (req.files?.logo) {
      const logoUpload = await uploadToCloudinary(req.files.logo[0], 'vendors/logos');
      vendor.vendorProfile.branding = {
        ...vendor.vendorProfile.branding,
        logo: {
          url: logoUpload.secure_url,
          alt: vendor.vendorProfile.storeName,
          dimensions: { width: logoUpload.width, height: logoUpload.height }
        }
      };
      changes.push({ field: 'branding.logo', oldValue: 'Updated', newValue: 'New logo uploaded' });
    }

    // Handle banner upload
    if (req.files?.banner) {
      const bannerUpload = await uploadToCloudinary(req.files.banner[0], 'vendors/banners');
      vendor.vendorProfile.branding = {
        ...vendor.vendorProfile.branding,
        banner: {
          url: bannerUpload.secure_url,
          alt: vendor.vendorProfile.storeName,
          dimensions: { width: bannerUpload.width, height: bannerUpload.height }
        }
      };
      changes.push({ field: 'branding.banner', oldValue: 'Updated', newValue: 'New banner uploaded' });
    }

    vendor.updatedAt = new Date();
    await vendor.save();

    if (changes.length > 0) {
      await createAuditLog({
        user: vendor._id,
        action: 'update',
        resourceType: 'vendor',
        resourceId: vendor._id,
        status: 'success',
        description: 'Updated vendor profile',
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

/**
 * @desc    Update Store Address
 * @route   POST /api/vendor/profile/address
 * @access  Private (Vendor)
 */
export const addStoreAddress = async (req, res) => {
  try {
    const vendor = await AdminVendor.findById(req.user._id);
    
    const addressData = {
      ...req.body,
      _id: new mongoose.Types.ObjectId()
    };

    if (!vendor.vendorProfile.addresses) {
      vendor.vendorProfile.addresses = [];
    }

    // If this is the first address or marked as default
    if (vendor.vendorProfile.addresses.length === 0 || addressData.isDefault) {
      // Remove default from others
      vendor.vendorProfile.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    vendor.vendorProfile.addresses.push(addressData);
    await vendor.save();

    await createAuditLog({
      user: vendor._id,
      action: 'create',
      resourceType: 'vendor',
      resourceId: vendor._id,
      status: 'success',
      description: `Added new ${addressData.type} address`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: addressData
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ success: false, message: 'Failed to add address', error: error.message });
  }
};

/**
 * @desc    Update Social Media Links
 * @route   PUT /api/vendor/profile/social
 * @access  Private (Vendor)
 */
export const updateSocialMedia = async (req, res) => {
  try {
    const vendor = await AdminVendor.findById(req.user._id);
    
    vendor.vendorProfile.branding.socialMedia = {
      ...vendor.vendorProfile.branding.socialMedia,
      ...req.body
    };

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Social media links updated',
      data: vendor.vendorProfile.branding.socialMedia
    });
  } catch (error) {
    console.error('Update social media error:', error);
    res.status(500).json({ success: false, message: 'Failed to update social media', error: error.message });
  }
};

/**
 * @desc    Update Bank Details
 * @route   PUT /api/vendor/profile/bank
 * @access  Private (Vendor)
 */
export const updateBankDetails = async (req, res) => {
  try {
    const vendor = await AdminVendor.findById(req.user._id).select('+vendorProfile.banking.primaryBank.accountNumber +vendorProfile.banking.primaryBank.routingNumber');
    
    const { 
      accountHolderName, 
      accountNumber, 
      routingNumber, 
      swiftCode, 
      bankName, 
      bankAddress 
    } = req.body;

    vendor.vendorProfile.banking = {
      ...vendor.vendorProfile.banking,
      primaryBank: {
        accountHolderName,
        accountNumber,
        routingNumber,
        swiftCode,
        bankName,
        bankAddress,
        verified: false,
        currency: req.body.currency || 'USD'
      }
    };

    await vendor.save();

    await createAuditLog({
      user: vendor._id,
      action: 'update',
      resourceType: 'vendor',
      resourceId: vendor._id,
      status: 'success',
      description: 'Updated bank details',
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Notify admins about bank update for verification
    const admins = await AdminVendor.find({ 
      role: { $in: ['super_admin', 'admin'] },
      status: 'active',
      permissions: 'vendors.payouts.process'
    });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'Vendor Bank Details Updated - Verification Required',
        template: 'admin-bank-verification',
        data: {
          adminName: admin.firstName,
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          storeName: vendor.vendorProfile.storeName,
          vendorId: vendor._id,
          dashboardLink: `${process.env.FRONTEND_URL}/admin/vendors/${vendor._id}`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully. They will be verified shortly.',
      data: {
        accountHolderName,
        bankName,
        verified: false
      }
    });
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ success: false, message: 'Failed to update bank details', error: error.message });
  }
};

// ============================================
// PRODUCT MANAGEMENT
// ============================================

/**
 * @desc    Create Product
 * @route   POST /api/vendor/products
 * @access  Private (Vendor)
 */
export const createProduct = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const productData = req.body;

    // Check vendor limits
    const productCount = await Product.countDocuments({ 
      vendor: vendorId, 
      isDeleted: false 
    });

    const vendor = await AdminVendor.findById(vendorId);
    const maxProducts = vendor.vendorProfile?.subscription?.plan === 'enterprise' ? 10000 :
                       vendor.vendorProfile?.subscription?.plan === 'professional' ? 5000 :
                       vendor.vendorProfile?.subscription?.plan === 'basic' ? 1000 : 500;

    if (productCount >= maxProducts) {
      return res.status(403).json({ 
        success: false, 
        message: `You have reached the maximum product limit (${maxProducts}) for your plan. Please upgrade to add more products.` 
      });
    }

    // Generate SKU if not provided
    if (!productData.sku) {
      productData.sku = generateSKU(vendor.vendorProfile.storeName, productData.name);
    }

    // Check if SKU is unique
    const existingProduct = await Product.findOne({ 
      sku: productData.sku,
      vendor: vendorId 
    });

    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'SKU already exists' });
    }

    // Handle image uploads
    const images = [];
    if (req.files?.images) {
      for (let i = 0; i < req.files.images.length; i++) {
        const file = req.files.images[i];
        const upload = await uploadToCloudinary(file, `vendors/${vendorId}/products`);
        images.push({
          url: upload.secure_url,
          alt: productData.name,
          isPrimary: i === 0,
          sortOrder: i
        });
      }
    }

    // Create product
    const product = await Product.create({
      ...productData,
      vendor: vendorId,
      slug: generateSlug(productData.name),
      images,
      sku: productData.sku,
      createdBy: vendorId,
      status: 'draft', // Products start as draft
      inventory: {
        quantity: productData.quantity || 0,
        lowStockThreshold: productData.lowStockThreshold || 5,
        trackQuantity: productData.trackQuantity !== false
      }
    });

    // Update vendor product count
    vendor.vendorProfile.performance.totalProducts = (vendor.vendorProfile.performance.totalProducts || 0) + 1;
    await vendor.save();

    await createAuditLog({
      user: vendorId,
      action: 'create',
      resourceType: 'product',
      resourceId: product._id,
      status: 'success',
      description: `Created new product: ${product.name}`,
      metadata: { sku: product.sku, price: product.price },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

/**
 * @desc    Get Vendor Products
 * @route   GET /api/vendor/products
 * @access  Private (Vendor)
 */
export const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      lowStock,
      outOfStock
    } = req.query;

    const query = {
      vendor: vendorId,
      isDeleted: false
    };

    if (status) query.status = status;
    if (category) query.categories = category;
    if (lowStock === 'true') {
      query.$expr = {
        $and: [
          { $lte: ['$quantity', '$lowStockThreshold'] },
          { $gt: ['$quantity', 0] }
        ]
      };
    }
    if (outOfStock === 'true') query.quantity = 0;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('categories', 'name slug'),
      Product.countDocuments(query)
    ]);

    // Get inventory summary
    const inventorySummary = await Product.aggregate([
      { $match: { vendor: vendorId, isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          totalCost: { $sum: { $multiply: ['$cost', '$quantity'] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: products,
      inventorySummary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

/**
 * @desc    Update Product
 * @route   PUT /api/vendor/products/:id
 * @access  Private (Vendor)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user._id;
    const updates = req.body;

    const product = await Product.findOne({ 
      _id: id, 
      vendor: vendorId,
      isDeleted: false 
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Track changes
    const changes = [];

    // Update fields
    const allowedUpdates = [
      'name', 'description', 'shortDescription', 'price', 'compareAtPrice',
      'cost', 'quantity', 'lowStockThreshold', 'sku', 'barcode',
      'categories', 'tags', 'status', 'visibility', 'weight',
      'dimensions', 'shippingClass', 'isTaxable', 'taxClass'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== product[field]) {
        changes.push({
          field,
          oldValue: product[field],
          newValue: updates[field]
        });
        product[field] = updates[field];
      }
    });

    // Handle images
    if (req.files?.newImages) {
      for (const file of req.files.newImages) {
        const upload = await uploadToCloudinary(file, `vendors/${vendorId}/products`);
        product.images.push({
          url: upload.secure_url,
          alt: product.name,
          isPrimary: product.images.length === 0,
          sortOrder: product.images.length
        });
      }
      changes.push({ field: 'images', oldValue: 'Updated', newValue: `${req.files.newImages.length} new images added` });
    }

    // Remove images
    if (updates.removeImages) {
      const removeIds = Array.isArray(updates.removeImages) 
        ? updates.removeImages 
        : [updates.removeImages];
      
      product.images = product.images.filter(img => !removeIds.includes(img._id.toString()));
      changes.push({ field: 'images', oldValue: 'Updated', newValue: `${removeIds.length} images removed` });
    }

    // Set primary image
    if (updates.primaryImageId) {
      product.images.forEach(img => {
        img.isPrimary = img._id.toString() === updates.primaryImageId;
      });
    }

    // Update slug if name changed
    if (updates.name && updates.name !== product.name) {
      product.slug = generateSlug(updates.name);
    }

    product.updatedBy = vendorId;
    product.updatedAt = new Date();
    await product.save();

    // Update vendor product stats if status changed to active
    if (updates.status === 'active' && product.status !== 'active') {
      const vendor = await AdminVendor.findById(vendorId);
      vendor.vendorProfile.performance.activeProducts = 
        (vendor.vendorProfile.performance.activeProducts || 0) + 1;
      await vendor.save();
    }

    await createAuditLog({
      user: vendorId,
      action: 'update',
      resourceType: 'product',
      resourceId: product._id,
      status: 'success',
      description: `Updated product: ${product.name}`,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

/**
 * @desc    Delete Product
 * @route   DELETE /api/vendor/products/:id
 * @access  Private (Vendor)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user._id;

    const product = await Product.findOne({ 
      _id: id, 
      vendor: vendorId,
      isDeleted: false 
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.deletedBy = vendorId;
    product.status = 'deleted';
    await product.save();

    // Update vendor stats
    const vendor = await AdminVendor.findById(vendorId);
    vendor.vendorProfile.performance.totalProducts = 
      Math.max(0, (vendor.vendorProfile.performance.totalProducts || 0) - 1);
    
    if (product.status === 'active') {
      vendor.vendorProfile.performance.activeProducts = 
        Math.max(0, (vendor.vendorProfile.performance.activeProducts || 0) - 1);
    }
    
    await vendor.save();

    await createAuditLog({
      user: vendorId,
      action: 'delete',
      resourceType: 'product',
      resourceId: product._id,
      status: 'success',
      description: `Deleted product: ${product.name}`,
      metadata: { sku: product.sku },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

/**
 * @desc    Bulk Update Products
 * @route   POST /api/vendor/products/bulk
 * @access  Private (Vendor)
 */
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, action, data } = req.body;
    const vendorId = req.user._id;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs required' });
    }

    let updateData = {};
    let result;

    switch (action) {
      case 'activate':
        updateData = { 
          status: 'active',
          updatedBy: vendorId,
          updatedAt: new Date()
        };
        break;
      case 'deactivate':
        updateData = { 
          status: 'inactive',
          updatedBy: vendorId,
          updatedAt: new Date()
        };
        break;
      case 'update-price':
        updateData = { 
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          updatedBy: vendorId,
          updatedAt: new Date()
        };
        break;
      case 'update-quantity':
        updateData = { 
          quantity: data.quantity,
          updatedBy: vendorId,
          updatedAt: new Date()
        };
        break;
      case 'add-category':
        result = await Product.updateMany(
          { _id: { $in: productIds }, vendor: vendorId },
          { $addToSet: { categories: data.categoryId } }
        );
        break;
      case 'remove-category':
        result = await Product.updateMany(
          { _id: { $in: productIds }, vendor: vendorId },
          { $pull: { categories: data.categoryId } }
        );
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    if (!result) {
      result = await Product.updateMany(
        { _id: { $in: productIds }, vendor: vendorId },
        updateData
      );
    }

    await createAuditLog({
      user: vendorId,
      action: 'bulk_update',
      resourceType: 'product',
      status: 'success',
      description: `Bulk ${action} on ${result.modifiedCount} products`,
      metadata: { productIds, action, data },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} products`,
      data: result
    });
  } catch (error) {
    console.error('Bulk update products error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk update products', error: error.message });
  }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * @desc    Get Vendor Orders
 * @route   GET /api/vendor/orders
 * @access  Private (Vendor)
 */
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      vendor: vendorId,
      order: { $exists: true }
    };

    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // First get order items
    const orderItemsQuery = OrderItem.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('product', 'name sku images price')
      .populate('order', 'orderNumber customer guestEmail shippingAddress billingAddress createdAt');

    if (search) {
      orderItemsQuery.populate({
        path: 'order',
        match: {
          $or: [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'guestEmail': { $regex: search, $options: 'i' } },
            { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
            { 'shippingAddress.lastName': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    const [orderItems, total] = await Promise.all([
      orderItemsQuery,
      OrderItem.countDocuments(query)
    ]);

    // Get order statistics
    const statistics = await OrderItem.aggregate([
      { $match: { vendor: vendorId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Get recent payouts
    const recentPayouts = await Payout.find({ vendor: vendorId })
      .sort('-createdAt')
      .limit(5)
      .select('payoutNumber netAmount status createdAt');

    res.status(200).json({
      success: true,
      data: orderItems,
      statistics,
      recentPayouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
};

/**
 * @desc    Get Single Order
 * @route   GET /api/vendor/orders/:id
 * @access  Private (Vendor)
 */
export const getVendorOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user._id;

    const orderItem = await OrderItem.findOne({ 
      _id: id, 
      vendor: vendorId 
    })
      .populate('product', 'name sku images price description')
      .populate('order')
      .populate({
        path: 'order',
        populate: {
          path: 'shippingMethod paymentMethod'
        }
      });

    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: orderItem
    });
  } catch (error) {
    console.error('Get vendor order error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
};

/**
 * @desc    Update Order Status
 * @route   PUT /api/vendor/orders/:id/status
 * @access  Private (Vendor)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, carrier, note } = req.body;
    const vendorId = req.user._id;

    const orderItem = await OrderItem.findOne({ 
      _id: id, 
      vendor: vendorId 
    }).populate('order');

    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = orderItem.status;
    orderItem.status = status;
    
    // Update shipping tracking
    if (trackingNumber && carrier) {
      if (!orderItem.order.shippingTracking) {
        orderItem.order.shippingTracking = [];
      }
      
      orderItem.order.shippingTracking.push({
        carrier,
        trackingNumber,
        trackingUrl: generateTrackingUrl(carrier, trackingNumber),
        status: 'shipped',
        shippedAt: new Date()
      });
    }

    // Add status history
    if (!orderItem.order.statusHistory) {
      orderItem.order.statusHistory = [];
    }
    
    orderItem.order.statusHistory.push({
      status,
      note: note || `Order status updated to ${status} by vendor`,
      changedBy: vendorId,
      changedAt: new Date()
    });

    await orderItem.save();
    await orderItem.order.save();

    // Update vendor performance metrics
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const vendor = await AdminVendor.findById(vendorId);
      vendor.vendorProfile.performance.fulfillmentRate = 
        calculateFulfillmentRate(vendor, orderItem.order);
      await vendor.save();
    }

    // Send notification to customer
    if (orderItem.order.customer || orderItem.order.guestEmail) {
      await sendEmail({
        to: orderItem.order.customer?.email || orderItem.order.guestEmail,
        subject: `Order Update: #${orderItem.order.orderNumber}`,
        template: 'customer-order-update',
        data: {
          customerName: orderItem.order.customer?.firstName || orderItem.order.guestDetails?.firstName,
          orderNumber: orderItem.order.orderNumber,
          productName: orderItem.productSnapshot?.name,
          status,
          trackingNumber,
          trackingUrl: orderItem.order.shippingTracking?.[0]?.trackingUrl,
          storeName: req.user.vendorProfile.storeName
        }
      });
    }

    await createAuditLog({
      user: vendorId,
      action: 'update',
      resourceType: 'order',
      resourceId: orderItem.order._id,
      status: 'success',
      description: `Updated order item status to ${status}`,
      changes: [{ field: 'status', oldValue: oldStatus, newValue: status }],
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: orderItem
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};

/**
 * @desc    Process Refund
 * @route   POST /api/vendor/orders/:id/refund
 * @access  Private (Vendor)
 */
export const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, notes } = req.body;
    const vendorId = req.user._id;

    const orderItem = await OrderItem.findOne({ 
      _id: id, 
      vendor: vendorId 
    }).populate('order').populate('product');

    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    if (orderItem.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Order item already refunded' });
    }

    const refundQuantity = quantity || orderItem.quantity;
    const refundAmount = (orderItem.price / orderItem.quantity) * refundQuantity;

    orderItem.refundedQuantity = (orderItem.refundedQuantity || 0) + refundQuantity;
    orderItem.refundedAmount = (orderItem.refundedAmount || 0) + refundAmount;
    orderItem.refundReason = reason;
    orderItem.refundedAt = new Date();

    if (orderItem.refundedQuantity >= orderItem.quantity) {
      orderItem.status = 'refunded';
    } else {
      orderItem.status = 'partially_refunded';
    }

    await orderItem.save();

    // Update product inventory
    const product = await Product.findById(orderItem.product._id);
    if (product) {
      product.quantity += refundQuantity;
      await product.save();
    }

    // Update vendor performance
    const vendor = await AdminVendor.findById(vendorId);
    vendor.vendorProfile.performance.refundRate = 
      calculateRefundRate(vendor, orderItem.order);
    await vendor.save();

    await createAuditLog({
      user: vendorId,
      action: 'refund',
      resourceType: 'order',
      resourceId: orderItem.order._id,
      status: 'success',
      description: `Processed refund of ${refundQuantity} items (${orderItem.productSnapshot?.name})`,
      metadata: { refundAmount, refundQuantity, reason },
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: orderItem
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund', error: error.message });
  }
};

// ============================================
// PAYOUT & COMMISSION MANAGEMENT
// ============================================

/**
 * @desc    Get Payout History
 * @route   GET /api/vendor/payouts
 * @access  Private (Vendor)
 */
export const getPayoutHistory = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate
    } = req.query;

    const query = { vendor: vendorId };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total, summary] = await Promise.all([
      Payout.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Payout.countDocuments(query),
      Payout.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$netAmount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: payouts,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payouts', error: error.message });
  }
};

/**
 * @desc    Get Earnings Summary
 * @route   GET /api/vendor/earnings
 * @access  Private (Vendor)
 */
export const getEarningsSummary = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const [
      currentBalance,
      pendingBalance,
      paidToDate,
      thisMonth,
      lastMonth,
      orderStats
    ] = await Promise.all([
      // Current available balance
      OrderItem.aggregate([
        {
          $match: {
            vendor: vendorId,
            status: { $in: ['delivered', 'shipped'] },
            refundedQuantity: { $lt: '$quantity' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$vendorEarnings' }
          }
        }
      ]),

      // Pending balance
      OrderItem.aggregate([
        {
          $match: {
            vendor: vendorId,
            status: { $in: ['pending', 'processing'] },
            refundedQuantity: { $lt: '$quantity' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$vendorEarnings' }
          }
        }
      ]),

      // Paid to date
      Payout.aggregate([
        {
          $match: {
            vendor: vendorId,
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netAmount' }
          }
        }
      ]),

      // This month earnings
      OrderItem.aggregate([
        {
          $match: {
            vendor: vendorId,
            status: 'delivered',
            createdAt: {
              $gte: new Date(new Date().setDate(1)),
              $lte: new Date()
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$vendorEarnings' },
            orders: { $sum: 1 }
          }
        }
      ]),

      // Last month earnings
      OrderItem.aggregate([
        {
          $match: {
            vendor: vendorId,
            status: 'delivered',
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 1, 1)),
              $lte: new Date(new Date().setDate(0))
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$vendorEarnings' },
            orders: { $sum: 1 }
          }
        }
      ]),

      // Order statistics
      OrderItem.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$vendorEarnings' },
            commission: { $sum: '$commissionAmount' }
          }
        }
      ])
    ]);

    // Get next payout date
    const vendor = await AdminVendor.findById(vendorId);
    let nextPayoutDate = null;
    
    if (vendor.vendorProfile?.banking?.payoutSchedule) {
      nextPayoutDate = calculateNextPayoutDate(vendor.vendorProfile.banking.payoutSchedule);
    }

    res.status(200).json({
      success: true,
      data: {
        currentBalance: currentBalance[0]?.total || 0,
        pendingBalance: pendingBalance[0]?.total || 0,
        paidToDate: paidToDate[0]?.total || 0,
        thisMonth: thisMonth[0] || { total: 0, orders: 0 },
        lastMonth: lastMonth[0] || { total: 0, orders: 0 },
        orderStats: orderStats.reduce((acc, curr) => {
          acc[curr._id] = { count: curr.count, revenue: curr.revenue, commission: curr.commission };
          return acc;
        }, {}),
        nextPayoutDate,
        commission: {
          rate: vendor.vendorProfile?.commission?.rate || 10,
          type: vendor.vendorProfile?.commission?.type || 'percentage'
        }
      }
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings', error: error.message });
  }
};

// ============================================
// VENDOR DASHBOARD
// ============================================

/**
 * @desc    Get Vendor Dashboard Stats
 * @route   GET /api/vendor/dashboard
 * @access  Private (Vendor)
 */
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayStats,
      weeklyStats,
      monthlyStats,
      productStats,
      orderStats,
      recentOrders,
      lowStockProducts,
      topProducts
    ] = await Promise.all([
      // Today's stats
      OrderItem.aggregate([
        {
          $match: {
            vendor: vendorId,
            createdAt: { $gte: today },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: '$vendorEarnings' },
            quantity: { $sum: '$quantity' }
          }
        }
      ]),

      // Weekly stats
      OrderItem.aggregate([
        {
          $match: {
            vendor: vendorId,
            createdAt: { $gte: new Date(today.setDate(today.getDate() - 7)) },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$vendorEarnings' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Monthly stats
      OrderItem.aggregate([
        {
          $match: {
            vendor: vendorId,
            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$vendorEarnings' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Product stats
      Product.aggregate([
        { $match: { vendor: vendorId, isDeleted: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            value: { $sum: { $multiply: ['$price', '$quantity'] } }
          }
        }
      ]),

      // Order stats
      OrderItem.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$vendorEarnings' }
          }
        }
      ]),

      // Recent orders
      OrderItem.find({ vendor: vendorId })
        .sort('-createdAt')
        .limit(10)
        .populate('product', 'name images')
        .populate('order', 'orderNumber createdAt'),

      // Low stock products
      Product.find({
        vendor: vendorId,
        status: 'active',
        isDeleted: false,
        $expr: {
          $and: [
            { $lte: ['$quantity', '$lowStockThreshold'] },
            { $gt: ['$quantity', 0] }
          ]
        }
      })
        .limit(10)
        .select('name sku price quantity lowStockThreshold images'),

      // Top products
      OrderItem.aggregate([
        { $match: { vendor: vendorId, status: 'delivered' } },
        {
          $group: {
            _id: '$product',
            totalSold: { $sum: '$quantity' },
            revenue: { $sum: '$vendorEarnings' }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: todayStats[0] || { orders: 0, revenue: 0, quantity: 0 },
        weekly: weeklyStats,
        monthly: monthlyStats,
        products: productStats,
        orders: orderStats,
        recentOrders,
        lowStock: lowStockProducts,
        topProducts
      }
    });
  } catch (error) {
    console.error('Vendor dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', error: error.message });
  }
};

// ============================================
// VERIFICATION & DOCUMENTS
// ============================================

/**
 * @desc    Upload Verification Documents
 * @route   POST /api/vendor/documents
 * @access  Private (Vendor)
 */
export const uploadDocuments = async (req, res) => {
  try {
    const vendor = await AdminVendor.findById(req.user._id);
    
    if (!req.files || !req.files.documents) {
      return res.status(400).json({ success: false, message: 'No documents uploaded' });
    }

    const documents = [];

    for (const file of req.files.documents) {
      const upload = await uploadToCloudinary(file, `vendors/${vendor._id}/documents`);
      
      documents.push({
        type: req.body.type || 'business_proof',
        url: upload.secure_url,
        uploadedAt: new Date(),
        status: 'pending'
      });
    }

    if (!vendor.vendorProfile.verification) {
      vendor.vendorProfile.verification = {};
    }
    
    if (!vendor.vendorProfile.verification.documents) {
      vendor.vendorProfile.verification.documents = [];
    }

    vendor.vendorProfile.verification.documents.push(...documents);
    vendor.vendorProfile.verification.status = 'pending';
    vendor.status = 'pending_verification';
    
    await vendor.save();

    // Notify admins
    const admins = await AdminVendor.find({ 
      role: { $in: ['super_admin', 'admin'] },
      status: 'active',
      permissions: 'vendors.approve'
    });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'Vendor Documents Uploaded - Pending Verification',
        template: 'admin-document-verification',
        data: {
          adminName: admin.firstName,
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          storeName: vendor.vendorProfile.storeName,
          documentCount: documents.length,
          dashboardLink: `${process.env.FRONTEND_URL}/admin/vendors/${vendor._id}`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: documents
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload documents', error: error.message });
  }
};

/**
 * @desc    Get Verification Status
 * @route   GET /api/vendor/verification-status
 * @access  Private (Vendor)
 */
export const getVerificationStatus = async (req, res) => {
  try {
    const vendor = await AdminVendor.findById(req.user._id)
      .select('vendorProfile.verification status');

    const verification = vendor.vendorProfile?.verification || { status: 'unverified', documents: [] };
    
    // Calculate progress
    const steps = {
      emailVerified: vendor.emailVerified,
      phoneVerified: vendor.phoneVerified || false,
      businessInfoSubmitted: !!vendor.vendorProfile?.businessType,
      addressSubmitted: (vendor.vendorProfile?.addresses?.length || 0) > 0,
      documentsSubmitted: (verification.documents?.length || 0) > 0,
      bankDetailsSubmitted: !!vendor.vendorProfile?.banking?.primaryBank?.accountNumber
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    res.status(200).json({
      success: true,
      data: {
        status: verification.status,
        overallStatus: vendor.status,
        documents: verification.documents,
        steps,
        progress,
        completedSteps,
        totalSteps,
        verifiedAt: verification.verifiedAt,
        rejectionReason: verification.rejectionReason
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verification status', error: error.message });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateVendorToken = (vendor) => {
  return jwt.sign(
    {
      id: vendor._id,
      email: vendor.email,
      role: 'vendor',
      storeName: vendor.vendorProfile?.storeName,
      storeSlug: vendor.vendorProfile?.storeSlug
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateVendorRefreshToken = (vendor) => {
  return jwt.sign(
    { id: vendor._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const calculateProfileCompletion = (vendor) => {
  let score = 0;
  const weights = {
    emailVerified: 10,
    phoneNumber: 5,
    storeName: 10,
    storeDescription: 5,
    storeLogo: 5,
    storeBanner: 5,
    businessType: 5,
    taxInfo: 10,
    address: 10,
    bankDetails: 15,
    documents: 20
  };

  if (vendor.emailVerified) score += weights.emailVerified;
  if (vendor.phoneNumber) score += weights.phoneNumber;
  if (vendor.vendorProfile?.storeName) score += weights.storeName;
  if (vendor.vendorProfile?.storeDescription) score += weights.storeDescription;
  if (vendor.vendorProfile?.branding?.logo?.url) score += weights.storeLogo;
  if (vendor.vendorProfile?.branding?.banner?.url) score += weights.storeBanner;
  if (vendor.vendorProfile?.businessType) score += weights.businessType;
  if (vendor.vendorProfile?.taxInfo?.taxId) score += weights.taxInfo;
  if (vendor.vendorProfile?.addresses?.length > 0) score += weights.address;
  if (vendor.vendorProfile?.banking?.primaryBank?.accountNumber) score += weights.bankDetails;
  if (vendor.vendorProfile?.verification?.documents?.length >= 2) score += weights.documents;

  return score;
};

const calculateFulfillmentRate = (vendor, order) => {
  // Implementation
  return 98.5;
};

const calculateRefundRate = (vendor, order) => {
  // Implementation
  return 1.2;
};

const calculateNextPayoutDate = (schedule) => {
  const today = new Date();
  
  switch (schedule.frequency) {
    case 'daily':
      return new Date(today.setDate(today.getDate() + 1));
    case 'weekly':
      const daysUntilNextWeek = (schedule.dayOfWeek - today.getDay() + 7) % 7;
      return new Date(today.setDate(today.getDate() + (daysUntilNextWeek || 7)));
    case 'biweekly':
      return new Date(today.setDate(today.getDate() + 14));
    case 'monthly':
      let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, schedule.dayOfMonth);
      if (nextMonth < today) {
        nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, schedule.dayOfMonth);
      }
      return nextMonth;
    default:
      return new Date(today.setDate(today.getDate() + 7));
  }
};

const generateTrackingUrl = (carrier, trackingNumber) => {
  const urls = {
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    'canada-post': `https://www.canadapost-postescanada.ca/track-reperage/en#/resultList?searchFor=${trackingNumber}`
  };
  
  return urls[carrier.toLowerCase()] || '#';
};

const verifyTwoFactorCode = async (vendor, code) => {
  // Implement 2FA verification
  return true;
};

export default {
  // Auth
  vendorLogin,
  vendorRegister,
  verifyVendorEmail,
  vendorLogout,
  
  // Profile
  getVendorProfile,
  updateVendorProfile,
  addStoreAddress,
  updateSocialMedia,
  updateBankDetails,
  
  // Products
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  
  // Orders
  getVendorOrders,
  getVendorOrder,
  updateOrderStatus,
  processRefund,
  
  // Payouts
  getPayoutHistory,
  getEarningsSummary,
  
  // Dashboard
  getVendorDashboard,
  
  // Documents
  uploadDocuments,
  getVerificationStatus
};