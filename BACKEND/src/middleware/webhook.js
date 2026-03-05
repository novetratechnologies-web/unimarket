// FILE: src/middleware/webhook.js

import crypto from 'crypto';
import axios from 'axios';
import loggerModule from '../utils/logger.js';

// Create contextual logger
const { createModuleLogger } = loggerModule;
const logger = createModuleLogger('Webhook');

// Webhook configuration
const webhookConfig = {
    // Maximum retries for failed webhooks
    maxRetries: 3,
    // Retry delay in ms (exponential backoff)
    retryDelay: 1000,
    // Webhook timeout in ms
    timeout: 5000,
    // Secret for verifying webhook signatures
    secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret',
    // Queue for pending webhooks (Redis)
    useQueue: true,
    // Enable/disable webhooks globally
    enabled: process.env.WEBHOOKS_ENABLED !== 'false'
};

// Webhook event types
export const WEBHOOK_EVENTS = {
    // Product events
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_DELETED: 'product.deleted',
    PRODUCT_APPROVED: 'product.approved',
    PRODUCT_REJECTED: 'product.rejected',
    PRODUCT_RESTORED: 'product.restored',
    PRODUCT_DUPLICATED: 'product.duplicated',
    PRODUCT_MERGED: 'products.merged',
    
    // Inventory events
    INVENTORY_UPDATED: 'inventory.updated',
    INVENTORY_LOW_STOCK: 'inventory.low_stock',
    INVENTORY_OUT_OF_STOCK: 'inventory.out_of_stock',
    INVENTORY_RESTOCKED: 'inventory.restocked',
    
    // Bulk events
    BULK_IMPORTED: 'products.imported',
    BULK_EXPORTED: 'products.exported',
    BULK_UPDATED: 'products.bulk.updated',
    
    // Review events
    REVIEW_CREATED: 'review.created',
    REVIEW_UPDATED: 'review.updated',
    REVIEW_DELETED: 'review.deleted',
    REVIEW_REPORTED: 'review.reported',
    
    // Question events
    QUESTION_CREATED: 'question.created',
    QUESTION_ANSWERED: 'question.answered',
    
    // Wishlist events
    WISHLIST_ADDED: 'wishlist.added',
    WISHLIST_REMOVED: 'wishlist.removed',
    
    // Price events
    PRICE_UPDATED: 'price.updated',
    PROMOTION_APPLIED: 'promotion.applied',
    PROMOTION_REMOVED: 'promotion.removed',
    
    // Variant events
    VARIANT_CREATED: 'variant.created',
    VARIANT_UPDATED: 'variant.updated',
    VARIANT_DELETED: 'variant.deleted',
    
    // Related products
    RELATED_ADDED: 'related.added',
    RELATED_REMOVED: 'related.removed'
};

/**
 * Webhook middleware factory
 * Sends webhook notifications for specific events
 */
export const webhook = (eventType, options = {}) => {
    const {
        // Skip if no webhook URLs configured
        skipIfNoListeners = true,
        // Include full data or just summary
        includeFullData = true,
        // Delay webhook (for async processing)
        delay = 0,
        // Custom payload transformer
        transform = null,
        // Webhook priority (high, normal, low)
        priority = 'normal'
    } = options;

    return async (req, res, next) => {
        // Store original send methods
        const originalJson = res.json;
        const originalSend = res.send;
        const originalEnd = res.end;

        // Override response methods to capture data
        res.json = function(data) {
            // Store response data for webhook
            res.webhookData = data;
            return originalJson.call(this, data);
        };

        res.send = function(data) {
            res.webhookData = data;
            return originalSend.call(this, data);
        };

        res.end = function(chunk, encoding) {
            // After response is sent, trigger webhook
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Use setImmediate to not block response
                setImmediate(() => {
                    sendWebhook(eventType, {
                        req,
                        res,
                        data: res.webhookData,
                        options: { includeFullData, transform, priority, delay }
                    }).catch(err => {
                        logger.error(`Webhook failed for ${eventType}:`, err.message);
                    });
                });
            }
            return originalEnd.call(this, chunk, encoding);
        };

        next();
    };
};

