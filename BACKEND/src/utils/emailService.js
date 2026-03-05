// utils/emailService.js - MODERNIZED WITH BREVO INTEGRATION
import nodemailer from "nodemailer";
import { createLogger, format, transports } from "winston";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// ==================== CONFIGURATION VALIDATION ====================

class EmailConfigValidator {
  static validate() {
    const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {

      return false;
    }
    
    // Validate SMTP key format
    if (process.env.EMAIL_PASS && !process.env.EMAIL_PASS.startsWith('xsmtpsib-')) {
      console.warn('⚠️ EMAIL_PASS should start with "xsmtpsib-" for Brevo SMTP keys');
    }
    
    return true;
  }
  
  static getConfig() {
    return {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      from: process.env.EMAIL_FROM,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM,
      clientUrl: process.env.CLIENT_URL, 
      environment: process.env.NODE_ENV 
    };
  }
}

// ==================== LOGGING SETUP ====================

const emailLogger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'email-service' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `📧 ${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    }),
    new transports.File({ filename: 'logs/email-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/email-combined.log' })
  ],
});

// ==================== TRANSPORTER FACTORY ====================

class TransporterFactory {
  static createTransporter(config) {
    const isConfigValid = EmailConfigValidator.validate();
    const { host, port, secure, auth } = config;
    
    // Development fallback transporter
    if (!isConfigValid || process.env.NODE_ENV === 'test') {
      emailLogger.info('Using development mock transporter');
      return {
        sendMail: async (mailOptions) => {
          emailLogger.debug('Mock email sent', { 
            to: mailOptions.to, 
            subject: mailOptions.subject,
            code: mailOptions.subject?.match(/\d{6}/)?.[0]
          });
          return { 
            messageId: `mock-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            response: '250 Mock email sent',
            accepted: [mailOptions.to]
          };
        },
        verify: () => Promise.resolve(),
        close: () => Promise.resolve()
      };
    }
    
    // Production Brevo SMTP transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // false for port 587 (STARTTLS), true for port 465 (SSL)
      auth,
      // Brevo-specific configuration
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        minVersion: 'TLSv1.2',
        ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384'
      },
      requireTLS: true, // Brevo requires TLS
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      // Timeout settings
      connectionTimeout: 10000,
      socketTimeout: 15000,
      greetingTimeout: 5000,
      // Debug and logging
      debug: process.env.NODE_ENV === 'development',
      logger: false // We use our own logger
    });
    
    // Verify connection on startup
    transporter.verify()
      .then(() => emailLogger.info('SMTP connection verified', { host, port }))
      .catch(error => emailLogger.error('SMTP verification failed', { error: error.message, host, port }));
    
    return transporter;
  }
}

// ==================== EMAIL TEMPLATES ENGINE ====================

