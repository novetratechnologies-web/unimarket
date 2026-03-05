/* eslint-disable no-template-curly-in-string */
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import juice from 'juice';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// EMAIL TRANSPORTER CONFIGURATION
// ============================================

// Create transporter with your Brevo credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT), // fixed parenthesis
  secure: process.env.EMAIL_SECURE === 'true', // convert string to boolean
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  },
  tls: {
    rejectUnauthorized: false // Only for development
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100
});


// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
  } else {
 
  }
});

// ============================================
// TEMPLATE CACHE
// ============================================

const templateCache = new Map();

/**
 * Load and compile email template
 */
const loadTemplate = async (templateName) => {
  try {
    // Check cache first
    if (templateCache.has(templateName)) {
      return templateCache.get(templateName);
    }

    // Load template file
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
    let templateContent;

    // Check if file exists, otherwise use inline template
    if (fs.existsSync(templatePath)) {
      templateContent = fs.readFileSync(templatePath, 'utf8');
    } else {
      // Use inline template based on name
      templateContent = getInlineTemplate(templateName);
    }

    // Compile template
    const compiledTemplate = Handlebars.compile(templateContent);
    
    // Cache compiled template
    templateCache.set(templateName, compiledTemplate);
    
    return compiledTemplate;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
};

// ============================================
// INLINE TEMPLATES
// ============================================

const getInlineTemplate = (templateName) => {
  const templates = {
    // ========== ORDER TEMPLATES ==========
    'order-confirmation': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Order Confirmation</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .order-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '    .order-item { padding: 10px 0; border-bottom: 1px solid #dee2e6; }',
      '    .order-item:last-child { border-bottom: none; }',
      '    .price { font-weight: bold; color: #28a745; }',
      '    .total { font-size: 18px; font-weight: bold; color: #333; margin-top: 20px; }',
      '    .shipping-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; }',
      '    .tracking-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>Thank You for Your Order!</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Dear {{customerName}},</p>',
      '      <p>Your order has been received and is now being processed. We\'ll notify you when it ships.</p>',
      '      ',
      '      <div class="order-details">',
      '        <h3 style="margin-top: 0;">Order Summary</h3>',
      '        <p><strong>Order Date:</strong> {{formatDate orderDate}}</p>',
      '        <p><strong>Order Total:</strong> ${{formatNumber total}}</p>',
      '        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>',
      '        <p><strong>Payment Status:</strong> <span style="color: {{paymentStatusColor paymentStatus}};">{{paymentStatus}}</span></p>',
      '        ',
      '        <h4 style="margin-bottom: 10px;">Items Ordered:</h4>',
      '        {{#each items}}',
      '        <div class="order-item">',
      '          <div style="display: flex; justify-content: space-between;">',
      '            <span><strong>{{this.quantity}}x</strong> {{this.name}}</span>',
      '            <span class="price">${{formatNumber this.price}}</span>',
      '          </div>',
      '          {{#if this.variant}}',
      '          <small style="color: #6c757d;">{{this.variant}}</small>',
      '          {{/if}}',
      '        </div>',
      '        {{/each}}',
      '        ',
      '        <div style="margin-top: 20px;">',
      '          <div style="display: flex; justify-content: space-between;">',
      '            <span>Subtotal:</span>',
      '            <span>${{formatNumber subtotal}}</span>',
      '          </div>',
      '          <div style="display: flex; justify-content: space-between;">',
      '            <span>Shipping:</span>',
      '            <span>${{formatNumber shippingTotal}}</span>',
      '          </div>',
      '          <div style="display: flex; justify-content: space-between;">',
      '            <span>Tax:</span>',
      '            <span>${{formatNumber taxTotal}}</span>',
      '          </div>',
      '          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px;">',
      '            <span>Total:</span>',
      '            <span class="price">${{formatNumber total}}</span>',
      '          </div>',
      '        </div>',
      '      </div>',
      '      ',
      '      <div class="shipping-info">',
      '        <h4 style="margin-top: 0;">Shipping Address</h4>',
      '        <p style="margin-bottom: 0;">',
      '          {{shippingAddress.firstName}} {{shippingAddress.lastName}}<br>',
      '          {{shippingAddress.addressLine1}}<br>',
      '          {{#if shippingAddress.addressLine2}}{{shippingAddress.addressLine2}}<br>{{/if}}',
      '          {{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.postalCode}}<br>',
      '          {{shippingAddress.country}}',
      '        </p>',
      '        {{#if shippingAddress.phone}}',
      '        <p><strong>Phone:</strong> {{shippingAddress.phone}}</p>',
      '        {{/if}}',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{orderUrl}}" class="button">View Order Details</a>',
      '      </div>',
      '      ',
      '      <p style="margin-top: 30px;">',
      '        Need help? Contact our support team at ',
      '        <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>',
      '      </p>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '      <p style="font-size: 12px; margin-top: 10px;">',
      '        This email was sent to {{customerEmail}}. ',
      '        If you didn\'t place this order, please contact us immediately.',
      '      </p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'payment-confirmation': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Payment Confirmation</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .payment-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '    .success-icon { font-size: 48px; margin-bottom: 20px; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <div class="success-icon">✓</div>',
      '      <h1>Payment Successful!</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Dear {{customerName}},</p>',
      '      <p>Your payment has been successfully processed.</p>',
      '      ',
      '      <div class="payment-details">',
      '        <h3 style="margin-top: 0;">Payment Details</h3>',
      '        <p><strong>Amount Paid:</strong> ${{formatNumber amount}}</p>',
      '        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>',
      '        <p><strong>Transaction ID:</strong> {{transactionId}}</p>',
      '        <p><strong>Payment Date:</strong> {{formatDate paymentDate}}</p>',
      '        <p><strong>Payment Status:</strong> <span style="color: #28a745; font-weight: bold;">Paid</span></p>',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{orderUrl}}" class="button">View Order</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'order-shipped': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Order Shipped</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .tracking-info { background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '    .tracking-number { font-size: 20px; font-weight: bold; color: #007bff; margin: 15px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>Your Order Has Shipped!</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Dear {{customerName}},</p>',
      '      <p>Great news! Your order is on its way.</p>',
      '      ',
      '      <div class="tracking-info">',
      '        <h3 style="margin-top: 0;">Tracking Information</h3>',
      '        <p><strong>Carrier:</strong> {{carrier}}</p>',
      '        <p><strong>Tracking Number:</strong></p>',
      '        <div class="tracking-number">{{trackingNumber}}</div>',
      '        <p><strong>Estimated Delivery:</strong> {{formatDate estimatedDelivery}}</p>',
      '        <p><strong>Shipped Date:</strong> {{formatDate shippedDate}}</p>',
      '        {{#if trackingUrl}}',
      '        <div style="text-align: center; margin-top: 20px;">',
      '          <a href="{{trackingUrl}}" class="button" style="background: #28a745;">Track Package</a>',
      '        </div>',
      '        {{/if}}',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{orderUrl}}" class="button">View Order Details</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'order-delivered': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Order Delivered</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .review-section { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }',
      '    .stars { font-size: 24px; color: #ffc107; margin: 15px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>Order Delivered!</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Dear {{customerName}},</p>',
      '      <p>Your order has been delivered. We hope you love your purchase!</p>',
      '      ',
      '      <div class="review-section">',
      '        <h3 style="margin-top: 0;">Enjoying Your Purchase?</h3>',
      '        <p>Share your experience and help other customers make informed decisions.</p>',
      '        <div class="stars">★★★★★</div>',
      '        <a href="{{reviewUrl}}" class="button">Write a Review</a>',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{orderUrl}}" class="button">View Order Details</a>',
      '      </div>',
      '      ',
      '      <p style="margin-top: 30px; text-align: center;">',
      '        Need assistance? <a href="mailto:{{supportEmail}}">Contact Support</a>',
      '      </p>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'order-cancelled': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Order Cancelled</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .refund-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>Order Cancelled</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Dear {{customerName}},</p>',
      '      <p>Your order has been cancelled as requested.</p>',
      '      ',
      '      {{#if refundAmount}}',
      '      <div class="refund-info">',
      '        <h3 style="margin-top: 0;">Refund Information</h3>',
      '        <p><strong>Refund Amount:</strong> ${{formatNumber refundAmount}}</p>',
      '        <p><strong>Refund Status:</strong> {{refundStatus}}</p>',
      '        <p><strong>Estimated Time:</strong> 5-7 business days</p>',
      '      </div>',
      '      {{/if}}',
      '      ',
      '      <p style="margin-top: 30px;">',
      '        If you have any questions about this cancellation, please contact our support team.',
      '      </p>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{shopUrl}}" class="button">Continue Shopping</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'refund-processed': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Refund Processed</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .refund-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>Refund Processed</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Dear {{customerName}},</p>',
      '      <p>Your refund has been successfully processed.</p>',
      '      ',
      '      <div class="refund-details">',
      '        <h3 style="margin-top: 0;">Refund Details</h3>',
      '        <p><strong>Refund Amount:</strong> ${{formatNumber refundAmount}}</p>',
      '        <p><strong>Reason:</strong> {{reason}}</p>',
      '        <p><strong>Refund Date:</strong> {{formatDate refundDate}}</p>',
      '        <p><strong>Refund ID:</strong> {{refundId}}</p>',
      '        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>',
      '      </div>',
      '      ',
      '      <p style="margin-top: 20px;">',
      '        The refund will appear in your account within 5-10 business days, depending on your bank.',
      '      </p>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{orderUrl}}" class="button">View Order</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    // ========== ADMIN & VENDOR TEMPLATES ==========
    
    'admin-new-order': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>New Order Alert</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }',
      '    .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }',
      '    .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }',
      '    .stat-label { font-size: 12px; color: #6c757d; margin-top: 5px; }',
      '    .order-summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>🛍️ New Order Received!</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{adminName}},</p>',
      '      <p>A new order has been placed on your store.</p>',
      '      ',
      '      <div class="stats-grid">',
      '        <div class="stat-card">',
      '          <div class="stat-value">${{formatNumber orderTotal}}</div>',
      '          <div class="stat-label">Order Total</div>',
      '        </div>',
      '        <div class="stat-card">',
      '          <div class="stat-value">{{itemCount}}</div>',
      '          <div class="stat-label">Items</div>',
      '        </div>',
      '        <div class="stat-card">',
      '          <div class="stat-value">{{vendorCount}}</div>',
      '          <div class="stat-label">Vendors</div>',
      '        </div>',
      '      </div>',
      '      ',
      '      <div class="order-summary">',
      '        <h3 style="margin-top: 0;">Order Summary</h3>',
      '        <p><strong>Customer:</strong> {{customerName}}</p>',
      '        <p><strong>Customer Email:</strong> {{customerEmail}}</p>',
      '        <p><strong>Order Date:</strong> {{formatDate orderDate}}</p>',
      '        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>',
      '        <p><strong>Payment Status:</strong> <span style="color: {{paymentStatusColor paymentStatus}};">{{paymentStatus}}</span></p>',
      '        <p><strong>Shipping Method:</strong> {{shippingMethod}}</p>',
      '        ',
      '        <h4 style="margin-bottom: 10px; margin-top: 20px;">Items Ordered:</h4>',
      '        {{#each items}}',
      '        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">',
      '          <span><strong>{{this.quantity}}x</strong> {{this.name}}</span>',
      '          <span>${{formatNumber this.price}}</span>',
      '        </div>',
      '        {{/each}}',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{orderUrl}}" class="button">View Order Details</a>',
      '        <a href="{{adminDashboardUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Go to Dashboard</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '      <p style="font-size: 12px; margin-top: 10px;">This is an automated alert from your admin dashboard.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'admin-low-stock': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Low Stock Alert</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .product-list { background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '    .product-item { padding: 10px; border-bottom: 1px solid #ffe69c; }',
      '    .product-item:last-child { border-bottom: none; }',
      '    .stock-critical { color: #dc3545; font-weight: bold; }',
      '    .stock-warning { color: #ffc107; font-weight: bold; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>⚠️ Low Stock Alert</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">{{lowStockCount}} Products Need Attention</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{adminName}},</p>',
      '      <p>The following products are running low on stock:</p>',
      '      ',
      '      <div class="product-list">',
      '        <h3 style="margin-top: 0;">Low Stock Products</h3>',
      '        {{#each lowStockProducts}}',
      '        <div class="product-item">',
      '          <div style="display: flex; justify-content: space-between; align-items: center;">',
      '            <div>',
      '              <strong>{{this.name}}</strong><br>',
      '              <small>SKU: {{this.sku}}</small>',
      '            </div>',
      '            <div style="text-align: right;">',
      '              <span class="{{#if this.isCritical}}stock-critical{{else}}stock-warning{{/if}}">',
      '                {{this.quantity}} left',
      '              </span><br>',
      '              <small>Threshold: {{this.threshold}}</small>',
      '            </div>',
      '          </div>',
      '          <div style="margin-top: 10px;">',
      '            <a href="{{this.productUrl}}" style="color: #007bff; text-decoration: none;">Restock Now →</a>',
      '          </div>',
      '        </div>',
      '        {{/each}}',
      '        ',
      '        {{#if outOfStockCount}}',
      '        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ffe69c;">',
      '          <h4 style="color: #dc3545;">Out of Stock Items ({{outOfStockCount}})</h4>',
      '          <p>These products are currently out of stock and need immediate attention.</p>',
      '        </div>',
      '        {{/if}}',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{inventoryUrl}}" class="button">Manage Inventory</a>',
      '        <a href="{{reorderUrl}}" style="display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Create Reorder</a>',
      '      </div>',
      '      ',
      '      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">',
      '        This alert was triggered because stock levels fell below their configured thresholds.',
      '      </p>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'admin-vendor-pending': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Vendor Approval Required</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .vendor-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>🔄 New Vendor Registration</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Pending Approval</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{adminName}},</p>',
      '      <p>A new vendor has registered and is waiting for approval.</p>',
      '      ',
      '      <div class="vendor-details">',
      '        <h3 style="margin-top: 0;">Vendor Information</h3>',
      '        <p><strong>Store Name:</strong> {{storeName}}</p>',
      '        <p><strong>Vendor Name:</strong> {{vendorName}}</p>',
      '        <p><strong>Vendor Email:</strong> {{vendorEmail}}</p>',
      '        <p><strong>Business Type:</strong> {{businessType}}</p>',
      '        <p><strong>Registration Date:</strong> {{formatDate registrationDate}}</p>',
      '        <p><strong>Documents Submitted:</strong> {{documentCount}}</p>',
      '        <p><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">Pending Verification</span></p>',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{approvalUrl}}" class="button">Review & Approve</a>',
      '        <a href="{{pendingVendorsUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">View All Pending</a>',
      '      </div>',
      '      ',
      '      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">',
      '        Vendor accounts require admin approval before they can start selling products.',
      '      </p>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'admin-payout-request': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Payout Request</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #6610f2 0%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #6610f2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .payout-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '    .amount { font-size: 32px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>💰 New Payout Request</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">{{vendorStoreName}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{adminName}},</p>',
      '      <p>A vendor has requested a payout.</p>',
      '      ',
      '      <div class="amount">${{formatNumber payoutAmount}}</div>',
      '      ',
      '      <div class="payout-details">',
      '        <h3 style="margin-top: 0;">Payout Details</h3>',
      '        <p><strong>Payout Number:</strong> {{payoutNumber}}</p>',
      '        <p><strong>Vendor:</strong> {{vendorStoreName}}</p>',
      '        <p><strong>Period:</strong> {{formatDate periodStart}} - {{formatDate periodEnd}}</p>',
      '        <p><strong>Total Orders:</strong> {{orderCount}}</p>',
      '        <p><strong>Total Sales:</strong> ${{formatNumber totalSales}}</p>',
      '        <p><strong>Commission:</strong> ${{formatNumber commission}}</p>',
      '        <p><strong>Net Amount:</strong> ${{formatNumber netAmount}}</p>',
      '        <p><strong>Request Date:</strong> {{formatDate requestDate}}</p>',
      '        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{approvalUrl}}" class="button">Review Payout</a>',
      '        <a href="{{vendorProfileUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">View Vendor</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'admin-product-approval': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Product Approval Required</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #fd7e14; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .product-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '    .product-image { max-width: 100px; margin: 0 auto 15px; display: block; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>📦 New Product Pending Approval</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">{{productName}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{adminName}},</p>',
      '      <p>A vendor has submitted a new product for approval.</p>',
      '      ',
      '      <div class="product-details">',
      '        {{#if productImage}}',
      '        <img src="{{productImage}}" alt="{{productName}}" class="product-image">',
      '        {{/if}}',
      '        ',
      '        <h3 style="margin-top: 0;">Product Information</h3>',
      '        <p><strong>Product Name:</strong> {{productName}}</p>',
      '        <p><strong>SKU:</strong> {{productSku}}</p>',
      '        <p><strong>Price:</strong> ${{formatNumber productPrice}}</p>',
      '        <p><strong>Vendor:</strong> {{vendorStoreName}}</p>',
      '        <p><strong>Category:</strong> {{category}}</p>',
      '        <p><strong>Stock Quantity:</strong> {{stockQuantity}}</p>',
      '        <p><strong>Submission Date:</strong> {{formatDate submissionDate}}</p>',
      '        ',
      '        <h4 style="margin-bottom: 10px;">Product Description:</h4>',
      '        <p style="background: white; padding: 15px; border-radius: 5px;">{{productDescription}}</p>',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{approvalUrl}}" class="button">Review Product</a>',
      '        <a href="{{pendingProductsUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">View All Pending</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'admin-daily-report': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Daily Sales Report</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }',
      '    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }',
      '    .stat-value { font-size: 28px; font-weight: bold; color: #28a745; }',
      '    .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }',
      '    .report-table { width: 100%; border-collapse: collapse; margin: 20px 0; }',
      '    .report-table th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: bold; }',
      '    .report-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }',
      '    .trend-up { color: #28a745; }',
      '    .trend-down { color: #dc3545; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>📊 Daily Sales Report</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">{{reportDate}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{adminName}},</p>',
      '      <p>Here\'s your daily performance summary for {{reportDate}}.</p>',
      '      ',
      '      <div class="stats-grid">',
      '        <div class="stat-card">',
      '          <div class="stat-value">${{formatNumber totalRevenue}}</div>',
      '          <div class="stat-label">Total Revenue</div>',
      '          {{#if revenueChange}}',
      '          <small class="{{#if (gt revenueChange 0)}}trend-up{{else}}trend-down{{/if}}">',
      '            {{revenueChange}}% vs yesterday',
      '          </small>',
      '          {{/if}}',
      '        </div>',
      '        <div class="stat-card">',
      '          <div class="stat-value">{{totalOrders}}</div>',
      '          <div class="stat-label">Total Orders</div>',
      '          {{#if ordersChange}}',
      '          <small class="{{#if (gt ordersChange 0)}}trend-up{{else}}trend-down{{/if}}">',
      '            {{ordersChange}}% vs yesterday',
      '          </small>',
      '          {{/if}}',
      '        </div>',
      '        <div class="stat-card">',
      '          <div class="stat-value">{{newCustomers}}</div>',
      '          <div class="stat-label">New Customers</div>',
      '        </div>',
      '        <div class="stat-card">',
      '          <div class="stat-value">${{formatNumber averageOrderValue}}</div>',
      '          <div class="stat-label">Avg. Order Value</div>',
      '        </div>',
      '      </div>',
      '      ',
      '      <h3>Order Status Breakdown</h3>',
      '      <table class="report-table">',
      '        <tr>',
      '          <th>Status</th>',
      '          <th>Count</th>',
      '          <th>Total</th>',
      '        </tr>',
      '        {{#each orderStatus}}',
      '        <tr>',
      '          <td>{{this.status}}</td>',
      '          <td>{{this.count}}</td>',
      '          <td>${{formatNumber this.total}}</td>',
      '        </tr>',
      '        {{/each}}',
      '      </table>',
      '      ',
      '      <h3>Top Products Today</h3>',
      '      <table class="report-table">',
      '        <tr>',
      '          <th>Product</th>',
      '          <th>Units Sold</th>',
      '          <th>Revenue</th>',
      '        </tr>',
      '        {{#each topProducts}}',
      '        <tr>',
      '          <td>{{this.name}}</td>',
      '          <td>{{this.quantity}}</td>',
      '          <td>${{formatNumber this.revenue}}</td>',
      '        </tr>',
      '        {{/each}}',
      '      </table>',
      '      ',
      '      <h3>Top Vendors Today</h3>',
      '      <table class="report-table">',
      '        <tr>',
      '          <th>Store</th>',
      '          <th>Orders</th>',
      '          <th>Revenue</th>',
      '          <th>Commission</th>',
      '        </tr>',
      '        {{#each topVendors}}',
      '        <tr>',
      '          <td>{{this.storeName}}</td>',
      '          <td>{{this.orders}}</td>',
      '          <td>${{formatNumber this.revenue}}</td>',
      '          <td>${{formatNumber this.commission}}</td>',
      '        </tr>',
      '        {{/each}}',
      '      </table>',
      '      ',
      '      <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin-top: 30px;">',
      '        <h4 style="margin-top: 0;">⚠️ Alerts & Notifications</h4>',
      '        <p><strong>Low Stock Items:</strong> {{lowStockCount}}</p>',
      '        <p><strong>Pending Orders:</strong> {{pendingOrders}}</p>',
      '        <p><strong>Pending Vendor Approvals:</strong> {{pendingVendors}}</p>',
      '        <p><strong>Pending Product Approvals:</strong> {{pendingProducts}}</p>',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{dashboardUrl}}" class="button">View Full Dashboard</a>',
      '        <a href="{{reportsUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">View Reports</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '      <p style="font-size: 12px; margin-top: 10px;">This is your automated daily report. Configure notification preferences in your admin settings.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    // ========== VENDOR TEMPLATES ==========
    
    'vendor-new-order': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>New Order Received</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .order-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>🛍️ New Order!</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">Order #{{orderNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{vendorName}},</p>',
      '      <p>You\'ve received a new order from {{storeName}}!</p>',
      '      ',
      '      <div class="order-details">',
      '        <h3 style="margin-top: 0;">Order Summary</h3>',
      '        <p><strong>Order Number:</strong> {{orderNumber}}</p>',
      '        <p><strong>Order Date:</strong> {{formatDate orderDate}}</p>',
      '        <p><strong>Customer:</strong> {{customerName}}</p>',
      '        <p><strong>Shipping To:</strong> {{shippingAddress}}</p>',
      '        <p><strong>Your Earnings:</strong> ${{formatNumber vendorEarnings}}</p>',
      '        ',
      '        <h4 style="margin-bottom: 10px;">Items Ordered:</h4>',
      '        {{#each items}}',
      '        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">',
      '          <span><strong>{{this.quantity}}x</strong> {{this.name}}</span>',
      '          <span>${{formatNumber this.price}}</span>',
      '        </div>',
      '        {{/each}}',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{orderUrl}}" class="button">Process Order</a>',
      '        <a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Go to Dashboard</a>',
      '      </div>',
      '      ',
      '      <p style="margin-top: 30px; font-size: 14px;">',
      '        Please process this order as soon as possible to ensure timely delivery.',
      '      </p>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'vendor-low-stock': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Low Stock Alert</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>⚠️ Low Stock Alert</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">{{productName}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{vendorName}},</p>',
      '      <p>Your product <strong>{{productName}}</strong> is running low on stock.</p>',
      '      ',
      '      <div style="background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">',
      '        <p><strong>Current Stock:</strong> <span style="font-size: 24px; font-weight: bold; color: #dc3545;">{{currentStock}}</span></p>',
      '        <p><strong>Low Stock Threshold:</strong> {{threshold}}</p>',
      '        <p><strong>SKU:</strong> {{sku}}</p>',
      '        {{#if isCritical}}',
      '        <p style="color: #dc3545; font-weight: bold;">⚠️ Critical Stock Level - Immediate Action Required</p>',
      '        {{/if}}',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{productUrl}}" class="button">Restock Now</a>',
      '        <a href="{{inventoryUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">View Inventory</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n'),

    'vendor-payout-completed': [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>Payout Completed</title>',
      '  <style>',
      '    body { font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }',
      '    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }',
      '    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }',
      '    .content { padding: 30px; }',
      '    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px; }',
      '    .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }',
      '    .amount { font-size: 36px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <div class="container">',
      '    <div class="header">',
      '      <h1>💰 Payout Completed</h1>',
      '      <p style="font-size: 18px; margin-top: 10px;">{{payoutNumber}}</p>',
      '    </div>',
      '    <div class="content">',
      '      <p>Hello {{vendorName}},</p>',
      '      <p>Your payout has been successfully processed!</p>',
      '      ',
      '      <div class="amount">${{formatNumber amount}}</div>',
      '      ',
      '      <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">',
      '        <p><strong>Payout Number:</strong> {{payoutNumber}}</p>',
      '        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>',
      '        <p><strong>Transaction ID:</strong> {{transactionId}}</p>',
      '        <p><strong>Processed Date:</strong> {{formatDate processedDate}}</p>',
      '        <p><strong>Period:</strong> {{formatDate periodStart}} - {{formatDate periodEnd}}</p>',
      '      </div>',
      '      ',
      '      <div style="text-align: center; margin-top: 30px;">',
      '        <a href="{{payoutUrl}}" class="button">View Payout Details</a>',
      '        <a href="{{invoiceUrl}}" style="display: inline-block; padding: 12px 30px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Download Invoice</a>',
      '      </div>',
      '    </div>',
      '    <div class="footer">',
      '      <p>&copy; {{currentYear}} {{storeName}}. All rights reserved.</p>',
      '    </div>',
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n')
  };

  return templates[templateName] || templates['order-confirmation'];
};