/**
 * Send webhook to configured endpoints
 */
async function sendWebhook(eventType, context) {
    if (!webhookConfig.enabled) {
        logger.debug('Webhooks disabled, skipping:', eventType);
        return;
    }

    const { req, res, data, options } = context;
    const { includeFullData, transform, priority, delay } = options;

    try {
        // Get webhook endpoints from database/cache
        const endpoints = await getWebhookEndpoints(eventType, req.user?._id);

        if (!endpoints || endpoints.length === 0) {
            logger.debug(`No webhook endpoints for event: ${eventType}`);
            return;
        }

        // Build payload
        let payload = buildWebhookPayload(eventType, {
            req,
            res,
            data,
            includeFullData
        });

        // Apply custom transformer if provided
        if (transform && typeof transform === 'function') {
            payload = transform(payload, context);
        }

        // Add signature
        const signature = generateSignature(payload);

        // Add metadata
        payload = {
            ...payload,
            meta: {
                ...payload.meta,
                signature,
                priority,
                timestamp: Date.now()
            }
        };

        // Apply delay if specified
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Send to all endpoints
        const results = await Promise.allSettled(
            endpoints.map(endpoint => 
                deliverWebhook(endpoint, payload, priority)
            )
        );

        // Log results
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        logger.info(`Webhook ${eventType} sent to ${successful}/${endpoints.length} endpoints`);

        // Store in database for audit
        await storeWebhookLog({
            eventType,
            endpoints: endpoints.map(e => e.url),
            payload: { ...payload, data: '[REDACTED]' },
            results,
            timestamp: new Date()
        });

    } catch (error) {
        logger.error('Webhook delivery error:', error);
        throw error;
    }
}

/**
 * Deliver webhook to single endpoint with retries
 */
async function deliverWebhook(endpoint, payload, priority) {
    const { url, secret, headers = {} } = endpoint;
    const maxRetries = priority === 'high' ? webhookConfig.maxRetries : 1;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Calculate delay with exponential backoff
            const delay = attempt === 1 ? 0 : webhookConfig.retryDelay * Math.pow(2, attempt - 2);
            
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // Prepare headers
            const requestHeaders = {
                'Content-Type': 'application/json',
                'User-Agent': 'Ecommerce-Webhook/1.0',
                'X-Webhook-Event': payload.event,
                'X-Webhook-ID': payload.meta.id,
                'X-Webhook-Attempt': attempt,
                'X-Webhook-Signature': payload.meta.signature,
                ...headers
            };

            // Add secret if provided
            if (secret) {
                requestHeaders['X-Webhook-Secret'] = secret;
            }

            // Send webhook
            const response = await axios.post(url, payload, {
                headers: requestHeaders,
                timeout: webhookConfig.timeout,
                validateStatus: null // Don't throw on any status
            });

            // Check response
            if (response.status >= 200 && response.status < 300) {
                logger.debug(`Webhook delivered to ${url} on attempt ${attempt}`);
                return { success: true, url, status: response.status };
            } else {
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                logger.warn(`Webhook attempt ${attempt} failed for ${url}: ${response.status}`);
            }

        } catch (error) {
            lastError = error;
            logger.warn(`Webhook attempt ${attempt} error for ${url}:`, error.message);
        }
    }

    // If we get here, all retries failed
    logger.error(`Webhook failed for ${url} after ${maxRetries} attempts`);
    
    // Queue for later retry if configured
    if (webhookConfig.useQueue) {
        await queueWebhook(endpoint, payload);
    }

    throw lastError;
}

/**
 * Build webhook payload
 */
function buildWebhookPayload(eventType, context) {
    const { req, res, data, includeFullData } = context;
    
    // Base payload
    const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        meta: {
            id: crypto.randomBytes(16).toString('hex'),
            version: '1.0',
            environment: process.env.NODE_ENV || 'development',
            source: 'product-service',
            requestId: req?.id
        },
        data: includeFullData ? data : { id: data?.data?._id || data?._id }
    };

    // Add request context (sanitized)
    if (req) {
        payload.request = {
            method: req.method,
            url: req.originalUrl,
            ip: sanitizeIp(req.ip),
            userAgent: req.get('user-agent'),
            userId: req.user?._id,
            userRole: req.user?.role
        };
    }

    // Add response context
    if (res) {
        payload.response = {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage
        };
    }

    return payload;
}

