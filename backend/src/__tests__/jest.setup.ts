// Jest setup file for global test configuration
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fc from 'fast-check';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Initialize Prisma Client for tests
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Configure fast-check for property-based testing
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test
  verbose: true,
  seed: process.env.PROPERTY_TEST_SEED ? parseInt(process.env.PROPERTY_TEST_SEED) : Date.now(),
});

// Setup database before all tests
beforeAll(async () => {
  try {
    // Connect to Prisma
    await prisma.$connect();

    // Clean all tables (in correct order to respect foreign keys)
    await prisma.refreshToken.deleteMany();
    await prisma.courseTag.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    console.info('Test database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Export prisma instance for use in tests
export { prisma };