class EmailTemplateEngine {
  static templates = {
    VERIFICATION: (data) => {
      const { email, code, firstName, clientUrl } = data;
      return {
        subject: `🔐 Verify Your UniMarket Account: ${code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your UniMarket Account</title>
            ${this.getCommonStyles()}
          </head>
          <body>
            ${this.getHeader('🎓 UniMarket', 'Student Marketplace Portal')}
            <div class="content">
              <h2>Hello ${firstName || 'there'}! 👋</h2>
              <p>Welcome to UniMarket! Here's your verification code:</p>
              
              <div class="verification-code">${code}</div>
              
              <div class="timer">
                ⏰ Expires in 10 minutes
              </div>
              
              ${this.getInfoBox('💡 How to verify:', [
                'Go to the verification page on UniMarket',
                'Enter the 6-digit code above',
                'Click "Verify Account" to complete registration'
              ])}
              
              ${this.getHighlightBox('✨ Pro Tip:', 'Keep this code secure - never share it with anyone!')}
              
              ${this.getWarningBox('⚠️ Security Notice:', [
                'This code is for your eyes only',
                'UniMarket staff will never ask for this code',
                'If you didn\'t request this, please ignore this email'
              ])}
              
              <div class="cta-button">
                <a href="${clientUrl}/verify-email?email=${encodeURIComponent(email)}&code=${code}">
                  Verify Account Now
                </a>
              </div>
            </div>
            ${this.getFooter(email)}
          </body>
          </html>
        `,
        text: `
          Verify Your UniMarket Account
          
          Hello ${firstName || 'there'}!
          
          Your verification code is: ${code}
          
          This code expires in 10 minutes.
          
          Go to ${clientUrl}/verify-email to enter this code.
          
          Security Notice:
          - This code is for your eyes only
          - Never share it with anyone
          - If you didn't request this, please ignore this email
          
          © ${new Date().getFullYear()} UniMarket. All rights reserved.
        `
      };
    },

    PASSWORD_RESET: (data) => {
      const { email, code, firstName, clientUrl } = data;
      return {
        subject: `🔑 Reset Your UniMarket Password: ${code}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - UniMarket</title>
            ${this.getCommonStyles()}
          </head>
          <body>
            ${this.getHeader('🔐 Password Reset', 'UniMarket Student Portal', 'warning')}
            <div class="content">
              <h2>Hi ${firstName || 'there'}!</h2>
              <p>We received a request to reset your password. Use the code below:</p>
              
              <div class="reset-code">${code}</div>
              
              <div class="timer">
                ⏰ Valid for 15 minutes
              </div>
              
              ${this.getInfoBox('📝 How to reset your password:', [
                'Go to the password reset page',
                'Enter the 6-digit code above',
                'Create a new strong password',
                'Click "Reset Password" to complete'
              ])}
              
              <div class="cta-button">
                <a href="${clientUrl}/reset-password?email=${encodeURIComponent(email)}&code=${code}">
                  Reset Password
                </a>
              </div>
            </div>
            ${this.getFooter(email)}
          </body>
          </html>
        `,
        text: `
          Password Reset - UniMarket
          
          Hi ${firstName || 'there'}!
          
          Your password reset code is: ${code}
          
          This code expires in 15 minutes.
          
          Go to ${clientUrl}/reset-password to reset your password.
          
          If you didn't request this, please secure your account immediately.
          
          © ${new Date().getFullYear()} UniMarket Security Team
        `
      };
    },

    WELCOME: (data) => {
      const { email, firstName, clientUrl } = data;
      return {
        subject: `🎉 Welcome to UniMarket, ${firstName || 'Student'}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to UniMarket!</title>
            ${this.getCommonStyles()}
          </head>
          <body>
            ${this.getHeader('🎉 Welcome to UniMarket!', 'Your campus marketplace is now ready', 'success')}
            <div class="content">
              <h2>Hello ${firstName || 'Student'}!</h2>
              <p>Congratulations! Your UniMarket account is now fully activated.</p>
              
              ${this.getFeatureGrid([
                { icon: '🛍️', title: 'Buy & Sell', desc: 'Trade textbooks, electronics & more' },
                { icon: '🎓', title: 'Campus Connect', desc: 'Connect with students on campus' },
                { icon: '🔒', title: 'Secure', desc: 'Verified university students only' },
                { icon: '🚚', title: 'Easy Pickup', desc: 'Meet on campus for safe exchange' }
              ])}
              
              <div class="cta-button">
                <a href="${clientUrl}/dashboard">
                  Start Exploring →
                </a>
              </div>
            </div>
            ${this.getFooter(email)}
          </body>
          </html>
        `,
        text: `
          Welcome to UniMarket!
          
          Hello ${firstName || 'Student'}!
          
          Congratulations! Your UniMarket account is now fully activated.
          
          Start exploring the marketplace for your campus:
          ${clientUrl}/dashboard
          
          Features:
          - Buy & Sell textbooks, electronics & more
          - Connect with students on campus
          - Verified university students only
          - Meet on campus for safe exchange
          
          Need help? Contact our support team.
          
          © ${new Date().getFullYear()} UniMarket
        `
      };
    }
  };

