import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
} from '../controllers/authController';
import {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.post('/password/reset', validate(passwordResetRequestSchema), requestPasswordReset);
router.post('/password/confirm', validate(passwordResetConfirmSchema), confirmPasswordReset);

// Protected routes (require authentication)
// Note: logout will need authentication middleware which will be implemented in Task 4
router.post('/logout', logout);

export default router;
