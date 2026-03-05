import Product from '../models/Product.js';
import AdminVendor from '../models/AdminVendor.js';
import Category from '../models/Category.cjs';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { generateSKU, generateSlug, sanitizeString } from '../utils/helpers.js';
import { uploadToCloudinary, deleteFromCloudinary, getImageMetadata } from '../utils/upload.js';
import { sendEmail } from '../utils/email.js';
import { createModuleLogger } from '../utils/logger.js';
import { AppError, catchAsync } from '../utils/errorHandler.js';
import { cacheGet, cacheSet, clearCache } from '../middleware/cache.js';
import {
    createProductSchema,
    updateProductSchema,
    inventoryUpdateSchema,
    bulkProductSchema,
    productApprovalSchema,
    productRejectionSchema,
    productChangesSchema,
    reviewSchema,
    questionSchema,
    answerSchema,
    wishlistSchema,
    compareSchema,
    searchSchema,
    productAnalyticsSchema,
    createVariantSchema,
    updateVariantSchema,
    promotionSchema
} from '../validations/productSchemas.js';

import natural from 'natural';
import { removeStopwords } from 'stopword';
import Fuse from 'fuse.js';
import { OpenAI } from 'openai';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';
import fs from 'fs';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import redis from '../config/redis.js';

const { TfIdf, WordTokenizer, SentimentAnalyzer, PorterStemmer, Spellcheck } = natural;

// Initialize logger
const logger = createModuleLogger('ProductController');

// ============================================
// AI & NLP ENGINE INITIALIZATION
// ============================================

// NLP Components
const tokenizer = new WordTokenizer();
const tfidf = new TfIdf();
const sentimentAnalyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

// OpenAI Integration (with fallback)
let openai = null;
try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 10000,
            maxRetries: 3
        });
    }
} catch (error) {
    logger.warn('OpenAI initialization failed, falling back to basic search', error);
}

// Fuse.js options for fuzzy search
const fuseOptions = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.3,
    distance: 100,
    keys: [
        { name: 'name', weight: 3 },
        { name: 'sku', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'tags', weight: 1.5 },
        { name: 'brandName', weight: 1 },
        { name: 'categories.name', weight: 1 }
    ]
};

// ============================================
// AI-POWERED SEARCH & RECOMMENDATIONS
// ============================================

/**
 * @desc    Advanced Semantic Product Search
 * @route   GET /api/products/search
 * @access  Public/Private
 */
export const searchProducts = catchAsync(async (req, res) => {
    const startTime = performance.now();
    const {
        q,
        type = 'semantic',
        page = 1,
        limit = 20,
        sortBy = 'relevance',
        sortOrder = 'desc',
        ...filters
    } = req.query;

    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }

    // Generate cache key based on query and filters
    const cacheKey = `search:${type}:${q}:${JSON.stringify({
        page, limit, sortBy, sortOrder, filters,
        userRole: req.user?.role || 'public',
        userId: req.user?._id
    })}`;

    // Check cache (5 minutes for public, 2 minutes for authenticated)
    const cached = await cacheGet(cacheKey);
    if (cached) {
        logger.debug('Search cache hit', { query: q, type });
        return res.json(cached);
    }

    let results;

    // Choose search strategy based on type
    switch (type) {
        case 'semantic':
            results = await semanticSearch(q, filters, { page, limit, sortBy, sortOrder, user: req.user });
            break;
        case 'visual':
            results = await visualSearch(req, filters, { page, limit, sortBy, sortOrder });
            break;
        case 'fuzzy':
            results = await fuzzySearch(q, filters, { page, limit, sortBy, sortOrder, user: req.user });
            break;
        case 'vector':
            results = await vectorSearch(q, filters, { page, limit, sortBy, sortOrder, user: req.user });
            break;
        default:
            results = await hybridSearch(q, filters, { page, limit, sortBy, sortOrder, user: req.user });
    }

    // Enhance results with search metadata
    const searchMetadata = {
        query: q,
        type,
        processedQuery: await processSearchQuery(q),
        suggestions: await generateSearchSuggestions(q, results.data),
        relatedSearches: await getRelatedSearches(q),
        didYouMean: await getDidYouMean(q),
        searchTime: `${(performance.now() - startTime).toFixed(2)}ms`,
        totalResults: results.pagination.total,
        page: results.pagination.page,
        limit: results.pagination.limit
    };

    // Log search analytics
    await logSearchAnalytics({
        query: q,
        userId: req.user?._id,
        resultsCount: results.pagination.total,
        searchTime: performance.now() - startTime,
        filters: JSON.stringify(filters),
        userAgent: req.get('user-agent'),
        ip: req.ip
    });

    const response = {
        success: true,
        data: results.data,
        metadata: searchMetadata,
        facets: results.facets,
        pagination: results.pagination
    };

    // Cache results
    const cacheTTL = req.user ? 120 : 300; // 2 min for auth, 5 min for public
    await cacheSet(cacheKey, response, cacheTTL);

    res.json(response);
});

/**
 * @desc    Get Personalized Recommendations
 * @route   GET /api/products/recommendations
 * @access  Private
 */
