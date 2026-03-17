import Joi from 'joi';
import { config } from '../config/env';

// User Registration Validation
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
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
  first_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name cannot exceed 100 characters',
      'any.required': 'First name is required',
    }),
  last_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name cannot exceed 100 characters',
      'any.required': 'Last name is required',
    }),
  role: Joi.string()
    .valid('student', 'creator', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be one of: student, creator, admin',
      'any.required': 'Role is required',
    }),
});

// User Login Validation
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

// Refresh Token Validation
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required',
    }),
});

// Password Reset Request Validation
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
});

// Password Reset Confirmation Validation
export const passwordResetConfirmSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
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
