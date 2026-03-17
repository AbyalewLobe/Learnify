import { Request, Response } from 'express';
import { userRepository } from '../repositories/UserRepository';
import { refreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { passwordService } from '../services/PasswordService';
import { tokenService } from '../services/TokenService';
import { redisClient } from '../config/redis';
import { SESService } from '../config/aws';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name, role } = req.body;

    // Check if email already exists
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Hash password
    const password_hash = await passwordService.hash(password);

    // Create user
    const user = await userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      role,
    });

    // Remove password hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
      return;
    }

    // Compare password
    const isPasswordValid = await passwordService.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate tokens
    const tokens = tokenService.generateTokens(user.id, user.email, user.role);

    // Store refresh token hash in database
    const refreshTokenHash = tokenService.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await refreshTokenRepository.create(user.id, refreshTokenHash, expiresAt);

    // Cache user session in Redis (15 minutes)
    await redisClient.setJSON(`session:${user.id}`, {
      userId: user.id,
      email: user.email,
      role: user.role,
    }, 900);

    // Remove password hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    // Validate refresh token
    let payload;
    try {
      payload = tokenService.validateToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Check if token type is refresh
    if (payload.type !== 'refresh') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
      return;
    }

    // Check if refresh token exists and is valid in database
    const refreshTokenHash = tokenService.hashToken(refreshToken);
    const isValid = await refreshTokenRepository.isValid(refreshTokenHash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked or expired',
      });
      return;
    }

    // Generate new tokens (token rotation)
    const newTokens = tokenService.generateTokens(payload.userId, payload.email, payload.role);

    // Revoke old refresh token
    await refreshTokenRepository.revoke(refreshTokenHash);

    // Store new refresh token hash
    const newRefreshTokenHash = tokenService.hashToken(newTokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await refreshTokenRepository.create(payload.userId, newRefreshTokenHash, expiresAt);

    logger.info('Token refreshed successfully', { userId: payload.userId });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn,
        },
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh',
    });
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Revoke refresh token if provided
    if (refreshToken) {
      const refreshTokenHash = tokenService.hashToken(refreshToken);
      await refreshTokenRepository.revoke(refreshTokenHash);
    }

    // Clear user session from Redis
    await redisClient.del(`session:${userId}`);

    logger.info('User logged out successfully', { userId });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
    });
  }
};

/**
 * Request password reset
 * POST /api/v1/auth/password/reset
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await userRepository.findByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
      return;
    }

    // Generate reset token (1 hour expiration)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store reset token in Redis
    await redisClient.setJSON(`password-reset:${resetTokenHash}`, {
      userId: user.id,
      email: user.email,
      expiresAt,
    }, 3600);

    // Send reset email via AWS SES
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      await SESService.sendEmail(
        user.email,
        'Password Reset Request',
        `
          <h2>Password Reset Request</h2>
          <p>Hello ${user.first_name},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        true
      );
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      // Continue anyway to prevent email enumeration
    }

    logger.info('Password reset requested', { userId: user.id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset request',
    });
  }
};

/**
 * Confirm password reset
 * POST /api/v1/auth/password/confirm
 */
export const confirmPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token to look it up
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Get reset token data from Redis
    const resetData = await redisClient.getJSON<{
      userId: string;
      email: string;
      expiresAt: number;
    }>(`password-reset:${resetTokenHash}`);

    if (!resetData) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Check if token has expired
    if (Date.now() > resetData.expiresAt) {
      await redisClient.del(`password-reset:${resetTokenHash}`);
      res.status(400).json({
        success: false,
        message: 'Reset token has expired',
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await passwordService.hash(newPassword);

    // Update user password
    await userRepository.updatePassword(resetData.userId, newPasswordHash);

    // Delete reset token from Redis
    await redisClient.del(`password-reset:${resetTokenHash}`);

    // Revoke all refresh tokens for security
    await refreshTokenRepository.revokeAllForUser(resetData.userId);

    logger.info('Password reset confirmed', { userId: resetData.userId });

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    logger.error('Password reset confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset confirmation',
    });
  }
};