export const getRecommendations = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const {
        type = 'personalized',
        limit = 10,
        page = 1,
        context = 'homepage'
    } = req.query;

    const cacheKey = `recommendations:${userId}:${type}:${context}:${page}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    let recommendations = [];

    switch (type) {
        case 'personalized':
            recommendations = await getPersonalizedRecommendations(userId, { limit, context });
            break;
        case 'similar':
            recommendations = await getSimilarProducts(userId, req.query.productId, { limit });
            break;
        case 'trending':
            recommendations = await getTrendingProducts({ limit, context });
            break;
        case 'recently-viewed':
            recommendations = await getRecentlyViewedProducts(userId, { limit });
            break;
        case 'frequently-bought':
            recommendations = await getFrequentlyBoughtTogether(req.query.productId, { limit });
            break;
        default:
            recommendations = await getHybridRecommendations(userId, { limit, context });
    }

    // Enhance with recommendation reasons
    recommendations = await enhanceWithRecommendationReasons(recommendations, userId);

    const response = {
        success: true,
        data: recommendations,
        metadata: {
            type,
            context,
            userId,
            timestamp: new Date()
        },
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: recommendations.length
        }
    };

    await cacheSet(cacheKey, response, 600); // Cache for 10 minutes

    res.json(response);
});

// ============================================
// SEARCH STRATEGY IMPLEMENTATIONS
// ============================================

/**
 * Semantic search using NLP and embeddings
 */
async function semanticSearch(query, filters, options) {
    const { page, limit, sortBy, sortOrder, user } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Process query with NLP
    const processedQuery = await processSearchQuery(query);
    const tokens = tokenizer.tokenize(processedQuery.cleaned.toLowerCase());
    const cleanTokens = removeStopwords(tokens);
    const stemmedTokens = cleanTokens.map(t => PorterStemmer.stem(t));

    // Build base query
    const baseQuery = {
        isDeleted: false,
        isArchived: false,
        ...getVisibilityFilter(user)
    };

    // Apply search filters
    const searchQuery = {
        ...baseQuery,
        $or: [
            { $text: { $search: query } },
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $in: cleanTokens } },
            { 'seo.keywords': { $in: cleanTokens } },
            { sku: { $regex: query, $options: 'i' } }
        ]
    };

    // Apply additional filters
    applyFilters(searchQuery, filters);

    // Get facets for filtering
    const facets = await getSearchFacets(baseQuery, filters);

    // Execute search with text score
    let products = await Product.find(searchQuery)
        .select(getProjectionFields(user))
        .populate(getPopulateOptions(user))
        .lean();

    // Calculate relevance scores
    products = products.map(product => ({
        ...product,
        relevanceScore: calculateRelevanceScore(product, query, cleanTokens, stemmedTokens)
    }));

    // Sort results
    products = sortResults(products, sortBy, sortOrder);

    // Paginate
    const total = products.length;
    const paginatedProducts = products.slice(skip, skip + parseInt(limit));

    return {
        data: paginatedProducts,
        facets,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
}

/**
 * Visual search using image features
 */
async function visualSearch(req, filters, options) {
    if (!req.files || !req.files.image) {
        throw new AppError('Image is required for visual search', 400);
    }

    const { page, limit } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Upload and extract image features
    const uploadResult = await uploadToCloudinary(req.files.image[0], 'search/visual');
    const features = await getImageMetadata(uploadResult);

    // Find visually similar products
    const products = await Product.aggregate([
        {
            $match: {
                isDeleted: false,
                status: 'active',
                'images.url': { $exists: true }
            }
        },
        {
            $addFields: {
                visualScore: {
                    $add: [
                        { $multiply: [await calculateColorSimilarity(features.colors), 0.4] },
                        { $multiply: [await calculateTagSimilarity(features.tags), 0.3] },
                        { $multiply: [await calculateCategorySimilarity(features.categories), 0.3] }
                    ]
                }
            }
        },
        { $match: { visualScore: { $gt: 0.3 } } },
        { $sort: { visualScore: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $project: {
                name: 1,
                slug: 1,
                price: 1,
                images: 1,
                visualScore: 1,
                'reviews.averageRating': 1,
                vendor: 1
            }
        }
    ]);

    const total = await Product.countDocuments({
        isDeleted: false,
        status: 'active',
        'images.url': { $exists: true }
    });

    return {
        data: products,
        facets: {},
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        },
        metadata: {
            uploadedImage: uploadResult.secure_url,
            features
        }
    };
}

/**
 * Fuzzy search using Fuse.js
 */
async function fuzzySearch(query, filters, options) {
    const { page, limit, sortBy, sortOrder, user } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all products (cached for performance)
    const cacheKey = 'products:all:basic';
    let allProducts = await cacheGet(cacheKey);

    if (!allProducts) {
        allProducts = await Product.find({
            isDeleted: false,
            ...getVisibilityFilter(user)
        })
            .select('name description tags sku brand categories price images')
            .populate('brand', 'name')
            .populate('categories', 'name')
            .lean();

        await cacheSet(cacheKey, allProducts, 3600); // Cache for 1 hour
    }

    // Apply filters
    let filteredProducts = applyFiltersToArray(allProducts, filters);

    // Initialize Fuse
    const fuse = new Fuse(filteredProducts, fuseOptions);

    // Perform fuzzy search
    const results = fuse.search(query);

    // Sort results
    let sortedResults = results.map(r => ({
        ...r.item,
        fuzzyScore: r.score,
        matches: r.matches
    }));

    sortedResults = sortResults(sortedResults, sortBy, sortOrder);

    // Paginate
    const total = sortedResults.length;
    const paginatedResults = sortedResults.slice(skip, skip + parseInt(limit));

    // Get facets
    const facets = await getSearchFacetsFromArray(filteredProducts);

    return {
        data: paginatedResults,
        facets,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    };
}

/**
 * Vector search using embeddings
 */
async function vectorSearch(query, filters, options) {
    const { page, limit, user } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!openai) {
        // Fallback to semantic search if OpenAI not available
        return semanticSearch(query, filters, options);
    }

    try {
        // Generate query embedding
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: query.substring(0, 8000)
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Build base query
        const baseQuery = {
            isDeleted: false,
            status: 'active',
            embedding: { $exists: true }
        };

        // Apply filters
        applyFilters(baseQuery, filters);

        // Perform vector search
        const products = await Product.aggregate([
            { $match: baseQuery },
            {
                $vectorSearch: {
                    queryVector: queryEmbedding,
                    path: "embedding",
                    numCandidates: 100,
                    limit: parseInt(limit) * 2,
                    index: "product_embedding_index"
                }
            },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    ...getProjectionFields(user),
                    vectorScore: { $meta: "vectorSearchScore" }
                }
            },
            {
                $lookup: {
                    from: 'adminvendors',
                    localField: 'vendor',
                    foreignField: '_id',
                    as: 'vendor'
                }
            },
            { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories'
                }
            }
        ]);

        const total = await Product.countDocuments(baseQuery);

        return {
            data: products,
            facets: await getSearchFacets(baseQuery, filters),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        };
    } catch (error) {
        logger.error('Vector search failed, falling back to semantic search', error);
        return semanticSearch(query, filters, options);
    }
}

/**
 * Hybrid search combining multiple strategies
 */
async function hybridSearch(query, filters, options) {
    const { limit } = options;

    // Execute multiple search strategies in parallel
    const [semanticResults, fuzzyResults, vectorResults] = await Promise.allSettled([
        semanticSearch(query, filters, { ...options, limit: Math.ceil(limit / 3) }),
        fuzzySearch(query, filters, { ...options, limit: Math.ceil(limit / 3) }),
        vectorSearch(query, filters, { ...options, limit: Math.ceil(limit / 3) })
    ]);

    // Combine and deduplicate results
    const combinedResults = new Map();

    const addResults = (results, source) => {
        if (results.status === 'fulfilled' && results.value.data) {
            results.value.data.forEach(product => {
                if (!combinedResults.has(product._id.toString())) {
                    combinedResults.set(product._id.toString(), {
                        ...product,
                        _hybridScore: product.relevanceScore || product.fuzzyScore || product.vectorScore || 0,
                        _source: source
                    });
                }
            });
        }
    };

    addResults(semanticResults, 'semantic');
    addResults(fuzzyResults, 'fuzzy');
    addResults(vectorResults, 'vector');

    // Sort combined results
    const sortedResults = Array.from(combinedResults.values())
        .sort((a, b) => (b._hybridScore || 0) - (a._hybridScore || 0))
        .slice(0, parseInt(limit));

    // Get facets from first successful strategy
    const facets = semanticResults.status === 'fulfilled'
        ? semanticResults.value.facets
        : fuzzyResults.status === 'fulfilled'
            ? fuzzyResults.value.facets
            : {};

    return {
        data: sortedResults,
        facets,
        pagination: {
            page: parseInt(options.page),
            limit: parseInt(limit),
            total: sortedResults.length,
            pages: Math.ceil(sortedResults.length / parseInt(limit))
        }
    };
}

// ============================================
// PRODUCT CRUD OPERATIONS
// ============================================

/**
 * @desc    Create Product
 * @route   POST /api/products
 * @access  Private (Admin/Vendor)
 */
export const createProduct = catchAsync(async (req, res) => {
    try {
        // ✅ Data is already parsed by middleware!
        const productData = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        // ============================================
        // DEBUG: Log incoming request
        // ============================================
        console.log('🔍 [CREATE PRODUCT DEBUG] ========================');
        console.log('🔍 User ID:', userId);
        console.log('🔍 User Role:', userRole);
        console.log('🔍 Request Body:', JSON.stringify(productData, null, 2));
        console.log('🔍 Request Files:', req.files ? 'Files present' : 'No files');
        if (req.files) {
            console.log('🔍 Files count:', req.files.images?.length || 0);
            console.log('🔍 File details:', req.files.map(f => ({
                fieldname: f.fieldname,
                originalname: f.originalname,
                size: f.size
            })));
        }

        // ============================================
        // 1. AUTO-ASSIGN VENDOR WITH FALLBACK
        // ============================================
        
        console.log('🔍 Step 1: Auto-assigning vendor...');
        console.log('🔍 Initial productData.vendor:', productData.vendor);
        
        // For vendors: always use their own ID
        if (userRole === 'vendor') {
            productData.vendor = userId;
            console.log('✅ Vendor user - auto-assigned vendor ID:', userId);
            logger.info(`Auto-assigned vendor ${userId} for vendor product creation`);
        } 
        // For admins and super_admin
        else {
            console.log('👑 Admin/Super Admin user - checking vendor assignment...');
            
            // SUPER_ADMIN SPECIAL CASE: Always allow, use own ID if no vendor provided
            if (userRole === 'super_admin') {
                if (!productData.vendor) {
                    productData.vendor = userId;
                    console.log('✅ Super admin - auto-assigning own ID as vendor:', userId);
                    logger.info(`Super admin ${userId} auto-assigned as vendor`);
                } else {
                    console.log('✅ Super admin - using provided vendor:', productData.vendor);
                }
            } 
            // Regular admin: need vendor profile
            else {
                // If admin didn't provide a vendor, try to find their vendor profile
                if (!productData.vendor) {
                    console.log('🔍 No vendor provided, checking for admin vendor profile...');
                    
                    // Check if admin has a vendor profile
                    const adminVendor = await AdminVendor.findOne({ 
                        _id: userId,
                        'vendorProfile.storeName': { $exists: true }
                    });
                    
                    console.log('🔍 Admin vendor profile found:', adminVendor ? 'YES' : 'NO');
                    if (adminVendor) {
                        console.log('🔍 Admin vendor details:', {
                            id: adminVendor._id,
                            storeName: adminVendor.vendorProfile?.storeName,
                            email: adminVendor.email
                        });
                    }
                    
                    if (adminVendor && adminVendor.vendorProfile) {
                        productData.vendor = userId;
                        console.log('✅ Auto-assigned admin as vendor (has vendor profile)');
                        logger.info(`Auto-assigned admin ${userId} as vendor (has vendor profile)`);
                    } else {
                        // No vendor profile found - this is an error for regular admins
                        console.error('❌ No vendor profile found for admin');
                        throw new AppError(
                            'Please select a vendor for this product. You are creating as admin without a vendor profile.',
                            400,
                            'VENDOR_REQUIRED'
                        );
                    }
                } else {
                    console.log('✅ Vendor already provided:', productData.vendor);
                }
            }
        }

        console.log('🔍 Final vendor ID:', productData.vendor);

        // ============================================
        // 2. ENHANCED INPUT VALIDATION WITH DETAILED ERRORS
        // ============================================
        
        console.log('🔍 Step 2: Validating product data with Joi schema...');
        
        try {
            await createProductSchema.validateAsync(productData, { abortEarly: false });
            console.log('✅ Joi validation passed');
        } catch (validationError) {
            console.error('❌ Joi validation failed:');
            // Format validation errors for better client understanding
            const formattedErrors = {};
            validationError.details.forEach(detail => {
                const path = detail.path.join('.');
                formattedErrors[path] = detail.message;
                console.error(`   - ${path}: ${detail.message}`);
            });
            
            throw new AppError(
                'Product validation failed',
                400,
                'VALIDATION_ERROR',
                formattedErrors
            );
        }

        // ============================================
        // 3. SANITIZE INPUT WITH ERROR HANDLING
        // ============================================
        
        console.log('🔍 Step 3: Sanitizing input...');
        
        try {
            sanitizeProductData(productData);
            console.log('✅ Sanitization passed');
        } catch (sanitizeError) {
            console.error('❌ Sanitization error:', sanitizeError);
            logger.error('Sanitization error:', sanitizeError);
            throw new AppError(
                'Data sanitization failed',
                400,
                'SANITIZATION_ERROR'
            );
        }

        // ============================================
        // 4. SET STATUS BASED ON ROLE
        // ============================================
        
        console.log('🔍 Step 4: Setting status...');
        console.log('🔍 User role for status:', userRole);
        console.log('🔍 Original status:', productData.status);
        
        if (userRole === 'vendor') {
            productData.status = 'pending';
            productData.approval = {
                status: 'pending',
                requestedBy: userId,
                requestedAt: new Date()
            };
            console.log('✅ Vendor - status set to pending');
            logger.info(`Vendor product set to pending approval`);
        } else {
            // Admin and super_admin can set status, default to 'active'
            productData.status = productData.status || 'active';
            console.log('✅ Admin/Super Admin - status set to:', productData.status);
            
            // If admin sets to active, set published date
            if (productData.status === 'active') {
                productData.publishedAt = new Date();
                console.log('✅ Published date set:', productData.publishedAt);
            }
        }

        // ============================================
        // 5. SET METADATA
        // ============================================
        
        console.log('🔍 Step 5: Setting metadata...');
        
        productData.createdBy = userId;
        productData.updatedBy = userId;
        productData.metadata = {
            ...productData.metadata,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            createdAt: new Date(),
            createdByRole: userRole
        };
        
        console.log('✅ Metadata set:', {
            createdBy: userId,
            updatedBy: userId,
            ipAddress: req.ip,
            createdByRole: userRole
        });

        // ============================================
        // 6. GENERATE SKU WITH ERROR HANDLING
        // ============================================
        
        console.log('🔍 Step 6: Generating SKU...');
        console.log('🔍 Original SKU:', productData.sku);
        
        if (!productData.sku) {
            try {
                // FIX: Use the correct parameter format for generateSKU
                productData.sku = await generateSKU(
                    productData.vendor,
                    productData.name,
                    {
                        prefix: productData.primaryCategory ? productData.primaryCategory.toString().slice(-2) : '',
                        includeTimestamp: true,
                        includeRandom: true
                    }
                );
                console.log('✅ Generated SKU:', productData.sku);
                logger.info(`Generated SKU: ${productData.sku}`);
            } catch (skuError) {
                console.error('❌ SKU generation failed:', skuError);
                logger.error('SKU generation failed:', skuError);
                // Fallback SKU
                productData.sku = `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                console.log('⚠️ Fallback SKU used:', productData.sku);
            }
        } else {
            console.log('✅ Using provided SKU:', productData.sku);
        }

        // ============================================
        // 7. GENERATE UNIQUE SLUG
        // ============================================
        
        console.log('🔍 Step 7: Generating slug...');
        console.log('🔍 Original slug:', productData.slug);
        
        try {
            productData.slug = await generateUniqueSlug(productData.name);
            console.log('✅ Generated slug:', productData.slug);
        } catch (slugError) {
            console.error('❌ Slug generation failed:', slugError);
            logger.error('Slug generation failed:', slugError);
            // Fallback slug
            productData.slug = productData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') + '-' + Date.now();
            console.log('⚠️ Fallback slug used:', productData.slug);
        }

        // ============================================
        // 8. VALIDATE AND PROCESS VARIANTS
        // ============================================
        
        console.log('🔍 Step 8: Processing variants...');
        console.log('🔍 Has variants:', productData.hasVariants);
        
        if (productData.hasVariants) {
            console.log('🔍 Variants count:', productData.variants?.length || 0);
            
            if (!productData.variants || productData.variants.length === 0) {
                console.error('❌ Variable product has no variants');
                throw new AppError(
                    'Variable products must have at least one variant',
                    400,
                    'VARIANTS_REQUIRED'
                );
            }
            
            try {
                productData.variants = await processVariants(productData.variants, productData.sku);
                console.log(`✅ Processed ${productData.variants.length} variants`);
                logger.info(`Processed ${productData.variants.length} variants`);
            } catch (variantError) {
                console.error('❌ Variant processing failed:', variantError);
                logger.error('Variant processing failed:', variantError);
                throw new AppError(
                    `Variant processing failed: ${variantError.message}`,
                    400,
                    'VARIANT_ERROR'
                );
            }
        }

        // ============================================
        // 9. HANDLE IMAGE UPLOADS WITH PROGRESS TRACKING
        // ============================================
        
        console.log('🔍 Step 9: Handling image uploads...');
        
        if (req.files?.images) {
            console.log('🔍 Processing', req.files.images.length, 'images');
            try {
                const uploadedImages = await processImageUploads(req.files.images, {
                    vendorId: productData.vendor,
                    productName: productData.name,
                    userId
                });
                
                productData.images = [...(productData.images || []), ...uploadedImages];
                console.log(`✅ Uploaded ${uploadedImages.length} images`);
                logger.info(`Uploaded ${uploadedImages.length} images`);
            } catch (imageError) {
                console.error('❌ Image upload failed:', imageError);
                logger.error('Image upload failed:', imageError);
                throw new AppError(
                    `Image upload failed: ${imageError.message}`,
                    400,
                    'IMAGE_UPLOAD_ERROR'
                );
            }
        } else {
            console.log('ℹ️ No images to upload');
        }

        // ============================================
        // 10. AI ENHANCEMENTS (OPTIONAL)
        // ============================================
        
        console.log('🔍 Step 10: AI enhancements...');
        
        if (openai) {
            console.log('🔍 OpenAI available, processing AI enhancements');
            try {
                // Run AI processes in parallel for efficiency
                const [embedding, aiTags, aiDescription] = await Promise.allSettled([
                    generateEmbedding(productData).catch(e => {
                        console.log('⚠️ Embedding generation failed:', e.message);
                        return null;
                    }),
                    generateAITags(productData).catch(e => {
                        console.log('⚠️ AI tags generation failed:', e.message);
                        return [];
                    }),
                    generateAIDescription(productData).catch(e => {
                        console.log('⚠️ AI description generation failed:', e.message);
                        return null;
                    })
                ]);
                
                if (embedding.status === 'fulfilled' && embedding.value) {
                    productData.embedding = embedding.value;
                    console.log('✅ Embedding generated');
                }
                
                if (aiTags.status === 'fulfilled' && aiTags.value) {
                    productData.aiTags = aiTags.value;
                    console.log('✅ AI tags generated:', aiTags.value);
                }
                
                if (aiDescription.status === 'fulfilled' && aiDescription.value) {
                    productData.aiDescription = aiDescription.value;
                    console.log('✅ AI description generated');
                }
                
                logger.info('AI processing completed');
            } catch (aiError) {
                // Don't fail the whole request for AI errors
                console.warn('⚠️ AI processing failed (non-critical):', aiError);
                logger.warn('AI processing failed (non-critical):', aiError);
            }
        } else {
            console.log('ℹ️ OpenAI not available, skipping AI enhancements');
        }

        // ============================================
        // 11. CREATE PRODUCT
        // ============================================
        
        console.log('🔍 Step 11: Creating product in database...');
        console.log('🔍 Final product data to save:', JSON.stringify(productData, null, 2));
        
        const product = new Product(productData);
        
        // Validate before save
        console.log('🔍 Running mongoose validation...');
        const validationError = product.validateSync();
        if (validationError) {
            console.error('❌ Mongoose validation failed:');
            const errors = {};
            Object.keys(validationError.errors).forEach(key => {
                errors[key] = validationError.errors[key].message;
                console.error(`   - ${key}: ${validationError.errors[key].message}`);
            });
            
            throw new AppError(
                'Product validation failed',
                400,
                'SCHEMA_VALIDATION_ERROR',
                errors
            );
        }
        
        console.log('✅ Mongoose validation passed');
        
        await product.save();
        console.log('✅ Product saved successfully with ID:', product._id);
        logger.info(`Product created with ID: ${product._id}`);

        // ============================================
        // 12. UPDATE VENDOR STATISTICS
        // ============================================
        
        console.log('🔍 Step 12: Updating vendor statistics...');
        
        try {
            await updateVendorStats(productData.vendor, {
                totalProducts: 1,
                activeProducts: product.status === 'active' ? 1 : 0
            });
            console.log('✅ Vendor stats updated');
        } catch (statsError) {
            console.error('❌ Failed to update vendor stats:', statsError);
            logger.error('Failed to update vendor stats:', statsError);
            // Non-critical, don't fail the request
        }

        // ============================================
        // 13. CREATE AUDIT LOG
        // ============================================
        
        console.log('🔍 Step 13: Creating audit log...');
        
        await createAuditLog({
            user: userId,
            action: 'create',
            resourceType: 'product',
            resourceId: product._id,
            description: `Created product: ${product.name}`,
            metadata: { 
                sku: product.sku, 
                price: product.price,
                role: userRole,
                status: product.status
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        
        console.log('✅ Audit log created');

        // ============================================
        // 14. NOTIFY ADMINS IF NEEDED
        // ============================================
        
        if (userRole === 'vendor' && product.status === 'pending') {
            console.log('🔍 Step 14: Notifying admins for approval...');
            try {
                await notifyAdminsForApproval(product, req.user);
                console.log('✅ Admins notified');
                logger.info('Admins notified for product approval');
            } catch (notifyError) {
                console.error('❌ Failed to notify admins:', notifyError);
                logger.error('Failed to notify admins:', notifyError);
                // Non-critical, don't fail the request
            }
        }

        // ============================================
        // 15. CLEAR CACHES (NON-BLOCKING)
        // ============================================
        
        console.log('🔍 Step 15: Clearing caches...');
        if (typeof clearProductCaches === 'function') {
            clearProductCaches().catch(err => {
                console.error('❌ Cache clear failed:', err.message);
                logger.error('Cache clear failed:', err.message);
            });
        }

        // ============================================
        // 16. SEND WEBHOOK (NON-BLOCKING)
        // ============================================
        
        console.log('🔍 Step 16: Sending webhook...');
        if (typeof sendWebhook === 'function') {
            sendWebhook('product.created', product).catch(err => {
                console.error('❌ Webhook failed:', err.message);
                logger.error('Webhook failed:', err.message);
            });
        }

        // ============================================
        // 17. SUCCESS RESPONSE
        // ============================================
        
        const message = userRole === 'vendor'
            ? 'Product created and sent for approval'
            : 'Product created successfully';

        console.log('✅ All steps completed successfully!');
        console.log('🔍 Sending response...');

        res.status(201).json({
            success: true,
            message,
            data: {
                id: product._id,
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                status: product.status,
                type: product.type,
                createdAt: product.createdAt
            }
        });

    } catch (error) {
        // ============================================
        // ERROR HANDLING WITH DEBUG
        // ============================================
        
        console.error('❌❌❌ ERROR CAUGHT IN CREATEPRODUCT ❌❌❌');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.code) console.error('Error code:', error.code);
        if (error.statusCode) console.error('Status code:', error.statusCode);
        if (error.details) console.error('Error details:', error.details);
        
        logger.error('Product creation failed:', error);

        // Handle different error types
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];
            
            console.error('❌ Duplicate key error:', { field, value });
            
            return res.status(409).json({
                success: false,
                message: `A product with this ${field} already exists`,
                error: 'DUPLICATE_ERROR',
                field,
                value
            });
        }

        if (error.name === 'AppError') {
            console.error('❌ AppError:', {
                statusCode: error.statusCode,
                message: error.message,
                code: error.code,
                details: error.details
            });
            
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                error: error.code,
                errors: error.details
            });
        }

        if (error.name === 'CastError') {
            console.error('❌ CastError:', error);
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format',
                error: 'INVALID_ID'
            });
        }

        if (error.name === 'ValidationError') {
            console.error('❌ ValidationError:', error.errors);
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                error: 'VALIDATION_ERROR',
                errors
            });
        }

        // Default error response
        console.error('❌ Unhandled error:', error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'An unexpected error occurred while creating the product',
            error: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });

    } finally {
        console.log('🔍 Product creation process completed');
    }
});
/**
 * @desc    Get Products with Advanced Filtering
 * @route   GET /api/products
 * @access  Public/Private
 */
