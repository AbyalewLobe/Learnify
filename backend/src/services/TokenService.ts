import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'creator' | 'admin';
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  private privateKey: Buffer;
  private publicKey: Buffer;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    // Load RSA keys
    const privateKeyPath = path.join(__dirname, '../../keys/jwt-private.pem');
    const publicKeyPath = path.join(__dirname, '../../keys/jwt-public.pem');

    try {
      this.privateKey = fs.readFileSync(privateKeyPath);
      this.publicKey = fs.readFileSync(publicKeyPath);
      logger.info('JWT RSA keys loaded successfully');
    } catch (error) {
      logger.error('Failed to load JWT RSA keys:', error);
      throw new Error('JWT keys not found. Please generate RSA key pair.');
    }

    this.accessTokenExpiry = config.jwt.accessExpiresIn;
    this.refreshTokenExpiry = config.jwt.refreshExpiresIn;
  }

  /**
   * Generate access token
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns Access token
   */
  generateAccessToken(userId: string, email: string, role: 'student' | 'creator' | 'admin'): string {
    try {
      const payload: Omit<TokenPayload, 'type'> & { type: string } = {
        userId,
        email,
        role,
        type: 'access',
      };

      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.accessTokenExpiry,
        issuer: 'learnify-api',
        audience: 'learnify-client',
      } as jwt.SignOptions);

      logger.debug('Access token generated', { userId, role });
      return token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns Refresh token
   */
  generateRefreshToken(userId: string, email: string, role: 'student' | 'creator' | 'admin'): string {
    try {
      const payload: Omit<TokenPayload, 'type'> & { type: string } = {
        userId,
        email,
        role,
        type: 'refresh',
      };

      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.refreshTokenExpiry,
        issuer: 'learnify-api',
        audience: 'learnify-client',
      } as jwt.SignOptions);

      logger.debug('Refresh token generated', { userId, role });
      return token;
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw error;
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns Object containing both tokens and expiry time
   */
  generateTokens(userId: string, email: string, role: 'student' | 'creator' | 'admin'): AuthTokens {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId, email, role);

    // Calculate expiry in seconds (15 minutes = 900 seconds)
    const expiresIn = 900;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Validate and decode a token
   * @param token - JWT token to validate
   * @returns Decoded token payload
   */
  validateToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'learnify-api',
        audience: 'learnify-client',
      }) as TokenPayload;

      logger.debug('Token validated successfully', { userId: decoded.userId, type: decoded.type });
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired');
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid token');
        throw new Error('Invalid token');
      } else {
        logger.error('Error validating token:', error);
        throw error;
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param token - JWT token to decode
   * @returns Decoded token payload or null
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Hash a refresh token for storage
   * @param token - Refresh token to hash
   * @returns Hashed token
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Token string or null
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}

// Export singleton instance
export const tokenService = new TokenService();
