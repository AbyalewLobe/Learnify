import { PrismaClient } from '@prisma/client';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { UserRepository, CreateUserDTO } from '../repositories/UserRepository';

/**
 * Unit Tests for RefreshTokenRepository
 * Tests specific examples and edge cases for RefreshTokenRepository methods
 *
 * **Validates: Requirements 5.9, 12.1, 12.2, 12.3, 12.4, 12.5**
 */

describe('Unit Tests: RefreshTokenRepository', () => {
  let prisma: PrismaClient;
  let refreshTokenRepository: RefreshTokenRepository;
  let userRepository: UserRepository;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    refreshTokenRepository = new RefreshTokenRepository(prisma);
    userRepository = new UserRepository(prisma);

    // Create a test user for token creation
    const userData: CreateUserDTO = {
      email: 'tokenuser@test.com',
      password_hash: 'hashed_password',
      first_name: 'Token',
      last_name: 'User',
      role: 'student',
    };
    const user = await userRepository.create(userData);
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.refreshToken.deleteMany();
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('create()', () => {
    it('should create a new refresh token with valid data', async () => {
      const tokenHash = 'hashed_token_123';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const token = await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);

      expect(token).toBeDefined();
      expect(token.id).toBeDefined();
      expect(token.user_id).toBe(testUserId);
      expect(token.token_hash).toBe(tokenHash);
      expect(token.expires_at).toEqual(expiresAt);
      expect(token.created_at).toBeInstanceOf(Date);
      expect(token.revoked_at).toBeNull();
    });

    it('should create multiple tokens for the same user', async () => {
      const tokenHash1 = 'hashed_token_1';
      const tokenHash2 = 'hashed_token_2';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const token1 = await refreshTokenRepository.create(testUserId, tokenHash1, expiresAt);
      const token2 = await refreshTokenRepository.create(testUserId, tokenHash2, expiresAt);

      expect(token1.id).not.toBe(token2.id);
      expect(token1.user_id).toBe(testUserId);
      expect(token2.user_id).toBe(testUserId);
      expect(token1.token_hash).toBe(tokenHash1);
      expect(token2.token_hash).toBe(tokenHash2);
    });

    it('should create token with expiration date in the past', async () => {
      const tokenHash = 'expired_token';
      const expiresAt = new Date(Date.now() - 1000); // Already expired

      const token = await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);

      expect(token).toBeDefined();
      expect(token.expires_at).toEqual(expiresAt);
      expect(token.expires_at.getTime()).toBeLessThan(Date.now());
    });
  });

  describe('findByHash()', () => {
    it('should find a valid refresh token by hash', async () => {
      const tokenHash = 'valid_token_hash';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const created = await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);
      const found = await refreshTokenRepository.findByHash(tokenHash);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.token_hash).toBe(tokenHash);
      expect(found?.user_id).toBe(testUserId);
      expect(found?.revoked_at).toBeNull();
    });

    it('should return null for non-existent token hash', async () => {
      const found = await refreshTokenRepository.findByHash('non_existent_hash');

      expect(found).toBeNull();
    });

    it('should return null for revoked token', async () => {
      const tokenHash = 'revoked_token_hash';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);
      await refreshTokenRepository.revoke(tokenHash);

      const found = await refreshTokenRepository.findByHash(tokenHash);

      expect(found).toBeNull();
    });

    it('should find expired but not revoked token', async () => {
      const tokenHash = 'expired_but_not_revoked';
      const expiresAt = new Date(Date.now() - 1000); // Already expired

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);
      const found = await refreshTokenRepository.findByHash(tokenHash);

      // findByHash only checks revoked_at, not expires_at
      expect(found).not.toBeNull();
      expect(found?.token_hash).toBe(tokenHash);
      expect(found?.expires_at.getTime()).toBeLessThan(Date.now());
    });
  });

  describe('revoke()', () => {
    it('should revoke a valid token', async () => {
      const tokenHash = 'token_to_revoke';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);

      // Verify token is valid before revocation
      const beforeRevoke = await refreshTokenRepository.findByHash(tokenHash);
      expect(beforeRevoke).not.toBeNull();

      await refreshTokenRepository.revoke(tokenHash);

      // Verify token is not found after revocation
      const afterRevoke = await refreshTokenRepository.findByHash(tokenHash);
      expect(afterRevoke).toBeNull();

      // Verify revoked_at is set
      const revokedToken = await prisma.refreshToken.findFirst({
        where: { token_hash: tokenHash },
      });
      expect(revokedToken?.revoked_at).toBeInstanceOf(Date);
      expect(revokedToken?.revoked_at).not.toBeNull();
    });

    it('should handle revoking already revoked token', async () => {
      const tokenHash = 'already_revoked';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);
      await refreshTokenRepository.revoke(tokenHash);

      // Get the first revoked_at timestamp
      const firstRevoke = await prisma.refreshToken.findFirst({
        where: { token_hash: tokenHash },
      });
      const firstRevokedAt = firstRevoke?.revoked_at;

      // Small delay to ensure different timestamp if updated
      await new Promise(resolve => setTimeout(resolve, 10));

      // Revoke again
      await refreshTokenRepository.revoke(tokenHash);

      const secondRevoke = await prisma.refreshToken.findFirst({
        where: { token_hash: tokenHash },
      });

      expect(secondRevoke?.revoked_at).toBeInstanceOf(Date);
      // The revoked_at timestamp should be updated
      expect(secondRevoke?.revoked_at?.getTime()).toBeGreaterThanOrEqual(firstRevokedAt!.getTime());
    });

    it('should not throw error when revoking non-existent token', async () => {
      await expect(refreshTokenRepository.revoke('non_existent_token')).resolves.not.toThrow();
    });
  });

  describe('revokeAllForUser()', () => {
    it('should revoke all tokens for a user', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create multiple tokens for the user
      await refreshTokenRepository.create(testUserId, 'token_1', expiresAt);
      await refreshTokenRepository.create(testUserId, 'token_2', expiresAt);
      await refreshTokenRepository.create(testUserId, 'token_3', expiresAt);

      // Verify all tokens are valid
      const token1Before = await refreshTokenRepository.findByHash('token_1');
      const token2Before = await refreshTokenRepository.findByHash('token_2');
      const token3Before = await refreshTokenRepository.findByHash('token_3');
      expect(token1Before).not.toBeNull();
      expect(token2Before).not.toBeNull();
      expect(token3Before).not.toBeNull();

      // Revoke all tokens for the user
      await refreshTokenRepository.revokeAllForUser(testUserId);

      // Verify all tokens are revoked
      const token1After = await refreshTokenRepository.findByHash('token_1');
      const token2After = await refreshTokenRepository.findByHash('token_2');
      const token3After = await refreshTokenRepository.findByHash('token_3');
      expect(token1After).toBeNull();
      expect(token2After).toBeNull();
      expect(token3After).toBeNull();
    });

    it('should only revoke tokens for specified user', async () => {
      // Create another user
      const anotherUser = await userRepository.create({
        email: 'another@test.com',
        password_hash: 'hashed',
        first_name: 'Another',
        last_name: 'User',
        role: 'student',
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create tokens for both users
      await refreshTokenRepository.create(testUserId, 'user1_token', expiresAt);
      await refreshTokenRepository.create(anotherUser.id, 'user2_token', expiresAt);

      // Revoke all tokens for first user
      await refreshTokenRepository.revokeAllForUser(testUserId);

      // Verify first user's token is revoked
      const user1Token = await refreshTokenRepository.findByHash('user1_token');
      expect(user1Token).toBeNull();

      // Verify second user's token is still valid
      const user2Token = await refreshTokenRepository.findByHash('user2_token');
      expect(user2Token).not.toBeNull();
      expect(user2Token?.user_id).toBe(anotherUser.id);
    });

    it('should not revoke already revoked tokens again', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create(testUserId, 'token_1', expiresAt);
      await refreshTokenRepository.create(testUserId, 'token_2', expiresAt);

      // Revoke one token manually
      await refreshTokenRepository.revoke('token_1');

      const firstRevoke = await prisma.refreshToken.findFirst({
        where: { token_hash: 'token_1' },
      });
      const firstRevokedAt = firstRevoke?.revoked_at;

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10));

      // Revoke all tokens for user
      await refreshTokenRepository.revokeAllForUser(testUserId);

      // Check that the already-revoked token's timestamp wasn't updated
      const afterRevokeAll = await prisma.refreshToken.findFirst({
        where: { token_hash: 'token_1' },
      });

      // Since revokeAllForUser only updates tokens where revoked_at is null,
      // the first token's revoked_at should remain unchanged
      expect(afterRevokeAll?.revoked_at?.getTime()).toBe(firstRevokedAt?.getTime());
    });

    it('should handle user with no tokens', async () => {
      const anotherUser = await userRepository.create({
        email: 'notoken@test.com',
        password_hash: 'hashed',
        first_name: 'No',
        last_name: 'Token',
        role: 'student',
      });

      await expect(refreshTokenRepository.revokeAllForUser(anotherUser.id)).resolves.not.toThrow();
    });
  });

  describe('deleteExpired()', () => {
    it('should delete expired tokens', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Create expired and valid tokens
      await refreshTokenRepository.create(testUserId, 'expired_1', expiredDate);
      await refreshTokenRepository.create(testUserId, 'expired_2', expiredDate);
      await refreshTokenRepository.create(testUserId, 'valid_1', validDate);

      const deletedCount = await refreshTokenRepository.deleteExpired();

      expect(deletedCount).toBe(2);

      // Verify expired tokens are deleted
      const allTokens = await prisma.refreshToken.findMany();
      expect(allTokens).toHaveLength(1);
      expect(allTokens[0].token_hash).toBe('valid_1');
    });

    it('should return 0 when no expired tokens exist', async () => {
      const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create(testUserId, 'valid_1', validDate);
      await refreshTokenRepository.create(testUserId, 'valid_2', validDate);

      const deletedCount = await refreshTokenRepository.deleteExpired();

      expect(deletedCount).toBe(0);

      // Verify all tokens still exist
      const allTokens = await prisma.refreshToken.findMany();
      expect(allTokens).toHaveLength(2);
    });

    it('should delete expired tokens regardless of revocation status', async () => {
      const expiredDate = new Date(Date.now() - 1000);

      // Create expired token and revoke it
      await refreshTokenRepository.create(testUserId, 'expired_revoked', expiredDate);
      await refreshTokenRepository.revoke('expired_revoked');

      // Create expired token without revoking
      await refreshTokenRepository.create(testUserId, 'expired_not_revoked', expiredDate);

      const deletedCount = await refreshTokenRepository.deleteExpired();

      expect(deletedCount).toBe(2);

      const allTokens = await prisma.refreshToken.findMany();
      expect(allTokens).toHaveLength(0);
    });

    it('should handle empty database', async () => {
      const deletedCount = await refreshTokenRepository.deleteExpired();

      expect(deletedCount).toBe(0);
    });
  });

  describe('isValid()', () => {
    it('should return true for valid non-expired non-revoked token', async () => {
      const tokenHash = 'valid_token';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);

      const isValid = await refreshTokenRepository.isValid(tokenHash);

      expect(isValid).toBe(true);
    });

    it('should return false for expired token', async () => {
      const tokenHash = 'expired_token';
      const expiresAt = new Date(Date.now() - 1000); // Already expired

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);

      const isValid = await refreshTokenRepository.isValid(tokenHash);

      expect(isValid).toBe(false);
    });

    it('should return false for revoked token', async () => {
      const tokenHash = 'revoked_token';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);
      await refreshTokenRepository.revoke(tokenHash);

      const isValid = await refreshTokenRepository.isValid(tokenHash);

      expect(isValid).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      const isValid = await refreshTokenRepository.isValid('non_existent_token');

      expect(isValid).toBe(false);
    });

    it('should return false for expired and revoked token', async () => {
      const tokenHash = 'expired_and_revoked';
      const expiresAt = new Date(Date.now() - 1000);

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);
      await refreshTokenRepository.revoke(tokenHash);

      const isValid = await refreshTokenRepository.isValid(tokenHash);

      expect(isValid).toBe(false);
    });

    it('should validate token at exact expiration boundary', async () => {
      const tokenHash = 'boundary_token';
      const expiresAt = new Date(Date.now() + 100); // Expires in 100ms

      await refreshTokenRepository.create(testUserId, tokenHash, expiresAt);

      // Should be valid immediately
      const validBefore = await refreshTokenRepository.isValid(tokenHash);
      expect(validBefore).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be invalid after expiration
      const validAfter = await refreshTokenRepository.isValid(tokenHash);
      expect(validAfter).toBe(false);
    });
  });

  describe('Transaction support', () => {
    it('should accept optional PrismaClient for transaction support', async () => {
      const tokenHash = 'transaction_token';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async tx => {
        const txRefreshTokenRepository = new RefreshTokenRepository(tx);
        const token = await txRefreshTokenRepository.create(testUserId, tokenHash, expiresAt);

        expect(token).toBeDefined();
        expect(token.token_hash).toBe(tokenHash);
      });

      // Verify token was created
      const found = await refreshTokenRepository.findByHash(tokenHash);
      expect(found).not.toBeNull();
    });

    it('should rollback transaction on error', async () => {
      const tokenHash = 'rollback_token';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      try {
        await prisma.$transaction(async tx => {
          const txRefreshTokenRepository = new RefreshTokenRepository(tx);
          await txRefreshTokenRepository.create(testUserId, tokenHash, expiresAt);

          // Force an error to trigger rollback
          throw new Error('Intentional error for rollback test');
        });
      } catch (error) {
        // Expected error
      }

      // Verify token was NOT created due to rollback
      const found = await refreshTokenRepository.findByHash(tokenHash);
      expect(found).toBeNull();
    });
  });
});
