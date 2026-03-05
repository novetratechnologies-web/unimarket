import Joi from 'joi';

/**
 * Validate request body against schema
 */



export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: { label: '' }
      }
    });

    if (error) {
      // 🔥 ADD THIS DEBUG LOGGING 🔥
      console.log('\n=== ❌ VALIDATION ERRORS ===');
      error.details.forEach((detail, index) => {
        console.log(`${index + 1}. Field: ${detail.path.join('.')}`);
        console.log(`   Message: ${detail.message}`);
        console.log(`   Value:`, detail.context?.value);
        console.log(`   Type: ${detail.type}`);
        console.log('---');
      });
      console.log('=== END ===\n');

      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        error: 'VALIDATION_ERROR'
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

/**
 * Validate request query parameters against schema
 */
export const validateQuery = (schema) => {
  return validate(schema, 'query');
};

/**
 * Validate request params against schema
 */
export const validateParams = (schema) => {
  return validate(schema, 'params');
};

/**
 * Common validation schemas
 */
export const schemas = {
  // ID parameter
  id: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // Email
  email: Joi.string().email().lowercase().trim(),
  
  // Password
  password: Joi.string().min(8).max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  // Phone
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).message('Invalid phone number format')
};

export default {
  validate,
  validateQuery,
  validateParams,
  schemas
};