export const getProducts = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        fields,
        ...filters
    } = req.query;

    const cacheKey = `products:list:${JSON.stringify({
        page, limit, sortBy, sortOrder, fields, filters,
        userRole: req.user?.role,
        userId: req.user?._id
    })}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Build query
    const query = buildProductQuery(filters, req.user);

    // ============================================
    // HANDLE SPECIAL INVENTORY FILTERS
    // ============================================
    
    // Low stock filter - products with quantity > 0 but <= lowStockThreshold
    if (filters.lowStock === 'true') {
        query.$expr = {
            $and: [
                { $gt: ['$quantity', 0] },
                { $lte: ['$quantity', '$lowStockThreshold'] }
            ]
        };
    }

    // Out of stock filter
    if (filters.outOfStock === 'true') {
        query.quantity = { $lte: 0 };
    }

    // Backorder filter - products that allow backorder and are out of stock
    if (filters.allowBackorder === 'true' && filters.minQuantity === '0') {
        query.allowBackorder = true;
        query.quantity = { $lte: 0 };
    }

    // Build sort
    const sort = buildSortObject(sortBy, sortOrder);

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
        Product.find(query)
            .select(getProjectionFields(req.user, fields))
            .populate(getPopulateOptions(req.user))
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Product.countDocuments(query)
    ]);

    // Get filter facets
    const facets = await getFilterFacets(query, filters);

    // Enhance products with computed fields
    const enhancedProducts = products.map(product => enhanceProduct(product, req.user));

    const response = {
        success: true,
        data: enhancedProducts,
        facets,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        },
        metadata: {
            timestamp: new Date(),
            userRole: req.user?.role || 'public'
        }
    };

    await cacheSet(cacheKey, response, 60); // Cache for 1 minute

    res.json(response);
});

/**
 * @desc    Get Single Product by ID or Slug
 * @route   GET /api/products/:identifier
 * @access  Public/Private
 */
export const getProduct = catchAsync(async (req, res) => {
    const { identifier } = req.params;
    const userId = req.user?._id;

    const cacheKey = `product:${identifier}:${req.user?.role || 'public'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
        // Increment view count asynchronously
        incrementProductViews(identifier, userId);
        return res.json(cached);
    }

    // Determine if identifier is ID or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId
        ? { _id: identifier }
        : { slug: identifier };

    // Add visibility filters
    Object.assign(query, getVisibilityFilter(req.user));

    const product = await Product.findOne(query)
        .populate(getDetailedPopulateOptions(req.user))
        .lean();

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Check visibility password if private
    if (product.visibility === 'password') {
        await checkVisibilityPassword(req, product);
    }

    // Increment view count
    await incrementProductViews(product._id, userId);

    // Get related products
    const [related, similar, frequentlyBought] = await Promise.all([
        getRelatedProducts(product._id, product.categories, 6),
        getSimilarProductsByFeatures(product, 6),
        getFrequentlyBoughtTogether(product._id, 4)
    ]);

    // Get reviews summary
    const reviewsSummary = await getProductReviewsSummary(product._id);

    // Get questions summary
    const questionsSummary = await getProductQuestionsSummary(product._id);

    // Track for recommendations
    if (userId) {
        await trackProductView(userId, product._id);
    }

    const enhancedProduct = {
        ...product,
        related,
        similar,
        frequentlyBought,
        reviewsSummary,
        questionsSummary,
        analytics: req.user?.role === 'admin' || req.user?.role === 'super_admin' ? await getProductAnalytics(product._id) : undefined
    };

    const response = {
        success: true,
        data: enhancedProduct,
        metadata: {
            timestamp: new Date(),
            cached: false
        }
    };

    await cacheSet(cacheKey, response, 300); // Cache for 5 minutes

    res.json(response);
});

/**
 * @desc    Update Product
 * @route   PUT /api/products/:id
 * @access  Private (Admin/Vendor)
 */
export const updateProduct = catchAsync(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Find product
        const product = await Product.findById(id).session(session);

        if (!product || product.isDeleted) {
            throw new AppError('Product not found', 404);
        }

        // Check permissions
        await checkProductPermission(product, req.user);

        // Validate updates
        await updateProductSchema.validateAsync(updates);

        // Sanitize updates
        sanitizeProductData(updates);

        // Track changes for audit
        const changes = trackChanges(product, updates);

        // Handle slug update
        if (updates.name && updates.name !== product.name) {
            updates.slug = await generateUniqueSlug(updates.name, id);
        }

        // Handle image updates
        if (req.files?.newImages) {
            updates.images = await handleImageUpdates(req.files.newImages, updates.removeImages, product, userId);
        }

        // Handle variant updates
        if (updates.variants) {
            updates.variants = await processVariantUpdates(updates.variants, product.variants, product.sku);
        }

        // Handle status changes
        if (updates.status && updates.status !== product.status) {
            await handleStatusChange(product, updates, req.user, session);
        }

        // Update AI embeddings if content changed
        if (openai && (updates.name || updates.description || updates.tags)) {
            try {
                updates.embedding = await generateEmbedding({ ...product.toObject(), ...updates });
                updates.aiTags = await generateAITags({ ...product.toObject(), ...updates });
            } catch (error) {
                logger.warn('AI embedding update failed', error);
            }
        }

        // Set metadata
        updates.updatedBy = userId;
        updates.lastUpdatedAt = new Date();

        // Create version snapshot
        if (changes.length > 0) {
            await product.createVersion(userId, 'Manual update', changes);
        }

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true, session }
        ).populate(getDetailedPopulateOptions(req.user));

        // Create audit log
        if (changes.length > 0) {
            await createAuditLog({
                user: userId,
                action: 'update',
                resourceType: 'product',
                resourceId: product._id,
                description: `Updated product: ${product.name}`,
                changes,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                session
            });
        }


        // Clear caches
        await clearProductCaches(id, product.slug);

        // Send webhook
        await sendWebhook('product.updated', updatedProduct);

        logger.info('Product updated successfully', {
            productId: id,
            changes: changes.length
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

/**
 * @desc    Delete Product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin/Vendor)
 */
export const deleteProduct = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, permanent = false } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        const product = await Product.findById(id);

        if (!product || product.isDeleted) {
            throw new AppError('Product not found', 404);
        }

        // Check permissions
        await checkProductPermission(product, req.user);

        if (permanent && (userRole === 'admin' || userRole === 'super_admin')) {
            // ✅ Pass ipAddress and userAgent
            await permanentDeleteProduct(
                product, 
                userId, 
                reason, 
                req.ip, 
                req.get('user-agent')
            );
        } else {
            // ✅ Pass ipAddress and userAgent
            await softDeleteProduct(
                product, 
                userId, 
                reason, 
                req.ip, 
                req.get('user-agent')
            );
        }

        // Clear caches
        await clearProductCaches(id, product.slug);

        // Send webhook
        await sendWebhook('product.deleted', { id: product._id, sku: product.sku, permanent });

        logger.info('Product deleted successfully', {
            productId: id,
            permanent,
            reason
        });

        res.json({
            success: true,
            message: permanent ? 'Product permanently deleted' : 'Product moved to trash'
        });
    } catch (error) {
        throw error;
    }
});

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @desc    Bulk Import Products
 * @route   POST /api/products/bulk/import
 * @access  Private (Admin/Vendor)
 */
