import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { UserRepository } from '../repositories/UserRepository';

/**
 * Property-Based Tests for RefreshTokenRepository
 * Validates correctness properties for refresh token repository operations
 */

describe('Property-Based Tests: RefreshTokenRepository', () => {
  let prisma: PrismaClient;
  let refreshTokenRepository: RefreshTokenRepository;
  let userRepository: UserRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    refreshTokenRepository = new RefreshTokenRepository(prisma);
    userRepository = new UserRepository(prisma);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Task 10.8: Property Test for Refresh Token Revocation Permanence
   * Property 13: Refresh Token Revocation Permanence
   * **Validates: Requirements 5.3, 5.4, 5.7**
   *
   * For all refresh tokens, once revoked, findByHash() SHALL return null and
   * isValid() SHALL return false, regardless of expiration date.
   */
  describe('Property 13: Refresh Token Revocation Permanence', () => {
    it('should permanently revoke tokens - findByHash returns null after revocation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.string({ minLength: 32, maxLength: 128 }), // token hash
          fc.integer({ min: 1, max: 365 }), // days until expiration
          async (userData, tokenHash, daysUntilExpiration) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create refresh token with future expiration
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysUntilExpiration);

              await refreshTokenRepository.create(user.id, tokenHash, expiresAt);

              // Verify token can be found before revocation
              const tokenBeforeRevoke = await refreshTokenRepository.findByHash(tokenHash);
              expect(tokenBeforeRevoke).not.toBeNull();
              expect(tokenBeforeRevoke?.token_hash).toBe(tokenHash);
              expect(tokenBeforeRevoke?.revoked_at).toBeNull();

              // Revoke the token
              await refreshTokenRepository.revoke(tokenHash);

              // Verify findByHash returns null after revocation
              const tokenAfterRevoke = await refreshTokenRepository.findByHash(tokenHash);
              expect(tokenAfterRevoke).toBeNull();

              // Verify this is permanent - check again after a delay
              await new Promise(resolve => setTimeout(resolve, 10));
              const tokenStillRevoked = await refreshTokenRepository.findByHash(tokenHash);
              expect(tokenStillRevoked).toBeNull();
            } finally {
              // Clean up after each property test iteration
              await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should permanently revoke tokens - isValid returns false after revocation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.string({ minLength: 32, maxLength: 128 }), // token hash
          fc.integer({ min: 1, max: 365 }), // days until expiration
          async (userData, tokenHash, daysUntilExpiration) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create refresh token with future expiration
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysUntilExpiration);

              await refreshTokenRepository.create(user.id, tokenHash, expiresAt);

              // Verify token is valid before revocation
              const isValidBefore = await refreshTokenRepository.isValid(tokenHash);
              expect(isValidBefore).toBe(true);

              // Revoke the token
              await refreshTokenRepository.revoke(tokenHash);

              // Verify isValid returns false after revocation
              const isValidAfter = await refreshTokenRepository.isValid(tokenHash);
              expect(isValidAfter).toBe(false);

              // Verify this is permanent - check again after a delay
              await new Promise(resolve => setTimeout(resolve, 10));
              const isStillInvalid = await refreshTokenRepository.isValid(tokenHash);
              expect(isStillInvalid).toBe(false);
            } finally {
              // Clean up after each property test iteration
              await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should keep tokens revoked regardless of expiration date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.string({ minLength: 32, maxLength: 128 }), // token hash
          fc.integer({ min: -365, max: 365 }), // days until expiration (can be past or future)
          async (userData, tokenHash, daysUntilExpiration) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create refresh token with any expiration date (past or future)
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysUntilExpiration);

              await refreshTokenRepository.create(user.id, tokenHash, expiresAt);

              // Revoke the token
              await refreshTokenRepository.revoke(tokenHash);

              // Verify token is revoked regardless of expiration
              const tokenAfterRevoke = await refreshTokenRepository.findByHash(tokenHash);
              expect(tokenAfterRevoke).toBeNull();

              const isValidAfterRevoke = await refreshTokenRepository.isValid(tokenHash);
              expect(isValidAfterRevoke).toBe(false);

              // Verify the token exists in database but has revoked_at set
              const revokedToken = await prisma.refreshToken.findFirst({
                where: { token_hash: tokenHash },
              });
              expect(revokedToken).not.toBeNull();
              expect(revokedToken?.revoked_at).not.toBeNull();
              expect(revokedToken?.revoked_at).toBeInstanceOf(Date);
            } finally {
              // Clean up after each property test iteration
              await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow revoked tokens to become valid again', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.string({ minLength: 32, maxLength: 128 }), // token hash
          fc.integer({ min: 1, max: 365 }), // days until expiration
          fc.integer({ min: 2, max: 10 }), // number of revocation attempts
          async (userData, tokenHash, daysUntilExpiration, revocationAttempts) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create refresh token with future expiration
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + daysUntilExpiration);

              await refreshTokenRepository.create(user.id, tokenHash, expiresAt);

              // Revoke the token multiple times
              for (let i = 0; i < revocationAttempts; i++) {
                await refreshTokenRepository.revoke(tokenHash);

                // After each revocation, verify token remains invalid
                const tokenAfterRevoke = await refreshTokenRepository.findByHash(tokenHash);
                expect(tokenAfterRevoke).toBeNull();

                const isValidAfterRevoke = await refreshTokenRepository.isValid(tokenHash);
                expect(isValidAfterRevoke).toBe(false);
              }

              // Final verification - token should still be revoked
              const finalCheck = await refreshTokenRepository.findByHash(tokenHash);
              expect(finalCheck).toBeNull();

              const finalValidCheck = await refreshTokenRepository.isValid(tokenHash);
              expect(finalValidCheck).toBe(false);
            } finally {
              // Clean up after each property test iteration
              await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 10.9: Property Test for Bulk Token Revocation Completeness
   * Property 14: Bulk Token Revocation Completeness
   * **Validates: Requirements 5.5, 5.7**
   *
   * For all users with refresh tokens, revokeAllForUser() SHALL result in all
   * tokens for that user having revoked_at set and isValid() returning false.
   */
  describe('Property 14: Bulk Token Revocation Completeness', () => {
    it('should revoke all tokens for a user - all tokens have revoked_at set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 10 }), // number of tokens to create
          async (userData, tokenCount) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create multiple refresh tokens for the user
              const tokenHashes: string[] = [];
              for (let i = 0; i < tokenCount; i++) {
                const tokenHash = `token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                tokenHashes.push(tokenHash);
              }

              // Verify all tokens are valid before revocation
              for (const tokenHash of tokenHashes) {
                const token = await refreshTokenRepository.findByHash(tokenHash);
                expect(token).not.toBeNull();
                expect(token?.revoked_at).toBeNull();
              }

              // Revoke all tokens for the user
              await refreshTokenRepository.revokeAllForUser(user.id);

              // Verify all tokens have revoked_at set
              const allTokens = await prisma.refreshToken.findMany({
                where: { user_id: user.id },
              });

              expect(allTokens).toHaveLength(tokenCount);
              for (const token of allTokens) {
                expect(token.revoked_at).not.toBeNull();
                expect(token.revoked_at).toBeInstanceOf(Date);
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should revoke all tokens for a user - isValid returns false for all tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 10 }), // number of tokens to create
          async (userData, tokenCount) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create multiple refresh tokens for the user
              const tokenHashes: string[] = [];
              for (let i = 0; i < tokenCount; i++) {
                const tokenHash = `token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                tokenHashes.push(tokenHash);
              }

              // Verify all tokens are valid before revocation
              for (const tokenHash of tokenHashes) {
                const isValid = await refreshTokenRepository.isValid(tokenHash);
                expect(isValid).toBe(true);
              }

              // Revoke all tokens for the user
              await refreshTokenRepository.revokeAllForUser(user.id);

              // Verify isValid returns false for all tokens
              for (const tokenHash of tokenHashes) {
                const isValid = await refreshTokenRepository.isValid(tokenHash);
                expect(isValid).toBe(false);
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should revoke all tokens for a user - findByHash returns null for all tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 10 }), // number of tokens to create
          async (userData, tokenCount) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create multiple refresh tokens for the user
              const tokenHashes: string[] = [];
              for (let i = 0; i < tokenCount; i++) {
                const tokenHash = `token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                tokenHashes.push(tokenHash);
              }

              // Verify all tokens can be found before revocation
              for (const tokenHash of tokenHashes) {
                const token = await refreshTokenRepository.findByHash(tokenHash);
                expect(token).not.toBeNull();
              }

              // Revoke all tokens for the user
              await refreshTokenRepository.revokeAllForUser(user.id);

              // Verify findByHash returns null for all tokens
              for (const tokenHash of tokenHashes) {
                const token = await refreshTokenRepository.findByHash(tokenHash);
                expect(token).toBeNull();
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only revoke tokens for the specified user - other users tokens unaffected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 5 }), // tokens for user 1
          fc.integer({ min: 1, max: 5 }), // tokens for user 2
          async (userData1, userData2, tokenCount1, tokenCount2) => {
            // Ensure different emails
            fc.pre(userData1.email !== userData2.email);

            try {
              // Create two users
              const user1 = await userRepository.create(userData1);
              const user2 = await userRepository.create(userData2);

              // Create tokens for user 1
              const tokenHashes1: string[] = [];
              for (let i = 0; i < tokenCount1; i++) {
                const tokenHash = `token_user1_${user1.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await refreshTokenRepository.create(user1.id, tokenHash, expiresAt);
                tokenHashes1.push(tokenHash);
              }

              // Create tokens for user 2
              const tokenHashes2: string[] = [];
              for (let i = 0; i < tokenCount2; i++) {
                const tokenHash = `token_user2_${user2.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await refreshTokenRepository.create(user2.id, tokenHash, expiresAt);
                tokenHashes2.push(tokenHash);
              }

              // Revoke all tokens for user 1 only
              await refreshTokenRepository.revokeAllForUser(user1.id);

              // Verify all tokens for user 1 are revoked
              for (const tokenHash of tokenHashes1) {
                const isValid = await refreshTokenRepository.isValid(tokenHash);
                expect(isValid).toBe(false);

                const token = await refreshTokenRepository.findByHash(tokenHash);
                expect(token).toBeNull();
              }

              // Verify all tokens for user 2 are still valid
              for (const tokenHash of tokenHashes2) {
                const isValid = await refreshTokenRepository.isValid(tokenHash);
                expect(isValid).toBe(true);

                const token = await refreshTokenRepository.findByHash(tokenHash);
                expect(token).not.toBeNull();
                expect(token?.revoked_at).toBeNull();
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({
                where: {
                  email: {
                    in: [userData1.email, userData2.email],
                  },
                },
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle revokeAllForUser idempotently - multiple calls have same effect', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 10 }), // number of tokens to create
          fc.integer({ min: 2, max: 5 }), // number of revocation calls
          async (userData, tokenCount, revocationCalls) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create multiple refresh tokens for the user
              const tokenHashes: string[] = [];
              for (let i = 0; i < tokenCount; i++) {
                const tokenHash = `token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                tokenHashes.push(tokenHash);
              }

              // Call revokeAllForUser multiple times
              for (let i = 0; i < revocationCalls; i++) {
                await refreshTokenRepository.revokeAllForUser(user.id);
              }

              // Verify all tokens are revoked (same result regardless of number of calls)
              const allTokens = await prisma.refreshToken.findMany({
                where: { user_id: user.id },
              });

              expect(allTokens).toHaveLength(tokenCount);
              for (const token of allTokens) {
                expect(token.revoked_at).not.toBeNull();
                expect(token.revoked_at).toBeInstanceOf(Date);
              }

              // Verify isValid returns false for all tokens
              for (const tokenHash of tokenHashes) {
                const isValid = await refreshTokenRepository.isValid(tokenHash);
                expect(isValid).toBe(false);
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 10.10: Property Test for Expired Token Cleanup Completeness
   * Property 15: Expired Token Cleanup Completeness
   * **Validates: Requirements 5.6**
   *
   * For all refresh tokens, deleteExpired() SHALL delete all tokens where
   * expires_at < now and SHALL NOT delete tokens where expires_at >= now.
   * The method SHALL return the correct count of deleted tokens.
   */
  describe('Property 15: Expired Token Cleanup Completeness', () => {
    it('should delete all expired tokens and return correct count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 10 }), // number of expired tokens
          fc.integer({ min: 1, max: 10 }), // number of valid tokens
          async (userData, expiredCount, validCount) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create expired tokens (expires_at in the past)
              const expiredTokenHashes: string[] = [];
              for (let i = 0; i < expiredCount; i++) {
                const tokenHash = `expired_token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() - (i + 1)); // 1 to expiredCount days ago

                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                expiredTokenHashes.push(tokenHash);
              }

              // Create valid tokens (expires_at in the future)
              const validTokenHashes: string[] = [];
              for (let i = 0; i < validCount; i++) {
                const tokenHash = `valid_token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + (i + 1)); // 1 to validCount days from now

                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                validTokenHashes.push(tokenHash);
              }

              // Verify all tokens exist before cleanup
              const tokensBeforeCleanup = await prisma.refreshToken.findMany({
                where: { user_id: user.id },
              });
              expect(tokensBeforeCleanup).toHaveLength(expiredCount + validCount);

              // Delete expired tokens
              const deletedCount = await refreshTokenRepository.deleteExpired();

              // Verify the correct count was returned
              expect(deletedCount).toBeGreaterThanOrEqual(expiredCount);

              // Verify expired tokens are deleted
              for (const tokenHash of expiredTokenHashes) {
                const token = await prisma.refreshToken.findFirst({
                  where: { token_hash: tokenHash },
                });
                expect(token).toBeNull();
              }

              // Verify valid tokens still exist
              for (const tokenHash of validTokenHashes) {
                const token = await prisma.refreshToken.findFirst({
                  where: { token_hash: tokenHash },
                });
                expect(token).not.toBeNull();
                expect(token?.expires_at.getTime()).toBeGreaterThan(Date.now());
              }

              // Verify total count after cleanup
              const tokensAfterCleanup = await prisma.refreshToken.findMany({
                where: { user_id: user.id },
              });
              expect(tokensAfterCleanup).toHaveLength(validCount);
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete only expired tokens - tokens expiring exactly now are not deleted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 5 }), // number of tokens
          async (userData, tokenCount) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create tokens with various expiration times
              const pastTokenHashes: string[] = [];
              const futureTokenHashes: string[] = [];

              for (let i = 0; i < tokenCount; i++) {
                // Past token (expired)
                const pastTokenHash = `past_token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const pastExpiresAt = new Date();
                pastExpiresAt.setMilliseconds(pastExpiresAt.getMilliseconds() - 1000); // 1 second ago
                await refreshTokenRepository.create(user.id, pastTokenHash, pastExpiresAt);
                pastTokenHashes.push(pastTokenHash);

                // Future token (not expired)
                const futureTokenHash = `future_token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const futureExpiresAt = new Date();
                futureExpiresAt.setMilliseconds(futureExpiresAt.getMilliseconds() + 1000); // 1 second from now
                await refreshTokenRepository.create(user.id, futureTokenHash, futureExpiresAt);
                futureTokenHashes.push(futureTokenHash);
              }

              // Delete expired tokens
              await refreshTokenRepository.deleteExpired();

              // Verify past tokens are deleted
              for (const tokenHash of pastTokenHashes) {
                const token = await prisma.refreshToken.findFirst({
                  where: { token_hash: tokenHash },
                });
                expect(token).toBeNull();
              }

              // Verify future tokens still exist
              for (const tokenHash of futureTokenHashes) {
                const token = await prisma.refreshToken.findFirst({
                  where: { token_hash: tokenHash },
                });
                expect(token).not.toBeNull();
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete expired tokens regardless of revocation status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 2, max: 10 }), // number of expired tokens
          async (userData, expiredCount) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create expired tokens, some revoked and some not
              const expiredTokenHashes: string[] = [];
              for (let i = 0; i < expiredCount; i++) {
                const tokenHash = `expired_token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() - 1); // 1 day ago

                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                expiredTokenHashes.push(tokenHash);

                // Revoke half of the expired tokens
                if (i % 2 === 0) {
                  await refreshTokenRepository.revoke(tokenHash);
                }
              }

              // Verify some tokens are revoked and some are not
              const tokensBeforeCleanup = await prisma.refreshToken.findMany({
                where: { user_id: user.id },
              });
              const revokedCount = tokensBeforeCleanup.filter(t => t.revoked_at !== null).length;
              const notRevokedCount = tokensBeforeCleanup.filter(t => t.revoked_at === null).length;
              expect(revokedCount).toBeGreaterThan(0);
              expect(notRevokedCount).toBeGreaterThan(0);

              // Delete expired tokens
              const deletedCount = await refreshTokenRepository.deleteExpired();

              // Verify all expired tokens are deleted (both revoked and not revoked)
              expect(deletedCount).toBe(expiredCount);

              for (const tokenHash of expiredTokenHashes) {
                const token = await prisma.refreshToken.findFirst({
                  where: { token_hash: tokenHash },
                });
                expect(token).toBeNull();
              }

              // Verify no tokens remain for this user
              const tokensAfterCleanup = await prisma.refreshToken.findMany({
                where: { user_id: user.id },
              });
              expect(tokensAfterCleanup).toHaveLength(0);
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deleteExpired idempotently - multiple calls have same effect', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.integer({ min: 1, max: 10 }), // number of expired tokens
          fc.integer({ min: 1, max: 10 }), // number of valid tokens
          fc.integer({ min: 2, max: 5 }), // number of cleanup calls
          async (userData, expiredCount, validCount, cleanupCalls) => {
            try {
              // Create user
              const user = await userRepository.create(userData);

              // Create expired tokens
              for (let i = 0; i < expiredCount; i++) {
                const tokenHash = `expired_token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() - 1);
                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
              }

              // Create valid tokens
              const validTokenHashes: string[] = [];
              for (let i = 0; i < validCount; i++) {
                const tokenHash = `valid_token_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 1);
                await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                validTokenHashes.push(tokenHash);
              }

              // Call deleteExpired multiple times
              let firstDeleteCount = 0;
              for (let i = 0; i < cleanupCalls; i++) {
                const deletedCount = await refreshTokenRepository.deleteExpired();

                if (i === 0) {
                  // First call should delete expired tokens
                  firstDeleteCount = deletedCount;
                  expect(deletedCount).toBeGreaterThanOrEqual(expiredCount);
                } else {
                  // Subsequent calls should delete 0 tokens (idempotent)
                  expect(deletedCount).toBe(0);
                }
              }

              // Verify only valid tokens remain
              const tokensAfterCleanup = await prisma.refreshToken.findMany({
                where: { user_id: user.id },
              });
              expect(tokensAfterCleanup).toHaveLength(validCount);

              // Verify all remaining tokens are valid (not expired)
              for (const token of tokensAfterCleanup) {
                expect(token.expires_at.getTime()).toBeGreaterThan(Date.now());
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete expired tokens across multiple users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              password_hash: fc.string({ minLength: 60, maxLength: 60 }),
              first_name: fc.string({ minLength: 1, maxLength: 100 }),
              last_name: fc.string({ minLength: 1, maxLength: 100 }),
              role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          fc.integer({ min: 1, max: 5 }), // expired tokens per user
          fc.integer({ min: 1, max: 5 }), // valid tokens per user
          async (usersData, expiredPerUser, validPerUser) => {
            // Ensure unique emails
            const uniqueEmails = new Set(usersData.map(u => u.email));
            fc.pre(uniqueEmails.size === usersData.length);

            try {
              const userIds: string[] = [];
              let totalExpired = 0;
              let totalValid = 0;

              // Create users and tokens
              for (const userData of usersData) {
                const user = await userRepository.create(userData);
                userIds.push(user.id);

                // Create expired tokens
                for (let i = 0; i < expiredPerUser; i++) {
                  const tokenHash = `expired_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() - 1);
                  await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                  totalExpired++;
                }

                // Create valid tokens
                for (let i = 0; i < validPerUser; i++) {
                  const tokenHash = `valid_${user.id}_${i}_${Date.now()}_${Math.random()}`;
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + 1);
                  await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
                  totalValid++;
                }
              }

              // Verify total tokens before cleanup
              const tokensBeforeCleanup = await prisma.refreshToken.findMany({
                where: { user_id: { in: userIds } },
              });
              expect(tokensBeforeCleanup).toHaveLength(totalExpired + totalValid);

              // Delete expired tokens
              const deletedCount = await refreshTokenRepository.deleteExpired();

              // Verify correct count was returned
              expect(deletedCount).toBeGreaterThanOrEqual(totalExpired);

              // Verify only valid tokens remain
              const tokensAfterCleanup = await prisma.refreshToken.findMany({
                where: { user_id: { in: userIds } },
              });
              expect(tokensAfterCleanup).toHaveLength(totalValid);

              // Verify all remaining tokens are not expired
              for (const token of tokensAfterCleanup) {
                expect(token.expires_at.getTime()).toBeGreaterThan(Date.now());
              }
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({
                where: {
                  email: {
                    in: usersData.map(u => u.email),
                  },
                },
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