  static getCommonStyles() {
    return `
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; 
          line-height: 1.6; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        .container { 
          max-width: 600px; 
          width: 100%;
          margin: 0 auto;
          background: white; 
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
          padding: 40px 30px; 
          text-align: center; 
          color: white; 
        }
        .header.success { background: linear-gradient(135deg, #009688, #004d40); }
        .header.warning { background: linear-gradient(135deg, #f5576c, #f093fb); }
        .header.info { background: linear-gradient(135deg, #667eea, #764ba2); }
        .content { 
          padding: 40px 30px; 
          text-align: center;
        }
        .verification-code, .reset-code { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 10px;
          margin: 30px 0;
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .timer {
          display: inline-block;
          background: #ff6b6b;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          margin: 15px 0;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .info-box, .warning-box, .highlight-box {
          border-radius: 12px; 
          padding: 20px; 
          margin: 25px 0; 
          text-align: left;
        }
        .info-box {
          background: #e3f2fd;
          border: 2px solid #90caf9;
          color: #1565c0;
        }
        .warning-box {
          background: #fff3cd; 
          border: 2px solid #ffeaa7; 
          color: #856404;
        }
        .highlight-box {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .cta-button a {
          display: inline-block;
          background: linear-gradient(135deg, #009688, #004d40);
          color: white;
          padding: 15px 30px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: bold;
          margin: 20px 0;
          transition: all 0.3s ease;
        }
        .cta-button a:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .feature {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          transition: transform 0.3s ease;
        }
        .feature:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .feature-icon {
          font-size: 30px;
          margin-bottom: 10px;
          display: block;
        }
        .footer { 
          text-align: center; 
          padding: 25px; 
          color: #999; 
          font-size: 13px; 
          background: #fafafa; 
          border-top: 1px solid #eee;
        }
        @media (max-width: 600px) {
          .container { border-radius: 0; }
          .verification-code, .reset-code { font-size: 32px; letter-spacing: 5px; }
          .content { padding: 20px 15px; }
        }
      </style>
    `;
  }

  static getHeader(title, subtitle, type = 'success') {
    return `
      <div class="header ${type}">
        <h1 style="margin:0; font-size: 36px;">${title}</h1>
        <p style="margin:10px 0 0; opacity:0.9;">${subtitle}</p>
      </div>
    `;
  }