export const bulkImportProducts = catchAsync(async (req, res) => {
    if (!req.files || !req.files.file) {
        throw new AppError('Import file is required', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const file = req.files.file[0];
        const userId = req.user._id;
        const userRole = req.user.role;

        // Parse file
        const products = await parseImportFile(file);

        // Validate products
        const validationResults = await validateBulkProducts(products, userRole, userId);

        if (validationResults.errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationResults.errors
            });
        }

        // Process import
        const importResults = await processBulkImport(validationResults.validProducts, {
            userId,
            userRole,
            session
        });

        await session.commitTransaction();

        // Clear caches
        await clearProductCaches();

        logger.info('Bulk import completed', importResults.stats);

        res.json({
            success: true,
            message: `Import completed: ${importResults.stats.successful} successful, ${importResults.stats.failed} failed`,
            data: importResults
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

/**
 * @desc    Bulk Export Products
 * @route   GET /api/products/bulk/export
 * @access  Private (Admin/Vendor)
 */
export const bulkExportProducts = catchAsync(async (req, res) => {
    const { format = 'csv', fields, ...filters } = req.query;

    // Build query
    const query = buildProductQuery(filters, req.user);

    // Select fields
    const selectFields = fields ? fields.split(',') : getExportFields();

    // Fetch products
    const products = await Product.find(query)
        .select(selectFields.join(' '))
        .populate('vendor', 'vendorProfile.storeName email')
        .populate('categories', 'name')
        .populate('brand', 'name')
        .lean();

    // Format for export
    const exportData = formatExportData(products);

    // Generate export file
    const result = await generateExportFile(exportData, format, filters);

    logger.info('Products exported', {
        format,
        count: products.length,
        user: req.user._id
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
    res.send(result.data);
});

// ============================================
// INVENTORY MANAGEMENT
// ============================================

/**
 * @desc    Update Inventory
 * @route   PUT /api/products/:id/inventory
 * @access  Private (Admin/Vendor)
 */
export const updateInventory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { quantity, variantId, operation = 'set', warehouseId, reason } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(id);

    if (!product || product.isDeleted) {
        throw new AppError('Product not found', 404);
    }

    // Check permissions
    await checkProductPermission(product, req.user);

    let oldQuantity, newQuantity;

    if (variantId) {
        // Update variant inventory
        const result = await updateVariantInventory(product, variantId, {
            quantity,
            operation,
            warehouseId,
            userId,
            reason
        });
        oldQuantity = result.oldQuantity;
        newQuantity = result.newQuantity;
    } else {
        // Update main product inventory
        const result = await updateMainInventory(product, {
            quantity,
            operation,
            warehouseId,
            userId,
            reason
        });
        oldQuantity = result.oldQuantity;
        newQuantity = result.newQuantity;
    }

    // Check low stock and notify
    if (product.isLowStock) {
        await notifyLowStock(product);
    }

    // Create audit log
    await createAuditLog({
        user: userId,
        action: 'update',
        resourceType: 'inventory',
        resourceId: product._id,
        description: `Updated inventory for ${variantId ? 'variant' : 'product'}`,
        changes: [{
            field: variantId ? `variants.${variantId}.quantity` : 'quantity',
            oldValue: oldQuantity,
            newValue: newQuantity,
            reason
        }],
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearProductCaches(id, product.slug);

    res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: {
            quantity: newQuantity,
            availableQuantity: variantId
                ? product.variants.id(variantId).availableQuantity
                : product.availableQuantity,
            isLowStock: product.isLowStock,
            isOutOfStock: product.isOutOfStock,
            lastUpdated: new Date()
        }
    });
});

/**
 * @desc    Get Inventory Summary
 * @route   GET /api/products/inventory/summary
 * @access  Private (Admin/Vendor)
 */
export const getInventorySummary = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    const cacheKey = `inventory:summary:${userId}:${userRole}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const match = { isDeleted: false, isArchived: false };
    if (userRole === 'vendor') match.vendor = userId;

    const summary = await Product.aggregate([
        { $match: match },
        {
            $facet: {
                overall: [
                    {
                        $group: {
                            _id: null,
                            totalProducts: { $sum: 1 },
                            totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                            totalCost: { $sum: { $multiply: ['$cost', '$quantity'] } },
                            averagePrice: { $avg: '$price' },
                            totalQuantity: { $sum: '$quantity' },
                            outOfStock: { $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] } },
                            lowStock: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $gt: ['$quantity', 0] },
                                                { $lte: ['$quantity', '$lowStockThreshold'] }
                                            ]
                                        },
                                        1, 0
                                    ]
                                }
                            },
                            activeProducts: {
                                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                            }
                        }
                    }
                ],
                byVendor: [
                    {
                        $group: {
                            _id: '$vendor',
                            productCount: { $sum: 1 },
                            totalQuantity: { $sum: '$quantity' },
                            totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
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
                            vendorName: '$vendor.vendorProfile.storeName',
                            productCount: 1,
                            totalQuantity: 1,
                            totalValue: 1
                        }
                    }
                ],
                byCategory: [
                    { $unwind: '$categories' },
                    {
                        $group: {
                            _id: '$categories',
                            productCount: { $sum: 1 },
                            totalQuantity: { $sum: '$quantity' },
                            totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
                        }
                    },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'category'
                        }
                    },
                    { $unwind: '$category' },
                    {
                        $project: {
                            categoryName: '$category.name',
                            productCount: 1,
                            totalQuantity: 1,
                            totalValue: 1
                        }
                    },
                    { $sort: { productCount: -1 } }
                ],
                lowStockAlerts: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $gt: ['$quantity', 0] },
                                    { $lte: ['$quantity', '$lowStockThreshold'] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            sku: 1,
                            quantity: 1,
                            lowStockThreshold: 1,
                            vendor: 1
                        }
                    },
                    { $limit: 50 }
                ]
            }
        }
    ]);

    const response = {
        success: true,
        data: {
            ...summary[0].overall[0],
            byVendor: summary[0].byVendor,
            byCategory: summary[0].byCategory,
            lowStockAlerts: summary[0].lowStockAlerts,
            timestamp: new Date()
        }
    };

    await cacheSet(cacheKey, response, 300); // Cache for 5 minutes

    res.json(response);
});

// ============================================
// ANALYTICS & REPORTING
// ============================================

/**
 * @desc    Get Product Analytics
 * @route   GET /api/products/analytics
 * @access  Private (Admin/Vendor)
 */
export const getAnalytics = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const {
        period = '30d',
        groupBy = 'day',
        category,
        vendor,
        compare = false
    } = req.query;

    const cacheKey = `analytics:${userId}:${period}:${groupBy}:${category}:${vendor}:${compare}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Calculate date ranges
    const { startDate, endDate, previousStartDate } = calculateDateRanges(period);

    // Build match stage
    const match = await buildAnalyticsMatch(userId, userRole, startDate, endDate, { category, vendor });

    // Get current period analytics
    const currentAnalytics = await getPeriodAnalytics(match, groupBy);

    // Get comparison period analytics if requested
    let comparisonAnalytics = null;
    if (compare) {
        const comparisonMatch = await buildAnalyticsMatch(userId, userRole, previousStartDate, startDate, { category, vendor });
        comparisonAnalytics = await getPeriodAnalytics(comparisonMatch, groupBy);
    }

    // Calculate trends
    const trends = await calculateTrends(match, currentAnalytics, comparisonAnalytics);

    // Get top performing products
    const topProducts = await getTopPerformingProducts(match, 20);

    // Get category performance
    const categoryPerformance = await getCategoryPerformance(match);

    // Get price distribution
    const priceDistribution = await getPriceDistribution(match);

    // Get inventory status
    const inventoryStatus = await getInventoryAnalytics(match);

    // Get sales forecast
    const forecast = await generateSalesForecast(match);

    const response = {
        success: true,
        data: {
            period: { startDate, endDate },
            comparison: compare ? {
                period: { startDate: previousStartDate, endDate: startDate },
                analytics: comparisonAnalytics
            } : null,
            trends,
            current: currentAnalytics,
            topProducts,
            categoryPerformance,
            priceDistribution,
            inventory: inventoryStatus,
            forecast,
            metadata: {
                generatedAt: new Date(),
                filters: { period, groupBy, category, vendor }
            }
        }
    };

    await cacheSet(cacheKey, response, 1800); // Cache for 30 minutes

    res.json(response);
});

// ============================================
// PRODUCT APPROVAL WORKFLOW
// ============================================

/**
 * @desc    Approve Product
 * @route   POST /api/products/:id/approve
 * @access  Private (Admin)
 */
export const approveProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { notes, publishNow = true } = req.body;
    const adminId = req.user._id;

    const product = await Product.findById(id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (product.status !== 'pending') {
        throw new AppError('Product is not pending approval', 400);
    }

    // Update product
    product.status = publishNow ? 'active' : 'draft';
    product.publishedAt = publishNow ? new Date() : null;
    product.approval = {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        reviewNotes: notes
    };
    product.updatedBy = adminId;

    await product.save();

    // Update vendor stats
    if (publishNow) {
        await AdminVendor.findByIdAndUpdate(product.vendor, {
            $inc: { 'vendorProfile.performance.activeProducts': 1 }
        });
    }

    // Notify vendor
    await notifyVendorOfApproval(product, req.user, publishNow);

    // Create audit log
    await createAuditLog({
        user: adminId,
        action: 'approve',
        resourceType: 'product',
        resourceId: product._id,
        description: `Approved product: ${product.name}`,
        metadata: { publishNow, notes },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
    });

    // Clear caches
    await clearProductCaches(id, product.slug);

    res.json({
        success: true,
        message: `Product approved successfully${publishNow ? ' and published' : ''}`,
        data: product
    });
});

/**
 * @desc    Reject Product
 * @route   POST /api/products/:id/reject
 * @access  Private (Admin)
 */
export const rejectProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user._id;

    if (!reason) {
        throw new AppError('Rejection reason is required', 400);
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Update product
    product.status = 'rejected';
    product.approval = {
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        reviewNotes: notes
    };
    product.updatedBy = adminId;

    await product.save();

    // Notify vendor
    await notifyVendorOfRejection(product, req.user, reason, notes);

    // Create audit log
    await createAuditLog({
        user: adminId,
        action: 'reject',
        resourceType: 'product',
        resourceId: product._id,
        description: `Rejected product: ${product.name}`,
        metadata: { reason, notes },
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Product rejected successfully',
        data: product
    });
});

/**
 * @desc    Request Changes for Product
 * @route   POST /api/products/:id/request-changes
 * @access  Private (Admin)
 */
export const requestProductChanges = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { changes, notes } = req.body;
    const adminId = req.user._id;

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
        throw new AppError('At least one change request is required', 400);
    }

    const product = await Product.findById(id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Add change requests
    const changeRequests = changes.map(change => ({
        field: change.field,
        message: change.message,
        requestedBy: adminId,
        requestedAt: new Date()
    }));

    product.approval.changesRequested = [
        ...(product.approval.changesRequested || []),
        ...changeRequests
    ];
    product.status = 'changes_requested';
    product.approval.status = 'changes_requested';
    product.approval.reviewNotes = notes;
    product.updatedBy = adminId;

    await product.save();

    // Notify vendor
    await notifyVendorOfChanges(product, req.user, changeRequests, notes);

    // Create audit log
    await createAuditLog({
        user: adminId,
        action: 'request_changes',
        resourceType: 'product',
        resourceId: product._id,
        description: `Requested changes for product: ${product.name}`,
        metadata: { changes: changeRequests.length, notes },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Changes requested successfully',
        data: product
    });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Process search query with NLP
 */
async function processSearchQuery(query) {
    // Remove special characters
    const cleaned = query.replace(/[^\w\s]/g, ' ').trim();

    // Tokenize
    const tokens = tokenizer.tokenize(cleaned);

    // Remove stopwords
    const withoutStopwords = removeStopwords(tokens);

    // Stem
    const stemmed = withoutStopwords.map(t => PorterStemmer.stem(t));

    // Get sentiment
    const sentiment = sentimentAnalyzer.getSentiment(tokens);

    return {
        original: query,
        cleaned,
        tokens,
        withoutStopwords,
        stemmed,
        sentiment,
        length: tokens.length
    };
}

/**
 * Calculate relevance score for product
 */
function calculateRelevanceScore(product, query, cleanTokens, stemmedTokens) {
    let score = 0;

    // Exact name match (highest weight)
    if (product.name.toLowerCase().includes(query.toLowerCase())) {
        score += 10;
    }

    // Name contains all tokens
    const nameTokens = tokenizer.tokenize(product.name.toLowerCase());
    const matchingTokens = cleanTokens.filter(t => nameTokens.includes(t));
    score += matchingTokens.length * 2;

    // Tag matches
    if (product.tags) {
        const tagMatches = cleanTokens.filter(t =>
            product.tags.some(tag => tag.toLowerCase().includes(t))
        );
        score += tagMatches.length * 1.5;
    }

    // Description matches
    if (product.description) {
        const descTokens = tokenizer.tokenize(product.description.toLowerCase());
        const descMatches = stemmedTokens.filter(t =>
            descTokens.some(dt => dt.includes(t))
        );
        score += descMatches.length * 0.5;
    }

    // SKU match
    if (product.sku && product.sku.toLowerCase().includes(query.toLowerCase())) {
        score += 5;
    }

    // Boost based on popularity
    if (product.sales?.totalQuantity) {
        score += Math.log10(product.sales.totalQuantity + 1) * 0.1;
    }

    // Boost based on rating
    if (product.reviews?.averageRating) {
        score += product.reviews.averageRating * 0.2;
    }

    return score;
}

/**
 * Get visibility filter based on user role
 */
function getVisibilityFilter(user) {
    if (!user) {
        // Public users: only active public products
        return {
            status: 'active',
            visibility: 'public'
        };
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
        // Admins: see everything except deleted
        return {};
    }

    if (user.role === 'vendor') {
        // Vendors: see their own products + active public products
        return {
            $or: [
                { vendor: user._id },
                { status: 'active', visibility: 'public' }
            ]
        };
    }

    // Regular authenticated users: active public products
    return {
        status: 'active',
        visibility: 'public'
    };
}

/**
 * Get projection fields based on user role
 */
function getProjectionFields(user, customFields = null) {
    if (customFields) {
        return customFields;
    }

    const baseFields = [
        'name', 'slug', 'sku', 'description', 'shortDescription',
        'price', 'compareAtPrice', 'currency', 'images',
        'reviews.averageRating', 'reviews.totalReviews',
        'quantity', 'hasVariants', 'tags', 'categories', 'brand', 'vendor',
        'freeShipping', 'isDigital', 'isBundle',
        'featured', 'createdAt'
    ];

    if (!user || user.role === 'customer') {
        return baseFields.join(' ');
    }

    if (user.role === 'vendor') {
        return [
            ...baseFields,
            'cost', 'status', 'visibility', 'approval',
            'sales', 'engagement', 'lastUpdatedAt'
        ].join(' ');
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
        return [
            ...baseFields,
            'cost', 'status', 'visibility', 'approval',
            'sales', 'engagement', 'metadata', 'notes',
            'createdBy', 'updatedBy', 'version',
            'isDeleted', 'deletedAt', 'deletedBy'
        ].join(' ');
    }

    return baseFields.join(' ');
}

/**
 * Get populate options based on user role
 */
function getPopulateOptions(user) {
    const basePopulate = [
        { path: 'vendor', select: 'vendorProfile.storeName vendorProfile.storeSlug vendorProfile.branding.logo' },
        { path: 'categories', select: 'name slug' },
        { path: 'brand', select: 'name slug logo' }
    ];

    if (user?.role === 'admin' || user?.role === 'super_admin') {
        basePopulate.push(
            { path: 'createdBy', select: 'firstName lastName email' },
            { path: 'updatedBy', select: 'firstName lastName email' }
        );
    }

    return basePopulate;
}

/**
 * Get detailed populate options
 */
function getDetailedPopulateOptions(user) {
    const basePopulate = [
        { path: 'vendor', select: 'vendorProfile.storeName vendorProfile.storeSlug vendorProfile.storeDescription vendorProfile.branding vendorProfile.performance.customerRating' },
        { path: 'categories', select: 'name slug description' },
        { path: 'collections', select: 'name slug' },
        { path: 'brand', select: 'name slug description logo website' },
        { path: 'relatedProducts.product', select: 'name slug price images reviews.averageRating' },
        { path: 'bundleItems.product', select: 'name slug price images' }
    ];

    if (user?.role === 'admin' || user?.role === 'super_admin') {
        basePopulate.push(
            { path: 'createdBy', select: 'firstName lastName email' },
            { path: 'updatedBy', select: 'firstName lastName email' },
            { path: 'approvedBy', select: 'firstName lastName email' }
        );
    }

    return basePopulate;
}

/**
 * Apply filters to query
 */
function applyFilters(query, filters) {
    const {
        minPrice, maxPrice,
        categories, vendors,
        inStock, onSale,
        rating, tags,
        brand, collection,
        hasVariants, isDigital,
        isBundle, freeShipping
    } = filters;

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (categories) {
        const categoryIds = categories.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
        if (categoryIds.length) query.categories = { $in: categoryIds };
    }

    if (vendors) {
        const vendorIds = vendors.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
        if (vendorIds.length) query.vendor = { $in: vendorIds };
    }

    if (brand) {
        if (mongoose.Types.ObjectId.isValid(brand)) {
            query.brand = brand;
        }
    }

    if (collection) {
        if (mongoose.Types.ObjectId.isValid(collection)) {
            query.collections = collection;
        }
    }

    if (inStock === 'true') {
        query.quantity = { $gt: 0 };
    } else if (inStock === 'false') {
        query.quantity = { $lte: 0 };
    }

    if (onSale === 'true') {
        query.$expr = {
            $gt: ['$compareAtPrice', '$price']
        };
    }

    if (rating) {
        query['reviews.averageRating'] = { $gte: parseFloat(rating) };
    }

    if (tags) {
        const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
        query.tags = { $in: tagArray };
    }

    if (hasVariants !== undefined) {
        query.hasVariants = hasVariants === 'true';
    }

    if (isDigital !== undefined) {
        query.isDigital = isDigital === 'true';
    }

    if (isBundle !== undefined) {
        query.isBundle = isBundle === 'true';
    }

    if (freeShipping !== undefined) {
        query.freeShipping = freeShipping === 'true';
    }
}

/**
 * Apply filters to array (for fuzzy search)
 */
function applyFiltersToArray(products, filters) {
    const {
        minPrice, maxPrice,
        categories, vendors,
        inStock, rating,
        tags, brand
    } = filters;

    return products.filter(product => {
        // Price filter
        if (minPrice && product.price < parseFloat(minPrice)) return false;
        if (maxPrice && product.price > parseFloat(maxPrice)) return false;

        // Category filter
        if (categories) {
            const categoryIds = categories.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
            if (categoryIds.length && !product.categories?.some(cat => categoryIds.includes(cat._id?.toString() || cat))) {
                return false;
            }
        }

        // Vendor filter
        if (vendors) {
            const vendorIds = vendors.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
            if (vendorIds.length && !vendorIds.includes(product.vendor?._id?.toString() || product.vendor)) {
                return false;
            }
        }

        // Brand filter
        if (brand && product.brand?._id?.toString() !== brand && product.brand !== brand) {
            return false;
        }

        // Stock filter
        if (inStock === 'true' && product.quantity <= 0) return false;
        if (inStock === 'false' && product.quantity > 0) return false;

        // Rating filter
        if (rating && (product.reviews?.averageRating || 0) < parseFloat(rating)) return false;

        // Tags filter
        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
            if (!product.tags?.some(t => tagArray.includes(t))) return false;
        }

        return true;
    });
}