// ============================================
// HANDLEBARS HELPERS
// ============================================

Handlebars.registerHelper('formatDate', function(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

Handlebars.registerHelper('formatNumber', function(number) {
  if (!number && number !== 0) return '0.00';
  return number.toFixed(2);
});

Handlebars.registerHelper('formatCurrency', function(amount, currency = 'USD') {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
});

Handlebars.registerHelper('paymentStatusColor', function(status) {
  const colors = {
    'paid': '#28a745',
    'pending': '#ffc107',
    'failed': '#dc3545',
    'refunded': '#6c757d',
    'partially_refunded': '#fd7e14'
  };
  return colors[status] || '#6c757d';
});

Handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

Handlebars.registerHelper('currentYear', function() {
  return new Date().getFullYear();
});

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

/**
 * Send email
 */
export const sendEmail = async ({ 
  to, 
  subject, 
  template, 
  data = {}, 
  attachments = [],
  cc = [],
  bcc = [],
  from = process.env.EMAIL_FROM || 'UniMarket <noreply@unimarket.com>'
}) => {
  try {
    // Load and compile template
    const compiledTemplate = await loadTemplate(template);
    
    // Add global data
    const templateData = {
      ...data,
      storeName: process.env.STORE_NAME || 'UniMarket',
      supportEmail: process.env.EMAIL_SUPPORT || 'support@unimarket.com',
      adminEmail: process.env.EMAIL_ADMIN || 'admin@unimarket.com',
      currentYear: new Date().getFullYear(),
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    };

    // Generate HTML
    let html = compiledTemplate(templateData);
    
    // Inline CSS for better email client compatibility
    html = juice(html);

    // Prepare email options
    const mailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: Array.isArray(cc) ? cc.join(', ') : cc,
      bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc,
      subject,
      html,
      attachments,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      preview: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// ============================================
// ORDER EMAIL FUNCTIONS
// ============================================

/**
 * Send order confirmation to customer
 */
export const sendOrderConfirmation = async (order) => {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) {
    console.warn('No email address found for order:', order.orderNumber);
    return;
  }

  // Fixed: Handle population properly without async/await in map
  const items = [];
  for (const item of order.items) {
    const populated = await item.populate('product', 'name images');
    items.push({
      name: populated.product?.name || 'Product',
      quantity: item.quantity,
      price: item.price,
      variant: item.variant?.options?.map(o => `${o.name}: ${o.value}`).join(', ')
    });
  }

  return sendEmail({
    to: email,
    subject: `Order Confirmation #${order.orderNumber}`,
    template: 'order-confirmation',
    data: {
      customerName: order.customerName,
      customerEmail: email,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      items,
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      taxTotal: order.taxTotal,
      total: order.total,
      paymentMethod: order.paymentMethodName || 'Credit Card',
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order.orderNumber}?email=${encodeURIComponent(email)}`
    }
  });
};

/**
 * Send payment confirmation to customer
 */
export const sendPaymentConfirmation = async (order, payment) => {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  return sendEmail({
    to: email,
    subject: `Payment Confirmed for Order #${order.orderNumber}`,
    template: 'payment-confirmation',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      amount: payment?.amount || order.totalPaid,
      paymentMethod: payment?.method || order.paymentMethodName,
      transactionId: payment?.transactionId || 'N/A',
      paymentDate: payment?.createdAt || new Date(),
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order.orderNumber}?email=${encodeURIComponent(email)}`
    }
  });
};

/**
 * Send order shipped notification to customer
 */
export const sendOrderShipped = async (order, tracking) => {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  return sendEmail({
    to: email,
    subject: `Your Order #${order.orderNumber} Has Shipped!`,
    template: 'order-shipped',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      carrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl,
      estimatedDelivery: tracking.estimatedDelivery,
      shippedDate: tracking.shippedAt || new Date(),
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order.orderNumber}?email=${encodeURIComponent(email)}`
    }
  });
};

/**
 * Send order delivered notification to customer
 */
export const sendOrderDelivered = async (order) => {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  const deliveredAt = order.shippingTracking && 
                      order.shippingTracking[0] && 
                      order.shippingTracking[0].deliveredAt || new Date();

  return sendEmail({
    to: email,
    subject: `Your Order #${order.orderNumber} Has Been Delivered`,
    template: 'order-delivered',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      deliveredAt: deliveredAt,
      reviewUrl: `${process.env.FRONTEND_URL}/products/review?order=${order.orderNumber}`,
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order.orderNumber}?email=${encodeURIComponent(email)}`
    }
  });
};

/**
 * Send order cancelled notification to customer
 */
export const sendOrderCancelled = async (order) => {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  return sendEmail({
    to: email,
    subject: `Order #${order.orderNumber} Has Been Cancelled`,
    template: 'order-cancelled',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      refundAmount: order.totalRefunded > 0 ? order.totalRefunded : null,
      refundStatus: order.totalRefunded > 0 ? 'Processed' : 'Pending',
      shopUrl: process.env.FRONTEND_URL
    }
  });
};