/**
 * Generate HMAC signature for payload
 */
function generateSignature(payload) {
    const hmac = crypto.createHmac('sha256', webhookConfig.secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
}

/**
 * Get webhook endpoints for event type
 */
async function getWebhookEndpoints(eventType, userId = null) {
    // This would typically fetch from database
    // For now, return mock data or empty array
    
    // Example implementation:
    // return await WebhookEndpoint.find({
    //     $or: [
    //         { events: eventType },
    //         { events: '*' }
    //     ],
    //     active: true,
    //     $or: [
    //         { userId: null },
    //         { userId }
    //     ]
    // }).lean();

    // Check environment variable for testing
    if (process.env.WEBHOOK_TEST_URL) {
        try {
            return [{
                url: process.env.WEBHOOK_TEST_URL,
                secret: process.env.WEBHOOK_TEST_SECRET,
                headers: process.env.WEBHOOK_TEST_HEADERS ? 
                    JSON.parse(process.env.WEBHOOK_TEST_HEADERS) : {}
            }];
        } catch (error) {
            logger.error('Failed to parse WEBHOOK_TEST_HEADERS:', error);
            return [];
        }
    }

    return [];
}

/**
 * Queue webhook for later retry
 */
async function queueWebhook(endpoint, payload) {
    // Implement with Redis, Bull, etc.
    logger.info(`Webhook queued for later retry: ${endpoint.url}`);
    
    // Example with Redis:
    // try {
    //     const redis = await import('../config/redis.js');
    //     await redis.default.rpush('webhook:queue', JSON.stringify({
    //         endpoint,
    //         payload,
    //         queuedAt: new Date()
    //     }));
    // } catch (error) {
    //     logger.error('Failed to queue webhook:', error);
    // }
}

/**
 * Store webhook log in database
 */
async function storeWebhookLog(logData) {
    // Implement database storage
    // Example:
    // try {
    //     const WebhookLog = mongoose.model('WebhookLog');
    //     await WebhookLog.create(logData);
    // } catch (error) {
    //     logger.error('Failed to store webhook log:', error);
    // }
    
    logger.debug('Webhook log stored:', logData.eventType);
}

/**
 * Sanitize IP address for logging
 */
function sanitizeIp(ip) {
    if (!ip) return ip;
    // Remove IPv6 prefix if present
    return ip.replace(/^::ffff:/, '');
}

// ============================================
// WEBHOOK HANDLER (for receiving webhooks)
// ============================================

/**
 * Handle incoming webhooks from external services
 */
export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        const event = req.headers['x-webhook-event'];
        const webhookId = req.headers['x-webhook-id'];
        
        // Verify signature
        if (!verifySignature(req.body, signature)) {
            logger.warn('Invalid webhook signature', { 
                event, 
                webhookId,
                ip: req.ip 
            });
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process webhook based on event type
        const result = await processIncomingWebhook(event, req.body);

        logger.info(`Webhook received: ${event}`, { 
            webhookId,
            processed: result.handled 
        });
        
        res.json({
            success: true,
            received: true,
            event,
            processed: result
        });

    } catch (error) {
        logger.error('Error handling webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verify incoming webhook signature
 */
function verifySignature(payload, signature) {
    if (!signature) return false;
    
    try {
        const hmac = crypto.createHmac('sha256', webhookConfig.secret);
        hmac.update(JSON.stringify(payload));
        const expectedSignature = hmac.digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        logger.error('Signature verification failed:', error);
        return false;
    }
}

/**
 * Process incoming webhook
 */
async function processIncomingWebhook(event, payload) {
    // Implement based on your needs
    switch (event) {
        case 'order.created':
            logger.info('Processing order.created webhook', { orderId: payload.data?.id });
            // Handle order created
            break;
        case 'order.updated':
            logger.info('Processing order.updated webhook', { orderId: payload.data?.id });
            // Handle order updated
            break;
        case 'product.updated':
            logger.info('Processing product.updated webhook', { productId: payload.data?.id });
            // Handle product updated from external source
            break;
        default:
            logger.debug(`Unhandled webhook event: ${event}`);
    }
    
    return { handled: true, event };
}

// ============================================
// WEBHOOK TESTING UTILITIES
// ============================================

/**
 * Test webhook endpoint
 */
export const testWebhook = async (req, res) => {
    try {
        const { url, event = 'test.event', data = {} } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL
        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const testPayload = {
            event,
            timestamp: new Date().toISOString(),
            meta: {
                id: crypto.randomBytes(16).toString('hex'),
                test: true,
                source: 'webhook-test'
            },
            data
        };

        const signature = generateSignature(testPayload);

        const response = await axios.post(url, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': event,
                'X-Webhook-Test': 'true',
                'X-Webhook-ID': testPayload.meta.id
            },
            timeout: 5000
        });

        logger.info('Webhook test sent', { 
            url, 
            event, 
            status: response.status 
        });

        res.json({
            success: true,
            message: 'Webhook test sent',
            response: {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers
            }
        });

    } catch (error) {
        logger.error('Webhook test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data
        });
    }
};