  static getInfoBox(title, items) {
    return `
      <div class="info-box">
        <strong style="display:block; margin-bottom:10px;">${title}</strong>
        <ol style="margin:10px 0; padding-left:20px;">
          ${items.map(item => `<li style="margin-bottom:8px;">${item}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  static getWarningBox(title, items) {
    return `
      <div class="warning-box">
        <strong>${title}</strong>
        <ul style="margin:10px 0 0; padding-left:20px;">
          ${items.map(item => `<li style="margin-bottom:5px;">${item}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  static getHighlightBox(title, text) {
    return `
      <div class="highlight-box">
        <strong>${title}</strong> ${text}
      </div>
    `;
  }

  static getFeatureGrid(features) {
    return `
      <div class="feature-grid">
        ${features.map(feature => `
          <div class="feature">
            <span class="feature-icon">${feature.icon}</span>
            <h3 style="margin:10px 0 5px; color:#333;">${feature.title}</h3>
            <p style="margin:0; color:#666; font-size:14px;">${feature.desc}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  static getFooter(email) {
    return `
      <div class="footer">
        <p style="margin:0 0 10px;">
          <strong>© ${new Date().getFullYear()} UniMarket.</strong> All rights reserved.
        </p>
        <p style="margin:0; font-size:12px;">
          This email was sent to <strong>${email}</strong>
        </p>
        <p style="margin:10px 0 0; font-size:12px; opacity:0.7;">
          University Students Marketplace • Connecting Campuses
        </p>
      </div>
    `;
  }
}

// ==================== EMAIL SERVICE CORE ====================

class EmailService {
  constructor() {
    this.config = EmailConfigValidator.getConfig();
    this.transporter = TransporterFactory.createTransporter(this.config);
    this.isProduction = this.config.environment === 'production';
    emailLogger.info('Email service initialized', { 
      environment: this.config.environment,
      host: this.config.host,
      hasAuth: !!this.config.auth.user
    });
  }

  async sendEmail(to, subject, html, text, options = {}) {
    const emailId = crypto.randomBytes(8).toString('hex');
    const startTime = Date.now();
    
    const mailOptions = {
      from: `"UniMarket" <${this.config.from}>`,
      to,
      subject,
      html,
      text,
      replyTo: this.config.replyTo,
      messageId: `<${emailId}@unimarket.com>`,
      ...options
    };

    try {
      emailLogger.debug('Sending email', { 
        emailId, 
        to, 
        subject: subject.substring(0, 50) 
      });

      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      
      emailLogger.info('Email sent successfully', {
        emailId,
        to,
        messageId: info.messageId,
        duration,
        accepted: info.accepted,
        rejected: info.rejected
      });

      return {
        success: true,
        emailId,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      emailLogger.error('Email sending failed', {
        emailId,
        to,
        error: error.message,
        duration,
        responseCode: error.responseCode,
        command: error.command
      });

      // Fallback for development
      if (!this.isProduction) {
        const codeMatch = subject.match(/\d{6}/);
        emailLogger.warn('Development fallback activated', {
          emailId,
          to,
          subject,
          code: codeMatch?.[0],
          reason: error.message
        });

        return {
          success: false,
          emailId,
          message: 'Email failed - running in development mode',
          code: codeMatch?.[0],
          fallback: true,
          timestamp: new Date().toISOString()
        };
      }

      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendVerificationEmail(email, code, firstName = '') {
    const templateData = {
      email,
      code,
      firstName,
      clientUrl: this.config.clientUrl
    };

    const template = EmailTemplateEngine.templates.VERIFICATION(templateData);
    
    return this.sendEmail(
      email,
      template.subject,
      template.html,
      template.text,
      {
        headers: {
          'X-Email-Type': 'verification',
          'X-Verification-Code': code
        }
      }
    );
  }

  async sendPasswordResetEmail(email, code, firstName = '') {
    const templateData = {
      email,
      code,
      firstName,
      clientUrl: this.config.clientUrl
    };

    const template = EmailTemplateEngine.templates.PASSWORD_RESET(templateData);
    
    return this.sendEmail(
      email,
      template.subject,
      template.html,
      template.text,
      {
        headers: {
          'X-Email-Type': 'password-reset',
          'X-Reset-Code': code
        }
      }
    );
  }

  async sendWelcomeEmail(email, firstName = '') {
    const templateData = {
      email,
      firstName,
      clientUrl: this.config.clientUrl
    };

    const template = EmailTemplateEngine.templates.WELCOME(templateData);
    
    return this.sendEmail(
      email,
      template.subject,
      template.html,
      template.text,
      {
        headers: {
          'X-Email-Type': 'welcome'
        }
      }
    );
  }

  async sendAdminAlert(subject, message, level = 'error') {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      emailLogger.warn('No admin email configured for alert', { subject, level });
      return { success: false, message: 'No admin email configured' };
    }

    const html = `
      <div style="font-family: monospace; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h2 style="color: #ff6b6b;">⚠️ Admin Alert: ${subject}</h2>
        <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <pre style="margin: 0; white-space: pre-wrap; font-size: 14px;">${message}</pre>
        </div>
        <p style="color: #666; font-size: 12px;">
          Timestamp: ${new Date().toISOString()}<br>
          Environment: ${this.config.environment}<br>
          Level: ${level}
        </p>
      </div>
    `;

    return this.sendEmail(
      adminEmail,
      `[UniMarket ${level.toUpperCase()}] ${subject}`,
      html,
      `Admin Alert: ${subject}\n\n${message}\n\nTimestamp: ${new Date().toISOString()}\nEnvironment: ${this.config.environment}`
    );
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection verified',
        config: {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          user: this.config.auth.user?.substring(0, 3) + '...'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `SMTP connection failed: ${error.message}`,
        config: {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure
        },
        error: error.message
      };
    }
  }

  async sendTestEmail(to) {
    const testData = {
      email: to,
      code: '123456',
      firstName: 'Test User',
      clientUrl: this.config.clientUrl
    };

    const template = EmailTemplateEngine.templates.VERIFICATION(testData);
    
    const result = await this.sendEmail(
      to,
      template.subject,
      template.html,
      template.text
    );

    return {
      ...result,
      testData: {
        code: '123456',
        email: to,
        environment: this.config.environment
      }
    };
  }

  close() {
    if (this.transporter.close) {
      this.transporter.close();
      emailLogger.info('Email transporter closed');
    }
  }
}

// ==================== INSTANCE & EXPORTS ====================

const emailService = new EmailService();

// Graceful shutdown
process.on('SIGTERM', () => {
  emailLogger.info('Shutting down email service...');
  emailService.close();
});

process.on('SIGINT', () => {
  emailLogger.info('Shutting down email service...');
  emailService.close();
});

// Export singleton instance
export default emailService;

// Export individual functions for backward compatibility
export const sendVerificationEmail = (email, code, firstName) => 
  emailService.sendVerificationEmail(email, code, firstName);

export const sendPasswordResetEmail = (email, code, firstName) => 
  emailService.sendPasswordResetEmail(email, code, firstName);

export const sendWelcomeEmail = (email, firstName) => 
  emailService.sendWelcomeEmail(email, firstName);

export const sendAdminAlert = (subject, message, level) => 
  emailService.sendAdminAlert(subject, message, level);

export const testEmailService = (testEmail) => 
  emailService.sendTestEmail(testEmail);

export const testConnection = () => 
  emailService.testConnection();

// Export the class for testing
export { EmailService, EmailConfigValidator, EmailTemplateEngine };