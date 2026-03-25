import Joi from 'joi';
import { config } from '../config/env';

// User Registration Validation
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(config.security.passwordMinLength)
    .required()
    .messages({
      'string.min': `Password must be at least ${config.security.passwordMinLength} characters long`,
      'any.required': 'Password is required',
    }),
  first_name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'First name cannot be empty',
    'string.max': 'First name cannot exceed 100 characters',
    'any.required': 'First name is required',
  }),
  last_name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Last name cannot be empty',
    'string.max': 'Last name cannot exceed 100 characters',
    'any.required': 'Last name is required',
  }),
  role: Joi.string().valid('student', 'creator', 'admin').required().messages({
    'any.only': 'Role must be one of: student, creator, admin',
    'any.required': 'Role is required',
  }),
});

// User Login Validation
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// Refresh Token Validation
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

// Password Reset Request Validation
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

// Password Reset Confirmation Validation
export const passwordResetConfirmSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: Joi.string()
    .min(config.security.passwordMinLength)
    .required()
    .messages({
      'string.min': `Password must be at least ${config.security.passwordMinLength} characters long`,
      'any.required': 'New password is required',
    }),
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

// Course Creation Validation
export const courseCreationSchema = Joi.object({
  title: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Title cannot be empty',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().min(1).required().messages({
    'string.min': 'Description cannot be empty',
    'any.required': 'Description is required',
  }),
  category: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Category cannot be empty',
    'string.max': 'Category cannot exceed 100 characters',
    'any.required': 'Category is required',
  }),
  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional().messages({
    'any.only': 'Difficulty level must be one of: beginner, intermediate, advanced',
  }),
  price: Joi.number().min(0).precision(2).required().messages({
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),
  discount_price: Joi.number().min(0).precision(2).optional().messages({
    'number.min': 'Discount price cannot be negative',
  }),
  trailer_video_id: Joi.string().uuid().optional().messages({
    'string.uuid': 'Trailer video ID must be a valid UUID',
  }),
  tags: Joi.array()
    .items(
      Joi.string()
        .max(50)
        .pattern(/^[a-zA-Z0-9-]+$/)
    )
    .optional()
    .messages({
      'string.max': 'Each tag cannot exceed 50 characters',
      'string.pattern.base': 'Tags must be alphanumeric with hyphens only',
    }),
});

// Course Update Validation
export const courseUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'Title cannot be empty',
    'string.max': 'Title cannot exceed 255 characters',
  }),
  description: Joi.string().min(1).optional().messages({
    'string.min': 'Description cannot be empty',
  }),
  category: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Category cannot be empty',
    'string.max': 'Category cannot exceed 100 characters',
  }),
  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional().messages({
    'any.only': 'Difficulty level must be one of: beginner, intermediate, advanced',
  }),
  price: Joi.number().min(0).precision(2).optional().messages({
    'number.min': 'Price cannot be negative',
  }),
  discount_price: Joi.number().min(0).precision(2).optional().messages({
    'number.min': 'Discount price cannot be negative',
  }),
  trailer_video_id: Joi.string().uuid().optional().messages({
    'string.uuid': 'Trailer video ID must be a valid UUID',
  }),
  tags: Joi.array()
    .items(
      Joi.string()
        .max(50)
        .pattern(/^[a-zA-Z0-9-]+$/)
    )
    .optional()
    .messages({
      'string.max': 'Each tag cannot exceed 50 characters',
      'string.pattern.base': 'Tags must be alphanumeric with hyphens only',
    }),
});

export const validateCourseCreation = (data: any) => {
  return courseCreationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};

export const validateCourseUpdate = (data: any) => {
  return courseUpdateSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};