/**
 * Send refund processed notification to customer
 */
export const sendRefundProcessed = async (order, refund) => {
  const email = order.customerEmail || order.guestEmail;
  
  if (!email) return;

  return sendEmail({
    to: email,
    subject: `Refund Processed for Order #${order.orderNumber}`,
    template: 'refund-processed',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      refundAmount: refund.amount,
      reason: refund.reason,
      refundDate: refund.processedAt,
      refundId: refund.refundId || order.orderNumber,
      paymentMethod: order.paymentMethodName,
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order.orderNumber}?email=${encodeURIComponent(email)}`
    }
  });
};

// ============================================
// ADMIN EMAIL FUNCTIONS
// ============================================

/**
 * Send new order alert to admin
 */
export const sendAdminNewOrderAlert = async (order) => {
  const admins = await getAdminEmails();
  
  if (!admins || admins.length === 0) return;

  const items = [];
  for (const item of order.items) {
    const populated = await item.populate('product', 'name');
    items.push({
      name: populated.product?.name || 'Product',
      quantity: item.quantity,
      price: item.price
    });
  }

  return Promise.all(admins.map(adminEmail => 
    sendEmail({
      to: adminEmail,
      subject: `🛍️ New Order #${order.orderNumber} - $${order.total.toFixed(2)}`,
      template: 'admin-new-order',
      data: {
        adminName: adminEmail.split('@')[0],
        orderNumber: order.orderNumber,
        orderTotal: order.total,
        itemCount: order.itemCount || order.items.length,
        vendorCount: order.vendors ? order.vendors.length : 0,
        customerName: order.customerName,
        customerEmail: order.customerEmail || order.guestEmail,
        orderDate: order.orderDate,
        paymentMethod: order.paymentMethodName || 'Credit Card',
        paymentStatus: order.paymentStatus,
        shippingMethod: order.shippingMethodName || 'Standard',
        items,
        orderUrl: `${process.env.ADMIN_URL}/orders/${order._id}`,
        adminDashboardUrl: process.env.ADMIN_URL
      }
    })
  ));
};

