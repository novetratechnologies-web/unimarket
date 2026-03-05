// utils/smsService.js

/**
 * Send SMS
 * Placeholder implementation - replace with actual SMS service (Twilio, etc.)
 */
export const sendSMS = async ({ to, message }) => {
  try {
    // In development, just log the SMS
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 [DEV] SMS would be sent:', {
        to,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
      });
      
      return {
        success: true,
        messageId: `dev-sms-${Date.now()}`,
        preview: `SMS to ${to}: ${message.substring(0, 50)}...`
      };
    }

    // TODO: Implement actual SMS service (e.g., Twilio, Africa's Talking, etc.)
    // Example with Twilio:
    /*
    const client = require('twilio')(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: process.env.SMS_FROM,
      to: to
    });
    return { success: true, messageId: result.sid };
    */
    
    // For now, return mock success
    console.warn('⚠️ SMS service not fully implemented');
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      note: 'SMS service placeholder - implement actual service'
    };
  } catch (error) {
    console.error('❌ SMS send error:', error);
    
    // Don't throw in development
    if (process.env.NODE_ENV === 'development') {
      return {
        success: false,
        message: 'SMS failed (development mode)',
        error: error.message
      };
    }
    
    throw error;
  }
};

/**
 * Send verification SMS
 */
export const sendVerificationSMS = async (phone, code) => {
  const message = `Your UniMarket verification code is: ${code}. Valid for 10 minutes.`;
  return sendSMS({ to: phone, message });
};

/**
 * Send order update SMS
 */
export const sendOrderUpdateSMS = async (phone, orderNumber, status) => {
  const message = `Order #${orderNumber} has been ${status}. Track your order at ${process.env.FRONTEND_URL}/orders/${orderNumber}`;
  return sendSMS({ to: phone, message });
};