/**
 * Sort results
 */
function sortResults(products, sortBy, sortOrder) {
    const order = sortOrder === 'desc' ? -1 : 1;

    return products.sort((a, b) => {
        switch (sortBy) {
            case 'relevance':
                return (b.relevanceScore || b.fuzzyScore || b.vectorScore || 0) -
                    (a.relevanceScore || a.fuzzyScore || a.vectorScore || 0);

            case 'price':
                return (a.price - b.price) * order;

            case 'rating':
                return ((b.reviews?.averageRating || 0) - (a.reviews?.averageRating || 0)) * Math.abs(order);

            case 'newest':
                return (new Date(b.createdAt) - new Date(a.createdAt)) * order;

            case 'bestselling':
                return ((b.sales?.totalQuantity || 0) - (a.sales?.totalQuantity || 0)) * order;

            case 'name':
                return a.name.localeCompare(b.name) * order;

            default:
                return (new Date(b.createdAt) - new Date(a.createdAt)) * order;
        }
    });
}

/**
 * Get search facets
 */
async function getSearchFacets(baseQuery, filters) {
    const facets = {};

    // Category facets
    facets.categories = await Product.aggregate([
        { $match: baseQuery },
        { $unwind: '$categories' },
        {
            $group: {
                _id: '$categories',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $project: {
                _id: 1,
                name: '$category.name',
                slug: '$category.slug',
                count: 1
            }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    // Brand facets
    facets.brands = await Product.aggregate([
        { $match: { ...baseQuery, brand: { $exists: true } } },
        {
            $group: {
                _id: '$brand',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'brands',
                localField: '_id',
                foreignField: '_id',
                as: 'brand'
            }
        },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                name: '$brand.name',
                count: 1
            }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    // Price ranges
    facets.priceRanges = [
        { label: 'Under $25', min: 0, max: 25, count: 0 },
        { label: '$25 - $50', min: 25, max: 50, count: 0 },
        { label: '$50 - $100', min: 50, max: 100, count: 0 },
        { label: '$100 - $200', min: 100, max: 200, count: 0 },
        { label: '$200 - $500', min: 200, max: 500, count: 0 },
        { label: 'Over $500', min: 500, max: null, count: 0 }
    ];

    // Count products in each price range
    for (const range of facets.priceRanges) {
        const priceQuery = { ...baseQuery };
        if (range.min) priceQuery.price = { $gte: range.min };
        if (range.max) priceQuery.price = { ...priceQuery.price, $lte: range.max };
        range.count = await Product.countDocuments(priceQuery);
    }

    // Rating facets
    facets.ratings = [
        { value: 4, label: '4★ & above', count: 0 },
        { value: 3, label: '3★ & above', count: 0 },
        { value: 2, label: '2★ & above', count: 0 }
    ];

    for (const rating of facets.ratings) {
        rating.count = await Product.countDocuments({
            ...baseQuery,
            'reviews.averageRating': { $gte: rating.value }
        });
    }

    // Stock status
    facets.stock = {
        inStock: await Product.countDocuments({ ...baseQuery, quantity: { $gt: 0 } }),
        outOfStock: await Product.countDocuments({ ...baseQuery, quantity: { $lte: 0 } }),
        preOrder: await Product.countDocuments({ ...baseQuery, allowBackorder: true })
    };

    // Product types
    facets.types = {
        simple: await Product.countDocuments({ ...baseQuery, hasVariants: false }),
        variable: await Product.countDocuments({ ...baseQuery, hasVariants: true }),
        digital: await Product.countDocuments({ ...baseQuery, isDigital: true }),
        bundle: await Product.countDocuments({ ...baseQuery, isBundle: true })
    };

    return facets;
}

/**
 * Get search facets from array
 */
async function getSearchFacetsFromArray(products) {
    const facets = {
        categories: {},
        brands: {},
        priceRanges: {},
        ratings: {}
    };

    products.forEach(product => {
        // Categories
        if (product.categories) {
            product.categories.forEach(cat => {
                const catId = cat._id?.toString() || cat;
                facets.categories[catId] = (facets.categories[catId] || 0) + 1;
            });
        }

        // Brands
        if (product.brand) {
            const brandId = product.brand._id?.toString() || product.brand;
            facets.brands[brandId] = (facets.brands[brandId] || 0) + 1;
        }

        // Price ranges
        const price = product.price;
        if (price < 25) facets.priceRanges['under_25'] = (facets.priceRanges['under_25'] || 0) + 1;
        else if (price < 50) facets.priceRanges['25_50'] = (facets.priceRanges['25_50'] || 0) + 1;
        else if (price < 100) facets.priceRanges['50_100'] = (facets.priceRanges['50_100'] || 0) + 1;
        else if (price < 200) facets.priceRanges['100_200'] = (facets.priceRanges['100_200'] || 0) + 1;
        else if (price < 500) facets.priceRanges['200_500'] = (facets.priceRanges['200_500'] || 0) + 1;
        else facets.priceRanges['over_500'] = (facets.priceRanges['over_500'] || 0) + 1;

        // Ratings
        const rating = product.reviews?.averageRating || 0;
        if (rating >= 4) facets.ratings['4_plus'] = (facets.ratings['4_plus'] || 0) + 1;
        else if (rating >= 3) facets.ratings['3_plus'] = (facets.ratings['3_plus'] || 0) + 1;
        else if (rating >= 2) facets.ratings['2_plus'] = (facets.ratings['2_plus'] || 0) + 1;
    });

    return facets;
}

/**
 * Generate search suggestions
 */
async function generateSearchSuggestions(query, results) {
    const suggestions = [];

    // Add query refinements based on results
    if (results.length > 0) {
        // Extract common tags and categories
        const tagFrequency = {};
        const categoryFrequency = {};

        results.forEach(product => {
            product.tags?.forEach(tag => {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
            product.categories?.forEach(cat => {
                const catName = cat.name || cat;
                categoryFrequency[catName] = (categoryFrequency[catName] || 0) + 1;
            });
        });

        // Get top tags
        const topTags = Object.entries(tagFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => `${query} ${tag}`);

        // Get top categories
        const topCategories = Object.entries(categoryFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat]) => `${cat} ${query}`);

        suggestions.push(...topTags, ...topCategories);
    }

    // Add popular related searches
    const popularSearches = await getPopularSearches();
    const related = popularSearches
        .filter(s => s.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(s.toLowerCase()))
        .slice(0, 5);

    suggestions.push(...related);

    return [...new Set(suggestions)].slice(0, 10);
}

/**
 * Get "Did you mean" suggestions
 */
async function getDidYouMean(query) {
    try {
        // Get all product names for spell correction
        const productNames = await Product.find(
            { status: 'active', isDeleted: false },
            'name'
        ).lean();

        const dictionary = productNames.map(p => p.name.toLowerCase());

        // Use natural's spellcheck
        const spellcheck = new Spellcheck(dictionary);
        const corrections = spellcheck.getCorrections(query.toLowerCase(), 1);

        return corrections.length > 0 ? corrections[0] : null;
    } catch (error) {
        logger.error('Error in getDidYouMean', error);
        return null;
    }
}

/**
 * Get related searches
 */
async function getRelatedSearches(query) {
    try {
        const related = await redis.zrevrange(`search:related:${query}`, 0, 9);
        return related || [];
    } catch (error) {
        logger.error('Error in getRelatedSearches', error);
        return [];
    }
}

/**
 * Log search analytics
 */
async function logSearchAnalytics(data) {
    try {
        // Store in database or cache
        const analyticsKey = `search:analytics:${new Date().toISOString().split('T')[0]}`;
        await redis.lpush(analyticsKey, JSON.stringify(data));
        await redis.ltrim(analyticsKey, 0, 999); // Keep last 1000 searches

        // Update related searches
        if (data.query) {
            const tokens = data.query.toLowerCase().split(' ');
            for (const token of tokens) {
                if (token.length > 2) {
                    await redis.zincrby(`search:related:${token}`, 1, data.query);
                }
            }
        }
    } catch (error) {
        logger.error('Failed to log search analytics', error);
    }
}

/**
 * Get popular searches
 */
async function getPopularSearches() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const analyticsKey = `search:analytics:${today}`;
        const searches = await redis.lrange(analyticsKey, 0, 99);

        const frequency = {};
        searches.forEach(s => {
            try {
                const data = JSON.parse(s);
                frequency[data.query] = (frequency[data.query] || 0) + 1;
            } catch (e) { }
        });

        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([query]) => query);
    } catch (error) {
        logger.error('Failed to get popular searches', error);
        return [];
    }
}

/**
 * Generate unique slug
 */
async function generateUniqueSlug(name, excludeId = null) {
    let slug = generateSlug(name);
    let counter = 1;
    let uniqueSlug = slug;

    while (true) {
        const query = { slug: uniqueSlug };
        if (excludeId) query._id = { $ne: excludeId };

        const existing = await Product.findOne(query);
        if (!existing) break;

        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    return uniqueSlug;
}

/**
 * Process variants
 */
async function processVariants(variants, baseSku) {
    return variants.map((variant, index) => ({
        ...variant,
        _id: variant._id || new mongoose.Types.ObjectId(),
        sku: variant.sku || `${baseSku}-${index + 1}`,
        createdAt: variant.createdAt || new Date(),
        updatedAt: new Date()
    }));
}

/**
 * Process image uploads
 */
async function processImageUploads(files, options) {
    const { vendorId, productName, userId } = options;
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const upload = await uploadToCloudinary(file, `products/${vendorId}`);

        uploadedImages.push({
            _id: new mongoose.Types.ObjectId(),
            url: upload.secure_url,
            thumbnailUrl: upload.eager?.[0]?.secure_url || upload.secure_url,
            mediumUrl: upload.eager?.[1]?.secure_url || upload.secure_url,
            largeUrl: upload.eager?.[2]?.secure_url || upload.secure_url,
            alt: productName,
            isPrimary: i === 0,
            sortOrder: i,
            width: upload.width,
            height: upload.height,
            size: upload.bytes,
            format: upload.format,
            cloudinaryId: upload.public_id,
            uploadedBy: userId,
            uploadedAt: new Date()
        });
    }

    return uploadedImages;
}

/**
 * Generate embeddings for product
 */
async function generateEmbedding(product) {
    if (!openai) return null;

    const text = `${product.name} ${product.description} ${product.tags?.join(' ')} ${product.shortDescription || ''}`;
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text.substring(0, 8000)
    });

    return response.data[0].embedding;
}