/**
 * Send low stock alert to admin
 */
export const sendAdminLowStockAlert = async (lowStockProducts, outOfStockProducts = []) => {
  const admins = await getAdminEmails();
  
  if (!admins || admins.length === 0) return;

  return Promise.all(admins.map(adminEmail =>
    sendEmail({
      to: adminEmail,
      subject: `⚠️ Low Stock Alert - ${lowStockProducts.length} Products Need Attention`,
      template: 'admin-low-stock',
      data: {
        adminName: adminEmail.split('@')[0],
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          threshold: p.lowStockThreshold,
          isCritical: p.quantity === 0,
          productUrl: `${process.env.ADMIN_URL}/products/${p._id}`
        })),
        inventoryUrl: `${process.env.ADMIN_URL}/inventory`,
        reorderUrl: `${process.env.ADMIN_URL}/inventory/reorder`
      }
    })
  ));
};

/**
 * Send vendor pending approval alert to admin
 */
export const sendAdminVendorPendingAlert = async (vendor) => {
  const admins = await getAdminEmails();
  
  if (!admins || admins.length === 0) return;

  return Promise.all(admins.map(adminEmail =>
    sendEmail({
      to: adminEmail,
      subject: `🔄 New Vendor Registration: ${vendor.vendorProfile?.storeName || 'Vendor'}`,
      template: 'admin-vendor-pending',
      data: {
        adminName: adminEmail.split('@')[0],
        storeName: vendor.vendorProfile?.storeName || 'Store',
        vendorName: `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'Vendor',
        vendorEmail: vendor.email,
        businessType: vendor.vendorProfile?.businessType || 'Not specified',
        registrationDate: vendor.createdAt,
        documentCount: vendor.vendorProfile?.verification?.documents?.length || 0,
        approvalUrl: `${process.env.ADMIN_URL}/vendors/${vendor._id}/approve`,
        pendingVendorsUrl: `${process.env.ADMIN_URL}/vendors?status=pending`
      }
    })
  ));
};

/**
 * Send payout request alert to admin
 */
export const sendAdminPayoutRequestAlert = async (payout, vendor) => {
  const admins = await getAdminEmails();
  
  if (!admins || admins.length === 0) return;

  return Promise.all(admins.map(adminEmail =>
    sendEmail({
      to: adminEmail,
      subject: `💰 Payout Request: ${vendor.vendorProfile?.storeName || 'Vendor'} - $${payout.summary.netAmount.toFixed(2)}`,
      template: 'admin-payout-request',
      data: {
        adminName: adminEmail.split('@')[0],
        vendorStoreName: vendor.vendorProfile?.storeName || 'Store',
        payoutNumber: payout.payoutNumber,
        payoutAmount: payout.summary.netAmount,
        periodStart: payout.period.startDate,
        periodEnd: payout.period.endDate,
        orderCount: payout.summary.totalOrders,
        totalSales: payout.summary.totalSales,
        commission: payout.summary.commission.amount,
        netAmount: payout.summary.netAmount,
        requestDate: payout.createdAt,
        paymentMethod: payout.paymentMethod?.type || 'Bank Transfer',
        approvalUrl: `${process.env.ADMIN_URL}/payouts/${payout._id}/approve`,
        vendorProfileUrl: `${process.env.ADMIN_URL}/vendors/${vendor._id}`
      }
    })
  ));
};

/**
 * Send product pending approval alert to admin
 */
export const sendAdminProductPendingAlert = async (product, vendor) => {
  const admins = await getAdminEmails();
  
  if (!admins || admins.length === 0) return;

  return Promise.all(admins.map(adminEmail =>
    sendEmail({
      to: adminEmail,
      subject: `📦 New Product Pending Approval: ${product.name}`,
      template: 'admin-product-approval',
      data: {
        adminName: adminEmail.split('@')[0],
        productName: product.name,
        productSku: product.sku,
        productPrice: product.price,
        productDescription: product.description?.substring(0, 200) + '...',
        productImage: product.images?.[0]?.url,
        vendorStoreName: vendor.vendorProfile?.storeName || 'Vendor',
        category: product.categories?.[0]?.name || 'Uncategorized',
        stockQuantity: product.quantity,
        submissionDate: product.createdAt,
        approvalUrl: `${process.env.ADMIN_URL}/products/${product._id}/approve`,
        pendingProductsUrl: `${process.env.ADMIN_URL}/products?status=pending`
      }
    })
  ));
};

/**
 * Send daily sales report to admin
 */
export const sendAdminDailyReport = async (reportData) => {
  const admins = await getAdminEmails();
  
  if (!admins || admins.length === 0) return;

  const today = new Date();

  return Promise.all(admins.map(adminEmail =>
    sendEmail({
      to: adminEmail,
      subject: `📊 Daily Sales Report - ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      template: 'admin-daily-report',
      data: {
        adminName: adminEmail.split('@')[0],
        reportDate: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        totalRevenue: reportData.totalRevenue || 0,
        revenueChange: reportData.revenueChange,
        totalOrders: reportData.totalOrders || 0,
        ordersChange: reportData.ordersChange,
        newCustomers: reportData.newCustomers || 0,
        averageOrderValue: reportData.averageOrderValue || 0,
        orderStatus: reportData.orderStatus || [],
        topProducts: reportData.topProducts || [],
        topVendors: reportData.topVendors || [],
        lowStockCount: reportData.lowStockCount || 0,
        pendingOrders: reportData.pendingOrders || 0,
        pendingVendors: reportData.pendingVendors || 0,
        pendingProducts: reportData.pendingProducts || 0,
        dashboardUrl: process.env.ADMIN_URL,
        reportsUrl: `${process.env.ADMIN_URL}/reports`
      }
    })
  ));
};

// ============================================
// VENDOR EMAIL FUNCTIONS
// ============================================

/**
 * Send new order alert to vendor
 */
export const sendVendorNewOrderAlert = async (order, vendorData) => {
  if (!vendorData.email) return;

  const OrderItem = (await import('../models/OrderItem.js')).default;
  
  const items = await OrderItem.find({ order: order._id, vendor: vendorData.vendorId })
    .populate('product', 'name');

  return sendEmail({
    to: vendorData.email,
    subject: `🛍️ New Order #${order.orderNumber} - $${vendorData.total.toFixed(2)}`,
    template: 'vendor-new-order',
    data: {
      vendorName: vendorData.firstName || vendorData.storeName,
      storeName: vendorData.storeName,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      customerName: order.customerName,
      shippingAddress: order.shippingAddress ? 
        `${order.shippingAddress.city}, ${order.shippingAddress.state}` : 'N/A',
      vendorEarnings: vendorData.vendorEarnings || vendorData.total,
      items: items.map(item => ({
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.price
      })),
      orderUrl: `${process.env.VENDOR_URL}/orders/${order._id}`,
      dashboardUrl: process.env.VENDOR_URL
    }
  });
};

/**
 * Send low stock alert to vendor
 */
export const sendVendorLowStockAlert = async (vendor, product) => {
  if (!vendor.email) return;

  return sendEmail({
    to: vendor.email,
    subject: `⚠️ Low Stock Alert: ${product.name}`,
    template: 'vendor-low-stock',
    data: {
      vendorName: vendor.firstName || 'Vendor',
      productName: product.name,
      currentStock: product.quantity,
      threshold: product.lowStockThreshold || 5,
      sku: product.sku,
      isCritical: product.quantity === 0,
      productUrl: `${process.env.VENDOR_URL}/products/${product._id}`,
      inventoryUrl: `${process.env.VENDOR_URL}/inventory`
    }
  });
};

/**
 * Send payout completed notification to vendor
 */
export const sendVendorPayoutCompleted = async (payout, vendor) => {
  if (!vendor.email) return;

  return sendEmail({
    to: vendor.email,
    subject: `💰 Payout Completed: $${payout.summary.netAmount.toFixed(2)}`,
    template: 'vendor-payout-completed',
    data: {
      vendorName: vendor.firstName || 'Vendor',
      payoutNumber: payout.payoutNumber,
      amount: payout.summary.netAmount,
      paymentMethod: payout.paymentMethod?.type || 'Bank Transfer',
      transactionId: payout.transaction?.id || 'N/A',
      processedDate: payout.paidAt || new Date(),
      periodStart: payout.period.startDate,
      periodEnd: payout.period.endDate,
      payoutUrl: `${process.env.VENDOR_URL}/payouts/${payout._id}`,
      invoiceUrl: payout.invoice?.url || `${process.env.VENDOR_URL}/payouts/${payout._id}/invoice`
    }
  });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get admin email addresses
 */
const getAdminEmails = async () => {
  try {
    // Try to get from database first
    const AdminVendorModule = await import('../models/AdminVendor.js');
    const AdminVendor = AdminVendorModule.default;
    
    const admins = await AdminVendor.find({
      role: { $in: ['super_admin', 'admin'] },
      status: 'active',
      'notificationPreferences.email.orders': true
    }).select('email');
    
    if (admins && admins.length > 0) {
      return admins.map(a => a.email);
    }
  } catch (error) {
    console.warn('Could not fetch admins from database, using fallback:', error);
  }

  // Fallback to env variable
  const adminEmail = process.env.EMAIL_ADMIN;
  return adminEmail ? [adminEmail] : [];
};

// ============================================
// EXPORT
// ============================================

export default {
  // Core send function
  sendEmail,
  
  // Order emails
  sendOrderConfirmation,
  sendPaymentConfirmation,
  sendOrderShipped,
  sendOrderDelivered,
  sendOrderCancelled,
  sendRefundProcessed,
  
  // Admin emails
  sendAdminNewOrderAlert,
  sendAdminLowStockAlert,
  sendAdminVendorPendingAlert,
  sendAdminPayoutRequestAlert,
  sendAdminProductPendingAlert,
  sendAdminDailyReport,
  
  // Vendor emails
  sendVendorNewOrderAlert,
  sendVendorLowStockAlert,
  sendVendorPayoutCompleted
};