// ============================================
// WEBHOOK MANAGEMENT (Admin)
// ============================================

/**
 * Register a new webhook endpoint
 */
export const registerWebhook = async (req, res) => {
    try {
        const { url, events, secret, headers, description } = req.body;

        // Validate URL
        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        // Validate events array
        if (!events || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ error: 'At least one event is required' });
        }

        // Store in database
        // const webhook = await WebhookEndpoint.create({
        //     url,
        //     events,
        //     secret,
        //     headers,
        //     description,
        //     userId: req.user._id,
        //     createdBy: req.user._id
        // });

        logger.info('Webhook registered', { 
            url, 
            events, 
            userId: req.user?._id 
        });

        res.json({
            success: true,
            message: 'Webhook registered successfully',
            // data: webhook
        });

    } catch (error) {
        logger.error('Failed to register webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get registered webhooks
 */
export const getWebhooks = async (req, res) => {
    try {
        // const webhooks = await WebhookEndpoint.find({
        //     userId: req.user._id,
        //     isDeleted: false
        // }).lean();

        res.json({
            success: true,
            data: [] // webhooks
        });

    } catch (error) {
        logger.error('Failed to get webhooks:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update webhook
 */
export const updateWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // const webhook = await WebhookEndpoint.findByIdAndUpdate(
        //     id,
        //     { $set: updates },
        //     { new: true }
        // );

        logger.info('Webhook updated', { webhookId: id });

        res.json({
            success: true,
            message: 'Webhook updated successfully',
            // data: webhook
        });

    } catch (error) {
        logger.error('Failed to update webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete webhook
 */
export const deleteWebhook = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete
        // await WebhookEndpoint.findByIdAndUpdate(id, {
        //     isDeleted: true,
        //     deletedAt: new Date(),
        //     deletedBy: req.user._id
        // });

        logger.info('Webhook deleted', { webhookId: id });

        res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });

    } catch (error) {
        logger.error('Failed to delete webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ============================================
// WEBHOOK RETRY MECHANISM
// ============================================

/**
 * Retry failed webhooks from queue
 */
export const retryFailedWebhooks = async (req, res) => {
    try {
        // Implement retry logic for queued webhooks
        // const queue = await redis.lrange('webhook:queue', 0, -1);
        // Process queue...

        res.json({
            success: true,
            message: 'Webhook retry initiated'
        });

    } catch (error) {
        logger.error('Failed to retry webhooks:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get webhook delivery history
 */
export const getWebhookHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // const history = await WebhookLog.find({ webhookId: id })
        //     .sort({ createdAt: -1 })
        //     .skip((page - 1) * limit)
        //     .limit(limit);

        res.json({
            success: true,
            data: [] // history
        });

    } catch (error) {
        logger.error('Failed to get webhook history:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// EXPORT
// ============================================

export default webhook;