/**
 * Generate AI tags for product
 */
async function generateAITags(product) {
    if (!openai) return [];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Generate relevant tags for this product. Return as JSON array of strings."
                },
                {
                    role: "user",
                    content: `Product: ${product.name}\nDescription: ${product.description}`
                }
            ],
            temperature: 0.3,
            max_tokens: 100
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        logger.warn('AI tag generation failed', error);
        return [];
    }
}

/**
 * Generate AI description
 */
async function generateAIDescription(product) {
    if (!openai) return null;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Generate an engaging product description based on the product details. Keep it concise and persuasive."
                },
                {
                    role: "user",
                    content: `Product: ${product.name}\nFeatures: ${product.highlights?.join(', ')}\nCategory: ${product.primaryCategory}`
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        return response.choices[0].message.content;
    } catch (error) {
        logger.warn('AI description generation failed', error);
        return null;
    }
}

/**
 * Update vendor statistics
 */
async function updateVendorStats(vendorId, stats, session = null) {
    const update = {};
    if (stats.totalProducts) update['vendorProfile.performance.totalProducts'] = stats.totalProducts;
    if (stats.activeProducts) update['vendorProfile.performance.activeProducts'] = stats.activeProducts;

    const options = session ? { session } : {};
    await AdminVendor.findByIdAndUpdate(vendorId, { $inc: update }, options);
}

/**
 * Create audit log
 */
async function createAuditLog(data) {
    const { session, ...logData } = data;
    const options = session ? { session } : {};

    await ActivityLog.create([logData], options);
}

/**
 * Check product permission
 */
async function checkProductPermission(product, user) {
    if (user.role === 'admin' || user.role === 'super_admin') {
        return true;
    }

    if (user.role === 'vendor' && product.vendor.toString() === user._id.toString()) {
        return true;
    }

    throw new AppError('You do not have permission to perform this action', 403);
}

/**
 * Track changes between old and new data
 */
function trackChanges(oldProduct, updates) {
    const changes = [];

    for (const [field, newValue] of Object.entries(updates)) {
        if (field === 'variants' || field === 'images' || field.startsWith('$')) continue;

        const oldValue = oldProduct[field];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({ field, oldValue, newValue });
        }
    }

    return changes;
}

/**
 * Handle image updates
 */
async function handleImageUpdates(newImages, removeImages, product, userId) {
    const images = [...product.images];

    // Remove images
    if (removeImages) {
        const removeIds = Array.isArray(removeImages) ? removeImages : [removeImages];
        for (const imageId of removeIds) {
            const image = product.images.id(imageId);
            if (image?.cloudinaryId) {
                await deleteFromCloudinary(image.cloudinaryId);
            }
        }
        const remainingImages = product.images.filter(img => !removeIds.includes(img._id.toString()));
        images.splice(0, images.length, ...remainingImages);
    }

    // Add new images
    if (newImages) {
        const uploadedImages = await processImageUploads(newImages, {
            vendorId: product.vendor,
            productName: product.name,
            userId
        });
        images.push(...uploadedImages);
    }

    return images;
}

/**
 * Process variant updates
 */
async function processVariantUpdates(newVariants, oldVariants, baseSku) {
    const processedVariants = [];

    for (let i = 0; i < newVariants.length; i++) {
        const variant = newVariants[i];
        if (variant._id && oldVariants.id(variant._id)) {
            // Update existing variant
            processedVariants.push({
                ...variant,
                updatedAt: new Date()
            });
        } else {
            // Add new variant
            processedVariants.push({
                ...variant,
                _id: new mongoose.Types.ObjectId(),
                sku: variant.sku || `${baseSku}-${oldVariants.length + i + 1}`,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    }

    return processedVariants;
}

/**
 * Handle status change
 */
async function handleStatusChange(product, updates, user, session) {
    if (user.role === 'vendor' && updates.status === 'active') {
        // Vendor cannot directly activate
        updates.status = 'pending';
        updates.approval = {
            status: 'pending',
            requestedBy: user._id,
            requestedAt: new Date()
        };
        await notifyAdminsForApproval(product, user);
    } else if (updates.status === 'active' && !product.publishedAt) {
        updates.publishedAt = new Date();
    }
}

/**
 * Update main inventory
 */
async function updateMainInventory(product, { quantity, operation, warehouseId, userId, reason }) {
    const oldQuantity = product.quantity;
    let newQuantity;

    switch (operation) {
        case 'set':
            newQuantity = quantity;
            break;
        case 'increase':
            newQuantity = product.quantity + quantity;
            break;
        case 'decrease':
            newQuantity = product.quantity - quantity;
            break;
        default:
            throw new AppError('Invalid operation', 400);
    }

    if (newQuantity < 0) {
        throw new AppError('Quantity cannot be negative', 400);
    }

    product.quantity = newQuantity;
    product.lastStockUpdate = new Date();
    
    // Initialize stockHistory if it doesn't exist
    if (!product.stockHistory) {
        product.stockHistory = [];
    }
    
    product.stockHistory.push({
        date: new Date(),
        oldQuantity,
        newQuantity,
        operation,
        reason,
        updatedBy: userId,
        warehouseId
    });

    await product.save();

    return { oldQuantity, newQuantity };
}

/**
 * Update variant inventory
 */
async function updateVariantInventory(product, variantId, { quantity, operation, warehouseId, userId, reason }) {
    const variant = product.variants.id(variantId);
    if (!variant) {
        throw new AppError('Variant not found', 404);
    }

    const oldQuantity = variant.quantity;
    let newQuantity;

    switch (operation) {
        case 'set':
            newQuantity = quantity;
            break;
        case 'increase':
            newQuantity = variant.quantity + quantity;
            break;
        case 'decrease':
            newQuantity = variant.quantity - quantity;
            break;
        default:
            throw new AppError('Invalid operation', 400);
    }

    if (newQuantity < 0) {
        throw new AppError('Quantity cannot be negative', 400);
    }

    variant.quantity = newQuantity;
    variant.updatedAt = new Date();

    if (!variant.stockHistory) variant.stockHistory = [];
    variant.stockHistory.push({
        date: new Date(),
        oldQuantity,
        newQuantity,
        operation,
        reason,
        updatedBy: userId,
        warehouseId
    });

    await product.save();

    return { oldQuantity, newQuantity };
}

/**
 * Notify admins for approval
 */
async function notifyAdminsForApproval(product, vendor) {
    const admins = await AdminVendor.find({
        role: { $in: ['super_admin', 'admin'] },
        status: 'active',
        'notificationPreferences.email.vendors': true
    });

    for (const admin of admins) {
        await sendEmail({
            to: admin.email,
            subject: 'New Product Pending Approval',
            template: 'admin-product-approval',
            data: {
                adminName: admin.firstName,
                vendorName: `${vendor.firstName} ${vendor.lastName}`,
                storeName: vendor.vendorProfile?.storeName,
                productName: product.name,
                productSku: product.sku,
                productPrice: product.price,
                approvalLink: `${process.env.ADMIN_URL}/products/pending/${product._id}`
            }
        });
    }
}

/**
 * Notify vendor of low stock
 */
async function notifyLowStock(product) {
    const vendor = await AdminVendor.findById(product.vendor);

    if (vendor?.notificationPreferences?.email?.inventory) {
        await sendEmail({
            to: vendor.email,
            subject: 'Low Stock Alert',
            template: 'vendor-low-stock',
            data: {
                vendorName: vendor.firstName,
                storeName: vendor.vendorProfile?.storeName,
                productName: product.name,
                productSku: product.sku,
                currentStock: product.quantity,
                threshold: product.lowStockThreshold,
                productLink: `${process.env.VENDOR_URL}/products/${product._id}`
            }
        });
    }
}

/**
 * Notify vendor of approval
 */
async function notifyVendorOfApproval(product, admin, published) {
    const vendor = await AdminVendor.findById(product.vendor);

    await sendEmail({
        to: vendor.email,
        subject: published ? 'Your Product Has Been Published!' : 'Your Product Has Been Approved',
        template: published ? 'product-approved-published' : 'product-approved',
        data: {
            vendorName: vendor.firstName,
            storeName: vendor.vendorProfile?.storeName,
            productName: product.name,
            productUrl: `${process.env.CLIENT_URL}/product/${product.slug}`,
            vendorDashboardUrl: `${process.env.VENDOR_URL}/products/${product._id}`,
            adminName: admin.firstName
        }
    });
}

/**
 * Notify vendor of rejection
 */
async function notifyVendorOfRejection(product, admin, reason, notes) {
    const vendor = await AdminVendor.findById(product.vendor);

    await sendEmail({
        to: vendor.email,
        subject: 'Product Approval Update',
        template: 'product-rejected',
        data: {
            vendorName: vendor.firstName,
            storeName: vendor.vendorProfile?.storeName,
            productName: product.name,
            rejectionReason: reason,
            adminNotes: notes,
            vendorDashboardUrl: `${process.env.VENDOR_URL}/products/${product._id}`,
            adminName: admin.firstName
        }
    });
}

/**
 * Notify vendor of requested changes
 */
async function notifyVendorOfChanges(product, admin, changes, notes) {
    const vendor = await AdminVendor.findById(product.vendor);

    await sendEmail({
        to: vendor.email,
        subject: 'Changes Requested for Your Product',
        template: 'product-changes-requested',
        data: {
            vendorName: vendor.firstName,
            storeName: vendor.vendorProfile?.storeName,
            productName: product.name,
            changes: changes.map(c => `${c.field}: ${c.message}`).join('\n'),
            adminNotes: notes,
            vendorDashboardUrl: `${process.env.VENDOR_URL}/products/${product._id}`,
            adminName: admin.firstName
        }
    });
}

/**
 * Clear product caches
 */
async function clearProductCaches(productId = null, slug = null) {
    try {
        const patterns = [];

        if (productId) patterns.push(`product:${productId}*`);
        if (slug) patterns.push(`product:${slug}*`);

        patterns.push(
            'products:list*',
            'products:search*',
            'search:*',
            'recommendations:*',
            'inventory:*',
            'analytics:*'
        );

        for (const pattern of patterns) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(keys);
            }
        }
    } catch (error) {
        logger.error('Cache clear error:', error);
    }
}

/**
 * Parse import file
 */
async function parseImportFile(file) {
    const { path, originalname } = file;

    if (originalname.endsWith('.csv')) {
        return parseCSV(path);
    } else if (originalname.endsWith('.xlsx') || originalname.endsWith('.xls')) {
        return parseExcel(path);
    } else if (originalname.endsWith('.json')) {
        return parseJSON(path);
    } else {
        throw new AppError('Unsupported file format. Please upload CSV, Excel, or JSON file.', 400);
    }
}

/**
 * Parse CSV file
 */
async function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

/**
 * Parse Excel file
 */
async function parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * Parse JSON file
 */
async function parseJSON(filePath) {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

/**
 * Validate bulk products
 */
async function validateBulkProducts(products, userRole, userId) {
    const validProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const rowNum = i + 2; // +2 for header row and 1-index

        try {
            // Required fields
            if (!product.name) {
                throw new Error('Product name is required');
            }
            if (!product.price) {
                throw new Error('Price is required');
            }

            // Set vendor
            if (userRole === 'vendor') {
                product.vendor = userId;
            }

            // Validate price
            product.price = parseFloat(product.price);
            if (isNaN(product.price) || product.price < 0) {
                throw new Error('Invalid price');
            }

            // Validate quantity
            if (product.quantity) {
                product.quantity = parseInt(product.quantity);
                if (isNaN(product.quantity) || product.quantity < 0) {
                    throw new Error('Invalid quantity');
                }
            }

            validProducts.push(product);
        } catch (error) {
            errors.push({
                row: rowNum,
                error: error.message,
                data: product
            });
        }
    }

    return { validProducts, errors };
}

/**
 * Process bulk import
 */
async function processBulkImport(products, options) {
    const { userId, userRole, session } = options;
    const stats = { successful: 0, failed: 0 };
    const importedProducts = [];
    const errors = [];

    for (const productData of products) {
        try {
            // Set metadata
            productData.createdBy = userId;
            productData.updatedBy = userId;

            // Set status based on role
            if (userRole === 'vendor') {
                productData.status = 'pending';
                productData.approval = {
                    status: 'pending',
                    requestedBy: userId,
                    requestedAt: new Date()
                };
            } else {
                productData.status = productData.status || 'active';
                if (productData.status === 'active') {
                    productData.publishedAt = new Date();
                }
            }

            // Generate SKU if not provided
                    productData.sku = await generateSKU(
                        productData.vendor,
                        productData.name,
                        {
                            prefix: '',
                            suffix: '',
                            separator: '-',
                            includeTimestamp: true,
                            includeRandom: true
                        }
                    );

            // Generate slug
            productData.slug = await generateUniqueSlug(productData.name);

            // Create product
            const product = new Product(productData);
            await product.save();

            stats.successful++;
            importedProducts.push(product);
        } catch (error) {
            stats.failed++;
            errors.push({
                error: error.message,
                data: productData
            });
        }
    }

    return { stats, importedProducts, errors };
}

/**
 * Format export data
 */
function formatExportData(products) {
    return products.map(product => ({
        id: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        quantity: product.quantity,
        status: product.status,
        vendor: product.vendor?.vendorProfile?.storeName || product.vendor?.email,
        categories: product.categories?.map(c => c.name).join(', '),
        brand: product.brand?.name,
        tags: product.tags?.join(', '),
        weight: product.weight,
        totalSold: product.sales?.totalQuantity || 0,
        averageRating: product.reviews?.averageRating || 0,
        totalReviews: product.reviews?.totalReviews || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    }));
}

/**
 * Generate export file
 */
async function generateExportFile(data, format, filters) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products-${timestamp}`;

    switch (format) {
        case 'csv': {
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(data);
            return {
                data: csv,
                contentType: 'text/csv',
                filename: `${filename}.csv`
            };
        }

        case 'excel': {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Products');

            // Add headers
            if (data.length > 0) {
                worksheet.columns = Object.keys(data[0]).map(key => ({
                    header: key,
                    key: key,
                    width: 20
                }));
            }

            // Add data
            worksheet.addRows(data);

            const buffer = await workbook.xlsx.writeBuffer();
            return {
                data: buffer,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filename: `${filename}.xlsx`
            };
        }

        case 'json': {
            return {
                data: JSON.stringify(data, null, 2),
                contentType: 'application/json',
                filename: `${filename}.json`
            };
        }

        case 'pdf': {
            return new Promise((resolve) => {
                const doc = new PDFDocument();
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => {
                    resolve({
                        data: Buffer.concat(chunks),
                        contentType: 'application/pdf',
                        filename: `${filename}.pdf`
                    });
                });

                // Generate PDF content
                doc.fontSize(20).text('Products Export', { align: 'center' });
                doc.moveDown();

                data.forEach((product, index) => {
                    doc.fontSize(12).text(`${index + 1}. ${product.name}`);
                    doc.fontSize(10).text(`   SKU: ${product.sku || 'N/A'}`);
                    doc.fontSize(10).text(`   Price: $${product.price}`);
                    doc.fontSize(10).text(`   Stock: ${product.quantity}`);
                    doc.fontSize(10).text(`   Status: ${product.status}`);
                    doc.moveDown();
                });

                doc.end();
            });
        }

        default:
            return {
                data: data,
                contentType: 'application/json',
                filename: `${filename}.json`
            };
    }
}

/**
 * Get export fields
 */
function getExportFields() {
    return [
        'name', 'sku', 'price', 'compareAtPrice', 'cost',
        'quantity', 'status', 'visibility', 'vendor',
        'categories', 'brand', 'tags', 'weight', 'dimensions',
        'sales.totalQuantity', 'reviews.averageRating',
        'reviews.totalReviews', 'createdAt', 'updatedAt'
    ];
}

/**
 * Enhance product with computed fields
 */
function enhanceProduct(product, user) {
    return {
        ...product,
        formattedPrice: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: product.currency || 'USD'
        }).format(product.price),
        discountPercentage: product.compareAtPrice && product.compareAtPrice > product.price
            ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
            : 0,
        inStock: product.quantity > 0,
        stockStatus: product.quantity > 0
            ? product.quantity <= product.lowStockThreshold ? 'low_stock' : 'in_stock'
            : product.allowBackorder ? 'backorder' : 'out_of_stock',
        url: `/product/${product.slug}`,
        canEdit: user && (user.role === 'admin' || user.role === 'super_admin' ||
            (user.role === 'vendor' && product.vendor?._id?.toString() === user._id?.toString()))
    };
}

/**
 * Send webhook
 */
async function sendWebhook(event, data) {
    // Implement webhook logic here
    // This could send to external services, trigger serverless functions, etc.
    logger.info(`Webhook triggered: ${event}`, { event, dataId: data._id });
}

/**
 * Build product query from filters
 */
const buildProductQuery = (filters, user) => {
    const query = { isDeleted: false, isArchived: false };

    // Apply visibility based on user role
    if (!user || user.role === 'customer') {
        query.status = 'active';
        query.visibility = 'public';
    } else if (user.role === 'vendor') {
        query.$or = [
            { vendor: user._id },
            { status: 'active', visibility: 'public' }
        ];
    }

    // Apply search filter
    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
        query.categories = filters.category;
    }

    // Apply vendor filter
    if (filters.vendor && filters.vendor !== 'all') {
        query.vendor = filters.vendor;
    }

    // Apply price range
    if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
    }

    // Apply quantity range
    if (filters.minQuantity || filters.maxQuantity) {
        query.quantity = {};
        if (filters.minQuantity) query.quantity.$gte = parseInt(filters.minQuantity);
        if (filters.maxQuantity) query.quantity.$lte = parseInt(filters.maxQuantity);
    }

    // Apply track quantity filter
    if (filters.trackQuantity && filters.trackQuantity !== 'all') {
        query.trackQuantity = filters.trackQuantity === 'true';
    }

    // Apply date range
    if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) {
            const endDate = new Date(filters.dateTo);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt.$lte = endDate;
        }
    }

    return query;
};

/**
 * Build sort object
 */
function buildSortObject(sortBy, sortOrder) {
    const order = sortOrder === 'desc' ? -1 : 1;
    const sort = {};

    switch (sortBy) {
        case 'price':
            sort.price = order;
            break;
        case 'rating':
            sort['reviews.averageRating'] = order;
            break;
        case 'popularity':
            sort['sales.totalQuantity'] = order;
            break;
        case 'newest':
            sort.createdAt = -1; // Always descending for newest
            break;
        case 'name':
            sort.name = order;
            break;
        case 'featured':
            sort.featured = -1;
            sort.featuredRank = -1;
            break;
        default:
            sort.createdAt = -1;
    }

    return sort;
}

/**
 * Get filter facets
 */
async function getFilterFacets(query, filters) {
    const facets = {};

    // Get distinct categories with counts
    facets.categories = await Product.aggregate([
        { $match: query },
        { $unwind: '$categories' },
        {
            $group: {
                _id: '$categories',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $project: {
                _id: 1,
                name: '$category.name',
                slug: '$category.slug',
                count: 1
            }
        },
        { $sort: { count: -1 } }
    ]);

    // Get distinct brands with counts
    facets.brands = await Product.aggregate([
        { $match: { ...query, brand: { $exists: true } } },
        {
            $group: {
                _id: '$brand',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'brands',
                localField: '_id',
                foreignField: '_id',
                as: 'brand'
            }
        },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                name: '$brand.name',
                count: 1
            }
        },
        { $sort: { count: -1 } }
    ]);

    return facets;
}

/**
 * Calculate date ranges for analytics
 */
function calculateDateRanges(period) {
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();

    switch (period) {
        case '24h':
            startDate.setHours(startDate.getHours() - 24);
            previousStartDate.setHours(previousStartDate.getHours() - 48);
            break;
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            previousStartDate.setDate(previousStartDate.getDate() - 14);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            previousStartDate.setDate(previousStartDate.getDate() - 60);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            previousStartDate.setDate(previousStartDate.getDate() - 180);
            break;
        case '12m':
            startDate.setMonth(startDate.getMonth() - 12);
            previousStartDate.setMonth(previousStartDate.getMonth() - 24);
            break;
        default:
            startDate.setDate(startDate.getDate() - 30);
            previousStartDate.setDate(previousStartDate.getDate() - 60);
    }

    return { startDate, endDate, previousStartDate };
}

/**
 * Build analytics match
 */
async function buildAnalyticsMatch(userId, userRole, startDate, endDate, options) {
    const match = {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: false
    };

    if (userRole === 'vendor') {
        match.vendor = userId;
    }

    if (options.category) {
        match.categories = mongoose.Types.ObjectId.isValid(options.category)
            ? new mongoose.Types.ObjectId(options.category)
            : { $in: await getCategoryIds(options.category) };
    }

    if (options.vendor && (userRole === 'admin' || userRole === 'super_admin')) {
        match.vendor = mongoose.Types.ObjectId.isValid(options.vendor)
            ? new mongoose.Types.ObjectId(options.vendor)
            : { $in: await getVendorIds(options.vendor) };
    }

    return match;
}

/**
 * Get category IDs from name/slug
 */
async function getCategoryIds(identifier) {
    const categories = await Category.find({
        $or: [
            { name: { $regex: identifier, $options: 'i' } },
            { slug: { $regex: identifier, $options: 'i' } }
        ]
    }).select('_id');
    return categories.map(c => c._id);
}

/**
 * Get vendor IDs from store name/email
 */
async function getVendorIds(identifier) {
    const vendors = await AdminVendor.find({
        $or: [
            { 'vendorProfile.storeName': { $regex: identifier, $options: 'i' } },
            { email: { $regex: identifier, $options: 'i' } }
        ]
    }).select('_id');
    return vendors.map(v => v._id);
}

/**
 * Get period analytics
 */
async function getPeriodAnalytics(match, groupBy) {
    let groupId;

    switch (groupBy) {
        case 'hour':
            groupId = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
            break;
        case 'day':
            groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            break;
        case 'week':
            groupId = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
            break;
        case 'month':
            groupId = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            break;
        case 'year':
            groupId = { $dateToString: { format: '%Y', date: '$createdAt' } };
            break;
        default:
            groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    return Product.aggregate([
        { $match: match },
        {
            $group: {
                _id: groupId,
                productCount: { $sum: 1 },
                totalRevenue: { $sum: '$sales.totalRevenue' },
                totalQuantity: { $sum: '$sales.totalQuantity' },
                totalOrders: { $sum: '$sales.totalOrders' },
                averagePrice: { $avg: '$price' },
                newProducts: {
                    $sum: {
                        $cond: [
                            { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                            1, 0
                        ]
                    }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);
}

/**
 * Calculate trends
 */
async function calculateTrends(match, current, previous) {
    if (!previous || previous.length === 0) {
        return null;
    }

    const currentTotal = current.reduce((sum, item) => sum + item.totalRevenue, 0);
    const previousTotal = previous.reduce((sum, item) => sum + item.totalRevenue, 0);

    const growth = previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : 100;

    return {
        revenueGrowth: parseFloat(growth.toFixed(2)),
        periodComparison: {
            current: currentTotal,
            previous: previousTotal,
            difference: currentTotal - previousTotal
        }
    };
}

/**
 * Get top performing products
 */
async function getTopPerformingProducts(match, limit) {
    return Product.aggregate([
        { $match: match },
        {
            $project: {
                name: 1,
                sku: 1,
                price: 1,
                totalRevenue: '$sales.totalRevenue',
                totalQuantity: '$sales.totalQuantity',
                totalOrders: '$sales.totalOrders',
                images: 1,
                vendor: 1,
                'reviews.averageRating': 1,
                conversionRate: {
                    $multiply: [
                        { $divide: ['$sales.totalOrders', { $max: ['$engagement.views', 1] }] },
                        100
                    ]
                }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'adminvendors',
                localField: 'vendor',
                foreignField: '_id',
                as: 'vendorInfo'
            }
        },
        { $unwind: '$vendorInfo' }
    ]);
}

/**
 * Get category performance
 */
async function getCategoryPerformance(match) {
    return Product.aggregate([
        { $match: match },
        { $unwind: '$categories' },
        {
            $group: {
                _id: '$categories',
                revenue: { $sum: '$sales.totalRevenue' },
                quantity: { $sum: '$sales.totalQuantity' },
                orders: { $sum: '$sales.totalOrders' },
                products: { $addToSet: '$_id' }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $project: {
                name: '$category.name',
                slug: '$category.slug',
                revenue: 1,
                quantity: 1,
                orders: 1,
                productCount: { $size: '$products' },
                averageOrderValue: { $divide: ['$revenue', { $max: ['$orders', 1] }] }
            }
        },
        { $sort: { revenue: -1 } }
    ]);
}

/**
 * Get price distribution
 */
async function getPriceDistribution(match) {
    return Product.aggregate([
        { $match: match },
        {
            $bucket: {
                groupBy: '$price',
                boundaries: [0, 25, 50, 100, 200, 500, 1000, 5000, 10000],
                default: '10000+',
                output: {
                    count: { $sum: 1 },
                    products: { $push: '$_id' },
                    totalRevenue: { $sum: '$sales.totalRevenue' },
                    averagePrice: { $avg: '$price' }
                }
            }
        }
    ]);
}

/**
 * Get inventory analytics
 */
async function getInventoryAnalytics(match) {
    const result = await Product.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                totalCost: { $sum: { $multiply: ['$cost', '$quantity'] } },
                averagePrice: { $avg: '$price' },
                totalQuantity: { $sum: '$quantity' },
                outOfStock: {
                    $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] }
                },
                lowStock: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $gt: ['$quantity', 0] },
                                    { $lte: ['$quantity', '$lowStockThreshold'] }
                                ]
                            },
                            1, 0
                        ]
                    }
                },
                activeProducts: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                totalProducts: 1,
                totalValue: 1,
                totalCost: 1,
                averagePrice: 1,
                totalQuantity: 1,
                outOfStock: 1,
                lowStock: 1,
                activeProducts: 1,
                potentialProfit: { $subtract: ['$totalValue', '$totalCost'] },
                stockRatio: {
                    $multiply: [
                        { $divide: ['$activeProducts', { $max: ['$totalProducts', 1] }] },
                        100
                    ]
                }
            }
        }
    ]);

    return result[0] || {
        totalProducts: 0,
        totalValue: 0,
        totalCost: 0,
        averagePrice: 0,
        totalQuantity: 0,
        outOfStock: 0,
        lowStock: 0,
        activeProducts: 0,
        potentialProfit: 0,
        stockRatio: 0
    };
}

/**
 * Generate sales forecast
 */
async function generateSalesForecast(match) {
    // Get historical sales data
    const historicalData = await Product.aggregate([
        { $match: match },
        { $unwind: '$sales.daily' },
        {
            $group: {
                _id: {
                    year: { $year: '$sales.daily.date' },
                    month: { $month: '$sales.daily.date' },
                    day: { $dayOfMonth: '$sales.daily.date' }
                },
                totalRevenue: { $sum: '$sales.daily.revenue' },
                totalQuantity: { $sum: '$sales.daily.quantity' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Simple moving average forecast
    const forecast = [];
    if (historicalData.length >= 7) {
        const last7Days = historicalData.slice(-7);
        const avgDailyRevenue = last7Days.reduce((sum, d) => sum + d.totalRevenue, 0) / 7;
        const avgDailyQuantity = last7Days.reduce((sum, d) => sum + d.totalQuantity, 0) / 7;

        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            forecast.push({
                date: date.toISOString().split('T')[0],
                predictedRevenue: avgDailyRevenue,
                predictedQuantity: avgDailyQuantity,
                confidence: 0.7 - (i * 0.05) // Decreasing confidence for longer forecasts
            });
        }
    }

    return forecast;
}

/**
 * Sanitize product data
 */
function sanitizeProductData(data) {
    const sanitized = { ...data };

    // Remove any MongoDB operators
    Object.keys(sanitized).forEach(key => {
        if (key.startsWith('$')) {
            delete sanitized[key];
        }
    });

    // Sanitize strings
    if (sanitized.name) sanitized.name = sanitizeString(sanitized.name);
    if (sanitized.description) sanitized.description = sanitizeString(sanitized.description);
    if (sanitized.shortDescription) sanitized.shortDescription = sanitizeString(sanitized.shortDescription);

    return sanitized;
}

/**
 * Get personalized recommendations
 */
async function getPersonalizedRecommendations(userId, { limit, context }) {
    // Get user's purchase history and browsing behavior
    const userHistory = await ActivityLog.find({
        user: userId,
        resourceType: 'product',
        action: { $in: ['view', 'purchase', 'add_to_cart'] }
    })
        .sort('-createdAt')
        .limit(100)
        .lean();

    // Extract product IDs from history
    const viewedProducts = userHistory
        .filter(h => h.action === 'view')
        .map(h => h.resourceId);

    const purchasedProducts = userHistory
        .filter(h => h.action === 'purchase')
        .map(h => h.resourceId);

    // Get products similar to user's interests
    const recommendations = await Product.find({
        _id: { $nin: [...purchasedProducts, ...viewedProducts] },
        status: 'active',
        isDeleted: false
    })
        .sort({ 'sales.totalQuantity': -1, 'reviews.averageRating': -1 })
        .limit(limit)
        .populate('vendor', 'vendorProfile.storeName')
        .populate('categories', 'name')
        .lean();

    return recommendations;
}

/**
 * Get similar products
 */
async function getSimilarProducts(userId, productId, { limit }) {
    if (!productId) return [];

    const product = await Product.findById(productId).lean();
    if (!product) return [];

    const similarProducts = await Product.find({
        _id: { $ne: productId },
        status: 'active',
        isDeleted: false,
        $or: [
            { categories: { $in: product.categories } },
            { brand: product.brand },
            { tags: { $in: product.tags || [] } }
        ]
    })
        .limit(limit)
        .populate('vendor', 'vendorProfile.storeName')
        .populate('categories', 'name')
        .lean();

    return similarProducts;
}

/**
 * Get trending products
 */
async function getTrendingProducts({ limit, context }) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingProducts = await Product.aggregate([
        {
            $match: {
                status: 'active',
                isDeleted: false,
                'sales.daily.date': { $gte: thirtyDaysAgo }
            }
        },
        {
            $addFields: {
                trendingScore: {
                    $sum: {
                        $map: {
                            input: '$sales.daily',
                            as: 'day',
                            in: {
                                $multiply: [
                                    { $ifNull: ['$$day.quantity', 0] },
                                    {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: { $gte: ['$$day.date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                                                    then: 1.5
                                                },
                                                {
                                                    case: { $gte: ['$$day.date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)] },
                                                    then: 1.0
                                                }
                                            ],
                                            default: 0.5
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        { $sort: { trendingScore: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'adminvendors',
                localField: 'vendor',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        {
            $lookup: {
                from: 'categories',
                localField: 'categories',
                foreignField: '_id',
                as: 'categories'
            }
        }
    ]);

    return trendingProducts;
}

/**
 * Get recently viewed products
 */
async function getRecentlyViewedProducts(userId, { limit }) {
    const recentViews = await ActivityLog.find({
        user: userId,
        resourceType: 'product',
        action: 'view'
    })
        .sort('-createdAt')
        .limit(limit * 2)
        .lean();

    const productIds = [...new Set(recentViews.map(v => v.resourceId))].slice(0, limit);

    const products = await Product.find({
        _id: { $in: productIds },
        status: 'active',
        isDeleted: false
    })
        .populate('vendor', 'vendorProfile.storeName')
        .populate('categories', 'name')
        .lean();

    // Sort by view date
    const viewOrder = {};
    recentViews.forEach((view, index) => {
        viewOrder[view.resourceId] = index;
    });

    return products.sort((a, b) => viewOrder[a._id] - viewOrder[b._id]);
}

/**
 * Get frequently bought together
 */
async function getFrequentlyBoughtTogether(productId, { limit }) {
    // This would typically come from order analytics
    // For now, return products from same category
    const product = await Product.findById(productId).lean();
    if (!product) return [];

    const frequentlyBought = await Product.find({
        _id: { $ne: productId },
        categories: { $in: product.categories || [] },
        status: 'active',
        isDeleted: false
    })
        .limit(limit)
        .populate('vendor', 'vendorProfile.storeName')
        .populate('categories', 'name')
        .lean();

    return frequentlyBought;
}

/**
 * Get hybrid recommendations
 */
async function getHybridRecommendations(userId, { limit, context }) {
    const [personalized, trending, recentlyViewed] = await Promise.all([
        getPersonalizedRecommendations(userId, { limit: Math.ceil(limit / 3), context }),
        getTrendingProducts({ limit: Math.ceil(limit / 3), context }),
        getRecentlyViewedProducts(userId, { limit: Math.ceil(limit / 3) })
    ]);

    // Combine and deduplicate
    const allRecommendations = [...personalized, ...trending, ...recentlyViewed];
    const uniqueIds = new Set();
    const uniqueRecommendations = [];

    for (const rec of allRecommendations) {
        if (!uniqueIds.has(rec._id.toString())) {
            uniqueIds.add(rec._id.toString());
            uniqueRecommendations.push(rec);
        }
    }

    return uniqueRecommendations.slice(0, limit);
}

/**
 * Enhance recommendations with reasons
 */
async function enhanceWithRecommendationReasons(recommendations, userId) {
    // Get user's recent interactions for context
    const recentInteractions = await ActivityLog.find({
        user: userId,
        resourceType: 'product',
        action: { $in: ['view', 'purchase', 'add_to_cart'] }
    })
        .sort('-createdAt')
        .limit(10)
        .lean();

    return recommendations.map(product => {
        let reason = 'Recommended for you';

        // Find if product relates to user's interests
        const relatedInteraction = recentInteractions.find(i =>
            product.categories?.some(cat =>
                i.metadata?.categories?.includes(cat.toString())
            )
        );

        if (relatedInteraction) {
            reason = 'Based on your browsing history';
        } else if (product.sales?.totalQuantity > 100) {
            reason = 'Popular product';
        } else if (product.reviews?.averageRating >= 4.5) {
            reason = 'Highly rated';
        }

        return {
            ...product,
            recommendationReason: reason
        };
    });
}

/**
 * Increment product views
 */
async function incrementProductViews(productId, userId) {
    try {
        await Product.findByIdAndUpdate(productId, {
            $inc: { 'engagement.views': 1 }
        });

        // Track for analytics
        if (userId) {
            await redis.zincrby('product:views:daily', 1, `${productId}:${new Date().toISOString().split('T')[0]}`);
        }
    } catch (error) {
        logger.error('Error incrementing product views', error);
    }
}

/**
 * Track product view for recommendations
 */
async function trackProductView(userId, productId) {
    try {
        const product = await Product.findById(productId).select('categories tags').lean();

        await ActivityLog.create({
            user: userId,
            action: 'view',
            resourceType: 'product',
            resourceId: productId,
            metadata: {
                categories: product?.categories,
                tags: product?.tags
            }
        });
    } catch (error) {
        logger.error('Error tracking product view', error);
    }
}

/**
 * Get related products
 */
async function getRelatedProducts(productId, categories, limit) {
    return Product.find({
        _id: { $ne: productId },
        categories: { $in: categories },
        status: 'active',
        isDeleted: false
    })
        .select('name slug price images reviews.averageRating')
        .limit(limit)
        .lean();
}

/**
 * Get similar products by features
 */
async function getSimilarProductsByFeatures(product, limit) {
    return Product.find({
        _id: { $ne: product._id },
        $or: [
            { brand: product.brand },
            { tags: { $in: product.tags || [] } }
        ],
        status: 'active',
        isDeleted: false
    })
        .select('name slug price images reviews.averageRating')
        .limit(limit)
        .lean();
}

/**
 * Get product reviews summary
 */
async function getProductReviewsSummary(productId) {
    // Note: This assumes reviews are stored in a separate collection
    // If reviews are embedded in the product, adjust accordingly
    return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
}

/**
 * Get product questions summary
 */
async function getProductQuestionsSummary(productId) {
    // Note: This assumes questions are stored in a separate collection
    // If questions are embedded in the product, adjust accordingly
    return { totalQuestions: 0, answeredQuestions: 0 };
}

/**
 * Get product analytics
 */
async function getProductAnalytics(productId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await Product.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(productId) } },
        {
            $project: {
                views: '$engagement.views',
                wishlistCount: 0, // Placeholder - add if field exists
                shareCount: 0, // Placeholder - add if field exists
                dailyViews: {
                    $filter: {
                        input: { $ifNull: ['$engagement.daily', []] },
                        as: 'day',
                        cond: { $gte: ['$$day.date', thirtyDaysAgo] }
                    }
                }
            }
        }
    ]);

    return analytics[0] || {};
}

/**
 * Check visibility password
 */
async function checkVisibilityPassword(req, product) {
    const { password } = req.query;

    if (!password || password !== product.visibilityPassword) {
        throw new AppError('Password required to view this product', 401);
    }
}

/**
 * Permanent delete product
 */
async function permanentDeleteProduct(product, userId, reason, ipAddress, userAgent) { // ✅ Added ipAddress and userAgent
    // Delete images from cloudinary
    for (const image of product.images) {
        if (image.cloudinaryId) {
            await deleteFromCloudinary(image.cloudinaryId);
        }
    }

    // Delete product
    await Product.findByIdAndDelete(product._id);

    // Create audit log - ✅ Use passed parameters
    await createAuditLog({
        user: userId,
        action: 'delete_permanent',
        resourceType: 'product',
        resourceId: product._id,
        description: `Permanently deleted product: ${product.name}`,
        metadata: { reason, sku: product.sku },
        ipAddress: ipAddress, // ✅ Use passed value
        userAgent: userAgent  // ✅ Use passed value
    });

    // Update vendor stats
    await AdminVendor.findByIdAndUpdate(product.vendor, {
        $inc: { 'vendorProfile.performance.totalProducts': -1 }
    });
}
/**
 * Soft delete product
 */
async function softDeleteProduct(product, userId, reason, ipAddress, userAgent) { // ✅ Added ipAddress and userAgent
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.deletedBy = userId;
    product.deleteReason = reason;
    product.status = 'deleted';
    
    await product.save();

    // Create audit log - ✅ Use passed parameters
    await createAuditLog({
        user: userId,
        action: 'delete_soft',
        resourceType: 'product',
        resourceId: product._id,
        description: `Soft deleted product: ${product.name}`,
        metadata: { reason, sku: product.sku },
        ipAddress: ipAddress, // ✅ Use passed value
        userAgent: userAgent  // ✅ Use passed value
    });

    // Update vendor stats
    await AdminVendor.findByIdAndUpdate(product.vendor, {
        $inc: { 'vendorProfile.performance.activeProducts': -1 }
    });
}

/**
 * Calculate color similarity
 */
async function calculateColorSimilarity(colors) {
    // Placeholder - implement actual color similarity logic
    return 0.5;
}

/**
 * Calculate tag similarity
 */
async function calculateTagSimilarity(tags) {
    // Placeholder - implement actual tag similarity logic
    return 0.5;
}

/**
 * Calculate category similarity
 */
async function calculateCategorySimilarity(categories) {
    // Placeholder - implement actual category similarity logic
    return 0.5;
}

// ============================================
// EXPORT CONTROLLER
// ============================================

export default {
    // AI Search
    searchProducts,
    getRecommendations,

    // CRUD
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,

    // Approval Workflow
    approveProduct,
    rejectProduct,
    requestProductChanges,

    // Inventory
    updateInventory,
    getInventorySummary,

    // Bulk Operations
    bulkImportProducts,
    bulkExportProducts,

    // Analytics
    getAnalytics
};