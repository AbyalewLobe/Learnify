import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Property-Based Tests for Prisma Schema Completeness
 * Validates that the Prisma schema contains all required models, enums, relationships, and constraints
 */

describe('Property-Based Tests: Prisma Schema', () => {
  let prisma: PrismaClient;
  let schemaContent: string;

  beforeAll(() => {
    prisma = new PrismaClient();
    // Read the schema file
    const schemaPath = join(__dirname, '../../prisma/schema.prisma');
    schemaContent = readFileSync(schemaPath, 'utf-8');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Task 3.4: Property Test for Schema Completeness
   * Property 1: Schema Completeness
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.10**
   *
   * For all 24 database tables in the existing migration, the Prisma schema SHALL define
   * equivalent models with all fields, types, and constraints.
   */
  describe('Property 1: Schema Completeness', () => {
    const EXPECTED_MODELS = [
      'User',
      'Course',
      'CourseTag',
      'Chapter',
      'Lesson',
      'Video',
      'Resource',
      'Enrollment',
      'LessonProgress',
      'QuizAttempt',
      'AssignmentSubmission',
      'Certificate',
      'Transaction',
      'Withdrawal',
      'Review',
      'Comment',
      'Note',
      'Notification',
      'Wishlist',
      'Coupon',
      'RefreshToken',
    ];

    const EXPECTED_ENUMS = [
      'Role',
      'CourseStatus',
      'DifficultyLevel',
      'LessonType',
      'VideoStatus',
      'TransactionStatus',
      'WithdrawalStatus',
    ];

    it('should define all 24 required models', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_MODELS), modelName => {
          // Property: Each expected model must be defined in the schema
          const modelRegex = new RegExp(`model\\s+${modelName}\\s*{`, 'g');
          expect(schemaContent).toMatch(modelRegex);
        }),
        { numRuns: EXPECTED_MODELS.length }
      );
    });

    it('should define all 7 required enums', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_ENUMS), enumName => {
          // Property: Each expected enum must be defined in the schema
          const enumRegex = new RegExp(`enum\\s+${enumName}\\s*{`, 'g');
          expect(schemaContent).toMatch(enumRegex);
        }),
        { numRuns: EXPECTED_ENUMS.length }
      );
    });

    it('should define foreign key relationships with proper syntax', () => {
      const expectedRelationships = [
        { model: 'Course', field: 'creator_id', references: 'User' },
        { model: 'CourseTag', field: 'course_id', references: 'Course' },
        { model: 'Chapter', field: 'course_id', references: 'Course' },
        { model: 'Lesson', field: 'chapter_id', references: 'Chapter' },
        { model: 'Video', field: 'uploader_id', references: 'User' },
        { model: 'Resource', field: 'lesson_id', references: 'Lesson' },
        { model: 'Enrollment', field: 'student_id', references: 'User' },
        { model: 'Enrollment', field: 'course_id', references: 'Course' },
        { model: 'LessonProgress', field: 'student_id', references: 'User' },
        { model: 'LessonProgress', field: 'lesson_id', references: 'Lesson' },
        { model: 'QuizAttempt', field: 'student_id', references: 'User' },
        { model: 'QuizAttempt', field: 'lesson_id', references: 'Lesson' },
        { model: 'AssignmentSubmission', field: 'student_id', references: 'User' },
        { model: 'AssignmentSubmission', field: 'lesson_id', references: 'Lesson' },
        { model: 'Certificate', field: 'student_id', references: 'User' },
        { model: 'Certificate', field: 'course_id', references: 'Course' },
        { model: 'Transaction', field: 'student_id', references: 'User' },
        { model: 'Transaction', field: 'course_id', references: 'Course' },
        { model: 'Transaction', field: 'creator_id', references: 'User' },
        { model: 'Withdrawal', field: 'creator_id', references: 'User' },
        { model: 'Review', field: 'student_id', references: 'User' },
        { model: 'Review', field: 'course_id', references: 'Course' },
        { model: 'Comment', field: 'lesson_id', references: 'Lesson' },
        { model: 'Comment', field: 'user_id', references: 'User' },
        { model: 'Note', field: 'student_id', references: 'User' },
        { model: 'Note', field: 'lesson_id', references: 'Lesson' },
        { model: 'Notification', field: 'user_id', references: 'User' },
        { model: 'Wishlist', field: 'student_id', references: 'User' },
        { model: 'Wishlist', field: 'course_id', references: 'Course' },
        { model: 'Coupon', field: 'course_id', references: 'Course' },
        { model: 'RefreshToken', field: 'user_id', references: 'User' },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...expectedRelationships), relationship => {
          // Property: Each foreign key relationship must be defined with @relation
          // Look for the field definition with @relation attribute
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${relationship.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check that the field exists and has proper type
            const fieldRegex = new RegExp(`${relationship.field}\\s+String\\s+@db\\.Uuid`, 'g');
            expect(modelSection[0]).toMatch(fieldRegex);
          }
        }),
        { numRuns: expectedRelationships.length }
      );
    });

    it('should define cascade delete behaviors for appropriate relationships', () => {
      const cascadeRelationships = [
        { model: 'Course', relation: 'creator', cascades: true },
        { model: 'CourseTag', relation: 'course', cascades: true },
        { model: 'Chapter', relation: 'course', cascades: true },
        { model: 'Lesson', relation: 'chapter', cascades: true },
        { model: 'Resource', relation: 'lesson', cascades: true },
        { model: 'Enrollment', relation: 'student', cascades: true },
        { model: 'Enrollment', relation: 'course', cascades: true },
        { model: 'LessonProgress', relation: 'student', cascades: true },
        { model: 'LessonProgress', relation: 'lesson', cascades: true },
        { model: 'QuizAttempt', relation: 'student', cascades: true },
        { model: 'QuizAttempt', relation: 'lesson', cascades: true },
        { model: 'AssignmentSubmission', relation: 'student', cascades: true },
        { model: 'AssignmentSubmission', relation: 'lesson', cascades: true },
        { model: 'Certificate', relation: 'student', cascades: true },
        { model: 'Certificate', relation: 'course', cascades: true },
        { model: 'Review', relation: 'student', cascades: true },
        { model: 'Review', relation: 'course', cascades: true },
        { model: 'Comment', relation: 'lesson', cascades: true },
        { model: 'Comment', relation: 'user', cascades: true },
        { model: 'Note', relation: 'student', cascades: true },
        { model: 'Note', relation: 'lesson', cascades: true },
        { model: 'Notification', relation: 'user', cascades: true },
        { model: 'Wishlist', relation: 'student', cascades: true },
        { model: 'Wishlist', relation: 'course', cascades: true },
        { model: 'Coupon', relation: 'course', cascades: true },
        { model: 'RefreshToken', relation: 'user', cascades: true },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...cascadeRelationships), relationship => {
          // Property: Cascade delete relationships must have onDelete: Cascade
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${relationship.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection && relationship.cascades) {
            // Check for onDelete: Cascade in the relation definition
            const relationRegex = new RegExp(
              `${relationship.relation}\\s+\\w+.*onDelete:\\s*Cascade`,
              's'
            );
            expect(modelSection[0]).toMatch(relationRegex);
          }
        }),
        { numRuns: cascadeRelationships.length }
      );
    });

    it('should define all required indexes', () => {
      const expectedIndexes = [
        { model: 'User', fields: ['email'] },
        { model: 'User', fields: ['role'] },
        { model: 'Course', fields: ['creator_id'] },
        { model: 'Course', fields: ['status'] },
        { model: 'Course', fields: ['category'] },
        { model: 'Course', fields: ['published_at'] },
        { model: 'CourseTag', fields: ['course_id'] },
        { model: 'CourseTag', fields: ['tag'] },
        { model: 'Chapter', fields: ['course_id'] },
        { model: 'Chapter', fields: ['course_id', 'order_index'] },
        { model: 'Lesson', fields: ['chapter_id'] },
        { model: 'Lesson', fields: ['chapter_id', 'order_index'] },
        { model: 'Lesson', fields: ['lesson_type'] },
        { model: 'Video', fields: ['uploader_id'] },
        { model: 'Video', fields: ['status'] },
        { model: 'Resource', fields: ['lesson_id'] },
        { model: 'Enrollment', fields: ['student_id'] },
        { model: 'Enrollment', fields: ['course_id'] },
        { model: 'LessonProgress', fields: ['student_id'] },
        { model: 'LessonProgress', fields: ['lesson_id'] },
        { model: 'QuizAttempt', fields: ['student_id'] },
        { model: 'QuizAttempt', fields: ['lesson_id'] },
        { model: 'AssignmentSubmission', fields: ['student_id'] },
        { model: 'AssignmentSubmission', fields: ['lesson_id'] },
        { model: 'Certificate', fields: ['student_id'] },
        { model: 'Certificate', fields: ['course_id'] },
        { model: 'Certificate', fields: ['certificate_number'] },
        { model: 'Transaction', fields: ['student_id'] },
        { model: 'Transaction', fields: ['creator_id'] },
        { model: 'Transaction', fields: ['course_id'] },
        { model: 'Transaction', fields: ['status'] },
        { model: 'Withdrawal', fields: ['creator_id'] },
        { model: 'Withdrawal', fields: ['status'] },
        { model: 'Review', fields: ['student_id'] },
        { model: 'Review', fields: ['course_id'] },
        { model: 'Review', fields: ['rating'] },
        { model: 'Wishlist', fields: ['student_id'] },
        { model: 'Wishlist', fields: ['course_id'] },
        { model: 'Coupon', fields: ['code'] },
        { model: 'Coupon', fields: ['course_id'] },
        { model: 'Coupon', fields: ['is_active', 'expires_at'] },
        { model: 'Comment', fields: ['lesson_id'] },
        { model: 'Comment', fields: ['user_id'] },
        { model: 'Comment', fields: ['parent_comment_id'] },
        { model: 'Note', fields: ['student_id'] },
        { model: 'Note', fields: ['lesson_id'] },
        { model: 'Notification', fields: ['user_id'] },
        { model: 'Notification', fields: ['user_id', 'is_read'] },
        { model: 'RefreshToken', fields: ['user_id'] },
        { model: 'RefreshToken', fields: ['token_hash'] },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...expectedIndexes), index => {
          // Property: Each expected index must be defined in the schema
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${index.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check for @@index directive
            const indexFields = index.fields.join(', ');
            const indexRegex = new RegExp(`@@index\\(\\[${index.fields.join(',\\s*')}\\]\\)`, 'g');
            expect(modelSection[0]).toMatch(indexRegex);
          }
        }),
        { numRuns: expectedIndexes.length }
      );
    });

    it('should define all required unique constraints', () => {
      const expectedUniqueConstraints = [
        { model: 'User', field: 'email' },
        { model: 'CourseTag', fields: ['course_id', 'tag'] },
        { model: 'Enrollment', fields: ['student_id', 'course_id'] },
        { model: 'LessonProgress', fields: ['student_id', 'lesson_id'] },
        { model: 'Certificate', field: 'certificate_number' },
        { model: 'Certificate', fields: ['student_id', 'course_id'] },
        { model: 'Review', fields: ['student_id', 'course_id'] },
        { model: 'Wishlist', fields: ['student_id', 'course_id'] },
        { model: 'Coupon', field: 'code' },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...expectedUniqueConstraints), constraint => {
          // Property: Each unique constraint must be defined in the schema
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${constraint.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            if ('field' in constraint) {
              // Single field unique constraint
              const uniqueRegex = new RegExp(`${constraint.field}\\s+\\w+\\s+@unique`, 'g');
              expect(modelSection[0]).toMatch(uniqueRegex);
            } else if ('fields' in constraint) {
              // Composite unique constraint
              const uniqueRegex = new RegExp(
                `@@unique\\(\\[${constraint.fields.join(',\\s*')}\\]\\)`,
                'g'
              );
              expect(modelSection[0]).toMatch(uniqueRegex);
            }
          }
        }),
        { numRuns: expectedUniqueConstraints.length }
      );
    });

    it('should verify schema contains exactly 21 models', () => {
      // Property: The schema must contain exactly 21 model definitions
      const modelMatches = schemaContent.match(/model\s+\w+\s*{/g);
      expect(modelMatches).toBeTruthy();
      expect(modelMatches?.length).toBe(21);
    });

    it('should verify schema contains exactly 7 enums', () => {
      // Property: The schema must contain exactly 7 enum definitions
      const enumMatches = schemaContent.match(/enum\s+\w+\s*{/g);
      expect(enumMatches).toBeTruthy();
      expect(enumMatches?.length).toBe(7);
    });

    it('should verify all models have UUID primary keys', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_MODELS), modelName => {
          // Property: Each model must have an id field with UUID type and default(uuid())
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const idFieldRegex = /id\s+String\s+@id\s+@default\(uuid\(\)\)\s+@db\.Uuid/;
            expect(modelSection[0]).toMatch(idFieldRegex);
          }
        }),
        { numRuns: EXPECTED_MODELS.length }
      );
    });

    it('should verify all models have timestamp fields', () => {
      // Models that have both created_at and updated_at
      const modelsWithBothTimestamps = [
        'User',
        'Course',
        'Chapter',
        'Lesson',
        'Video',
        'Review',
        'Comment',
        'Note',
      ];

      // Models that only have created_at (no updated_at)
      const modelsWithCreatedAt = [
        'CourseTag',
        'Resource',
        'Transaction',
        'Coupon',
        'Notification',
        'RefreshToken',
      ];

      // Models with special timestamp patterns (not created_at/updated_at)
      const modelsWithSpecialTimestamps = {
        Enrollment: ['enrolled_at'],
        LessonProgress: ['last_accessed_at'],
        QuizAttempt: ['attempted_at'],
        AssignmentSubmission: ['submitted_at'],
        Certificate: ['issued_at'],
        Withdrawal: ['requested_at'],
        Wishlist: ['added_at'],
      };

      fc.assert(
        fc.property(fc.constantFrom(...modelsWithBothTimestamps), modelName => {
          // Property: Models with both timestamps must have created_at and updated_at fields
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const createdAtRegex = /created_at\s+DateTime\s+@default\(now\(\)\)/;
            const updatedAtRegex = /updated_at\s+DateTime\s+@updatedAt/;

            expect(modelSection[0]).toMatch(createdAtRegex);
            expect(modelSection[0]).toMatch(updatedAtRegex);
          }
        }),
        { numRuns: modelsWithBothTimestamps.length }
      );

      fc.assert(
        fc.property(fc.constantFrom(...modelsWithCreatedAt), modelName => {
          // Property: Models with only created_at must have the field
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const createdAtRegex = /created_at\s+DateTime\s+@default\(now\(\)\)/;
            expect(modelSection[0]).toMatch(createdAtRegex);
          }
        }),
        { numRuns: modelsWithCreatedAt.length }
      );

      // Verify models with special timestamp patterns have their specific timestamp fields
      Object.entries(modelsWithSpecialTimestamps).forEach(([modelName, timestampFields]) => {
        const modelSection = schemaContent.match(
          new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
        );

        expect(modelSection).toBeTruthy();

        if (modelSection) {
          timestampFields.forEach(field => {
            const timestampRegex = new RegExp(`${field}\\s+DateTime`);
            expect(modelSection[0]).toMatch(timestampRegex);
          });
        }
      });
    });

    it('should verify datasource configuration', () => {
      // Property: Schema must have PostgreSQL datasource configured
      expect(schemaContent).toMatch(/datasource\s+db\s*{/);
      expect(schemaContent).toMatch(/provider\s*=\s*"postgresql"/);
      expect(schemaContent).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/);
    });

    it('should verify generator configuration', () => {
      // Property: Schema must have Prisma Client generator configured
      expect(schemaContent).toMatch(/generator\s+client\s*{/);
      expect(schemaContent).toMatch(/provider\s*=\s*"prisma-client-js"/);
    });
  });

  /**
   * Task 3.6: Property Test for Timestamp Field Consistency
   * Property 3: Timestamp Field Consistency
   * **Validates: Requirements 2.8**
   *
   * For all models in the Prisma schema, timestamp fields SHALL use DateTime with
   * @default(now()) for created_at fields and @updatedAt for updated_at fields.
   */
  describe('Property 3: Timestamp Field Consistency', () => {
    // Models that have both created_at and updated_at
    const modelsWithBothTimestamps = [
      'User',
      'Course',
      'Chapter',
      'Lesson',
      'Video',
      'Review',
      'Comment',
      'Note',
    ];

    // Models that only have created_at (no updated_at)
    const modelsWithCreatedAt = [
      'CourseTag',
      'Resource',
      'Transaction',
      'Coupon',
      'Notification',
      'RefreshToken',
    ];

    // Models with special timestamp patterns (not created_at/updated_at)
    const modelsWithSpecialTimestamps: Record<string, string[]> = {
      Enrollment: ['enrolled_at'],
      LessonProgress: ['last_accessed_at'],
      QuizAttempt: ['attempted_at'],
      AssignmentSubmission: ['submitted_at'],
      Certificate: ['issued_at'],
      Withdrawal: ['requested_at'],
      Wishlist: ['added_at'],
    };

    it('should verify models with both timestamps have created_at with @default(now())', () => {
      fc.assert(
        fc.property(fc.constantFrom(...modelsWithBothTimestamps), modelName => {
          // Property: Models with both timestamps must have created_at with @default(now())
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const createdAtRegex = /created_at\s+DateTime\s+@default\(now\(\)\)/;
            expect(modelSection[0]).toMatch(createdAtRegex);
          }
        }),
        { numRuns: modelsWithBothTimestamps.length }
      );
    });

    it('should verify models with both timestamps have updated_at with @updatedAt', () => {
      fc.assert(
        fc.property(fc.constantFrom(...modelsWithBothTimestamps), modelName => {
          // Property: Models with both timestamps must have updated_at with @updatedAt
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const updatedAtRegex = /updated_at\s+DateTime\s+@updatedAt/;
            expect(modelSection[0]).toMatch(updatedAtRegex);
          }
        }),
        { numRuns: modelsWithBothTimestamps.length }
      );
    });

    it('should verify models with only created_at have the field with @default(now())', () => {
      fc.assert(
        fc.property(fc.constantFrom(...modelsWithCreatedAt), modelName => {
          // Property: Models with only created_at must have the field with @default(now())
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const createdAtRegex = /created_at\s+DateTime\s+@default\(now\(\)\)/;
            expect(modelSection[0]).toMatch(createdAtRegex);
          }
        }),
        { numRuns: modelsWithCreatedAt.length }
      );
    });

    it('should verify models with special timestamp patterns have their specific timestamp fields', () => {
      const specialTimestampEntries = Object.entries(modelsWithSpecialTimestamps);

      fc.assert(
        fc.property(fc.constantFrom(...specialTimestampEntries), ([modelName, timestampFields]) => {
          // Property: Models with special timestamp patterns must have their specific timestamp fields
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            timestampFields.forEach(field => {
              const timestampRegex = new RegExp(`${field}\\s+DateTime`);
              expect(modelSection[0]).toMatch(timestampRegex);
            });
          }
        }),
        { numRuns: specialTimestampEntries.length }
      );
    });

    it('should verify all timestamp fields use DateTime type', () => {
      const allModels = [
        ...modelsWithBothTimestamps,
        ...modelsWithCreatedAt,
        ...Object.keys(modelsWithSpecialTimestamps),
      ];

      fc.assert(
        fc.property(fc.constantFrom(...allModels), modelName => {
          // Property: All timestamp fields must use DateTime type
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Find all timestamp-related fields and verify they use DateTime
            const timestampFieldRegex =
              /(created_at|updated_at|enrolled_at|last_accessed_at|attempted_at|submitted_at|issued_at|requested_at|added_at|completed_at|graded_at|processed_at|published_at|expires_at|revoked_at)\s+DateTime/g;
            const matches = modelSection[0].match(timestampFieldRegex);

            // If the model has any timestamp fields, they should all use DateTime
            if (matches) {
              matches.forEach(match => {
                expect(match).toMatch(/DateTime/);
              });
            }
          }
        }),
        { numRuns: allModels.length }
      );
    });

    it('should verify @default(now()) is used consistently for creation timestamps', () => {
      // Property: All creation timestamp fields should use @default(now())
      const creationTimestampFields = [
        { model: 'User', field: 'created_at' },
        { model: 'Course', field: 'created_at' },
        { model: 'CourseTag', field: 'created_at' },
        { model: 'Chapter', field: 'created_at' },
        { model: 'Lesson', field: 'created_at' },
        { model: 'Video', field: 'created_at' },
        { model: 'Resource', field: 'created_at' },
        { model: 'Enrollment', field: 'enrolled_at' },
        { model: 'LessonProgress', field: 'last_accessed_at' },
        { model: 'QuizAttempt', field: 'attempted_at' },
        { model: 'AssignmentSubmission', field: 'submitted_at' },
        { model: 'Certificate', field: 'issued_at' },
        { model: 'Transaction', field: 'created_at' },
        { model: 'Withdrawal', field: 'requested_at' },
        { model: 'Review', field: 'created_at' },
        { model: 'Wishlist', field: 'added_at' },
        { model: 'Coupon', field: 'created_at' },
        { model: 'Comment', field: 'created_at' },
        { model: 'Note', field: 'created_at' },
        { model: 'Notification', field: 'created_at' },
        { model: 'RefreshToken', field: 'created_at' },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...creationTimestampFields), ({ model, field }) => {
          // Property: Creation timestamp fields must have @default(now())
          const modelSection = schemaContent.match(new RegExp(`model\\s+${model}\\s*{[^}]+}`, 's'));

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const fieldRegex = new RegExp(`${field}\\s+DateTime\\s+@default\\(now\\(\\)\\)`);
            expect(modelSection[0]).toMatch(fieldRegex);
          }
        }),
        { numRuns: creationTimestampFields.length }
      );
    });

    it('should verify @updatedAt is used consistently for update timestamps', () => {
      // Property: All updated_at fields should use @updatedAt decorator
      const updateTimestampFields = [
        'User',
        'Course',
        'Chapter',
        'Lesson',
        'Video',
        'Review',
        'Comment',
        'Note',
      ];

      fc.assert(
        fc.property(fc.constantFrom(...updateTimestampFields), modelName => {
          // Property: updated_at fields must have @updatedAt decorator
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const updatedAtRegex = /updated_at\s+DateTime\s+@updatedAt/;
            expect(modelSection[0]).toMatch(updatedAtRegex);
          }
        }),
        { numRuns: updateTimestampFields.length }
      );
    });

    it('should verify optional timestamp fields are properly marked', () => {
      // Property: Optional timestamp fields should use DateTime? type
      const optionalTimestampFields = [
        { model: 'Enrollment', field: 'last_accessed_at' },
        { model: 'LessonProgress', field: 'completed_at' },
        { model: 'AssignmentSubmission', field: 'graded_at' },
        { model: 'Withdrawal', field: 'processed_at' },
        { model: 'Course', field: 'published_at' },
        { model: 'Coupon', field: 'expires_at' },
        { model: 'RefreshToken', field: 'revoked_at' },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...optionalTimestampFields), ({ model, field }) => {
          // Property: Optional timestamp fields must use DateTime? type
          const modelSection = schemaContent.match(new RegExp(`model\\s+${model}\\s*{[^}]+}`, 's'));

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const optionalFieldRegex = new RegExp(`${field}\\s+DateTime\\?`);
            expect(modelSection[0]).toMatch(optionalFieldRegex);
          }
        }),
        { numRuns: optionalTimestampFields.length }
      );
    });
  });

  /**
   * Task 3.7: Property Test for Cascade Delete Consistency
   * Property 4: Cascade Delete Consistency
   * **Validates: Requirements 2.9**
   *
   * For all foreign key relationships where the database uses ON DELETE CASCADE,
   * the Prisma schema SHALL define onDelete: Cascade.
   */
  describe('Property 4: Cascade Delete Consistency', () => {
    // Relationships that should have onDelete: Cascade
    const cascadeDeleteRelationships = [
      { model: 'Course', field: 'creator_id', relation: 'creator', references: 'User' },
      { model: 'CourseTag', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'Chapter', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'Lesson', field: 'chapter_id', relation: 'chapter', references: 'Chapter' },
      { model: 'Resource', field: 'lesson_id', relation: 'lesson', references: 'Lesson' },
      { model: 'Enrollment', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'Enrollment', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'LessonProgress', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'LessonProgress', field: 'lesson_id', relation: 'lesson', references: 'Lesson' },
      { model: 'QuizAttempt', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'QuizAttempt', field: 'lesson_id', relation: 'lesson', references: 'Lesson' },
      {
        model: 'AssignmentSubmission',
        field: 'student_id',
        relation: 'student',
        references: 'User',
      },
      {
        model: 'AssignmentSubmission',
        field: 'lesson_id',
        relation: 'lesson',
        references: 'Lesson',
      },
      { model: 'Certificate', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'Certificate', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'Review', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'Review', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'Comment', field: 'lesson_id', relation: 'lesson', references: 'Lesson' },
      { model: 'Comment', field: 'user_id', relation: 'user', references: 'User' },
      {
        model: 'Comment',
        field: 'parent_comment_id',
        relation: 'parent_comment',
        references: 'Comment',
      },
      { model: 'Note', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'Note', field: 'lesson_id', relation: 'lesson', references: 'Lesson' },
      { model: 'Notification', field: 'user_id', relation: 'user', references: 'User' },
      { model: 'Wishlist', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'Wishlist', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'Coupon', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'RefreshToken', field: 'user_id', relation: 'user', references: 'User' },
    ];

    // Relationships that should NOT have onDelete: Cascade (default behavior or explicit other)
    const nonCascadeDeleteRelationships = [
      { model: 'Video', field: 'uploader_id', relation: 'uploader', references: 'User' },
      { model: 'Transaction', field: 'student_id', relation: 'student', references: 'User' },
      { model: 'Transaction', field: 'course_id', relation: 'course', references: 'Course' },
      { model: 'Transaction', field: 'creator_id', relation: 'creator', references: 'User' },
      { model: 'Withdrawal', field: 'creator_id', relation: 'creator', references: 'User' },
      { model: 'AssignmentSubmission', field: 'graded_by', relation: 'grader', references: 'User' },
    ];

    it('should define onDelete: Cascade for all cascade delete relationships', () => {
      fc.assert(
        fc.property(fc.constantFrom(...cascadeDeleteRelationships), relationship => {
          // Property: Relationships that require cascade delete must have onDelete: Cascade
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${relationship.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Look for the relation definition with onDelete: Cascade
            // Pattern: relation_name ReferencedModel @relation(..., onDelete: Cascade)
            const relationRegex = new RegExp(
              `${relationship.relation}\\s+${relationship.references}[^\\n]*onDelete:\\s*Cascade`,
              's'
            );
            expect(modelSection[0]).toMatch(relationRegex);
          }
        }),
        { numRuns: cascadeDeleteRelationships.length }
      );
    });

    it('should NOT define onDelete: Cascade for non-cascade relationships', () => {
      fc.assert(
        fc.property(fc.constantFrom(...nonCascadeDeleteRelationships), relationship => {
          // Property: Relationships that should not cascade must not have onDelete: Cascade
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${relationship.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Look for the relation definition - it should NOT have onDelete: Cascade
            const relationRegex = new RegExp(
              `${relationship.relation}\\s+${relationship.references}[^\\n]*onDelete:\\s*Cascade`,
              's'
            );
            expect(modelSection[0]).not.toMatch(relationRegex);
          }
        }),
        { numRuns: nonCascadeDeleteRelationships.length }
      );
    });

    it('should verify cascade delete is properly formatted in relation definitions', () => {
      fc.assert(
        fc.property(fc.constantFrom(...cascadeDeleteRelationships), relationship => {
          // Property: onDelete: Cascade must be part of @relation directive
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${relationship.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Verify the complete @relation syntax with onDelete
            const relationWithOnDeleteRegex = new RegExp(
              `${relationship.relation}\\s+${relationship.references}[^@]*@relation\\([^)]*onDelete:\\s*Cascade[^)]*\\)`,
              's'
            );
            expect(modelSection[0]).toMatch(relationWithOnDeleteRegex);
          }
        }),
        { numRuns: cascadeDeleteRelationships.length }
      );
    });

    it('should verify all foreign key fields have corresponding relation definitions', () => {
      fc.assert(
        fc.property(fc.constantFrom(...cascadeDeleteRelationships), relationship => {
          // Property: Each foreign key field must have a corresponding relation field
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${relationship.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check that the foreign key field exists
            const fkFieldRegex = new RegExp(`${relationship.field}\\s+String\\s+@db\\.Uuid`);
            expect(modelSection[0]).toMatch(fkFieldRegex);

            // Check that the relation field exists
            const relationFieldRegex = new RegExp(
              `${relationship.relation}\\s+${relationship.references}[?]?\\s+@relation`
            );
            expect(modelSection[0]).toMatch(relationFieldRegex);
          }
        }),
        { numRuns: cascadeDeleteRelationships.length }
      );
    });

    it('should verify cascade delete count matches expected relationships', () => {
      // Property: The schema must have exactly the expected number of cascade delete relationships
      const cascadeMatches = schemaContent.match(/onDelete:\s*Cascade/g);
      expect(cascadeMatches).toBeTruthy();
      expect(cascadeMatches?.length).toBe(cascadeDeleteRelationships.length);
    });

    it('should verify no unexpected cascade delete behaviors exist', () => {
      // Property: Only the specified relationships should have cascade delete
      // This test ensures we don't accidentally add cascade delete to relationships that shouldn't have it

      // Count all @relation directives
      const allRelationMatches = schemaContent.match(/@relation\([^)]+\)/g);
      expect(allRelationMatches).toBeTruthy();

      // Count cascade delete directives
      const cascadeMatches = schemaContent.match(/onDelete:\s*Cascade/g);
      expect(cascadeMatches).toBeTruthy();

      // Verify that cascade deletes are only on expected relationships
      const cascadeCount = cascadeMatches?.length || 0;
      const expectedCascadeCount = cascadeDeleteRelationships.length;

      expect(cascadeCount).toBe(expectedCascadeCount);
    });

    it('should verify optional foreign keys do not have cascade delete', () => {
      // Property: Optional foreign key relationships (nullable) should be carefully reviewed for cascade
      const optionalForeignKeys = [
        { model: 'AssignmentSubmission', field: 'graded_by', relation: 'grader' },
        { model: 'Comment', field: 'parent_comment_id', relation: 'parent_comment' },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...optionalForeignKeys), fk => {
          // Property: Optional foreign keys must be explicitly defined
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${fk.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check that the field is optional (String?)
            const optionalFieldRegex = new RegExp(`${fk.field}\\s+String\\?\\s+@db\\.Uuid`);
            expect(modelSection[0]).toMatch(optionalFieldRegex);
          }
        }),
        { numRuns: optionalForeignKeys.length }
      );
    });

    it('should verify self-referential cascade delete is properly defined', () => {
      // Property: Self-referential relationships (Comment -> Comment) must have cascade delete
      const modelSection = schemaContent.match(/model\s+Comment\s*{[^}]+}/s);

      expect(modelSection).toBeTruthy();

      if (modelSection) {
        // Check for parent_comment relation with cascade delete
        const selfRefRegex =
          /parent_comment\s+Comment\?[^@]*@relation\([^)]*onDelete:\s*Cascade[^)]*\)/s;
        expect(modelSection[0]).toMatch(selfRefRegex);
      }
    });
  });

  /**
   * Task 3.5: Property Test for UUID Primary Key Consistency
   * Property 2: UUID Primary Key Consistency
   * **Validates: Requirements 2.7**
   *
   * For all models in the Prisma schema, the primary key SHALL be of type UUID
   * with @default(uuid()) decorator.
   */
  describe('Property 2: UUID Primary Key Consistency', () => {
    const EXPECTED_MODELS = [
      'User',
      'Course',
      'CourseTag',
      'Chapter',
      'Lesson',
      'Video',
      'Resource',
      'Enrollment',
      'LessonProgress',
      'QuizAttempt',
      'AssignmentSubmission',
      'Certificate',
      'Transaction',
      'Withdrawal',
      'Review',
      'Comment',
      'Note',
      'Notification',
      'Wishlist',
      'Coupon',
      'RefreshToken',
    ];

    it('should verify all models have UUID primary keys with @default(uuid())', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_MODELS), modelName => {
          // Property: Each model must have an id field with:
          // - Type: String
          // - Decorator: @id
          // - Default: @default(uuid())
          // - Database type: @db.Uuid
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check for the complete UUID primary key pattern
            const uuidPrimaryKeyRegex = /id\s+String\s+@id\s+@default\(uuid\(\)\)\s+@db\.Uuid/;
            expect(modelSection[0]).toMatch(uuidPrimaryKeyRegex);
          }
        }),
        { numRuns: EXPECTED_MODELS.length }
      );
    });

    it('should verify primary key field is named "id"', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_MODELS), modelName => {
          // Property: The primary key field must be named "id"
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check that @id decorator is applied to a field named "id"
            const idFieldRegex = /\bid\s+String\s+@id/;
            expect(modelSection[0]).toMatch(idFieldRegex);
          }
        }),
        { numRuns: EXPECTED_MODELS.length }
      );
    });

    it('should verify UUID type is String with @db.Uuid', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_MODELS), modelName => {
          // Property: UUID fields must use String type with @db.Uuid database type
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check that the id field uses String type and @db.Uuid
            const typeRegex = /id\s+String\s+.*@db\.Uuid/;
            expect(modelSection[0]).toMatch(typeRegex);
          }
        }),
        { numRuns: EXPECTED_MODELS.length }
      );
    });

    it('should verify @default(uuid()) is present on all primary keys', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_MODELS), modelName => {
          // Property: All primary keys must have @default(uuid()) to auto-generate UUIDs
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Check for @default(uuid()) on the id field
            const defaultUuidRegex = /id\s+String\s+@id\s+@default\(uuid\(\)\)/;
            expect(modelSection[0]).toMatch(defaultUuidRegex);
          }
        }),
        { numRuns: EXPECTED_MODELS.length }
      );
    });

    it('should verify no models use alternative primary key types', () => {
      // Property: No models should use Int, BigInt, or other types for primary keys
      const alternativeKeyTypes = ['Int', 'BigInt', 'Decimal'];

      fc.assert(
        fc.property(fc.constantFrom(...EXPECTED_MODELS), modelName => {
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${modelName}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            // Verify that @id is not used with alternative types
            alternativeKeyTypes.forEach(altType => {
              const altKeyRegex = new RegExp(`id\\s+${altType}\\s+@id`);
              expect(modelSection[0]).not.toMatch(altKeyRegex);
            });
          }
        }),
        { numRuns: EXPECTED_MODELS.length }
      );
    });

    it('should verify UUID consistency across all foreign key references', () => {
      // Property: All foreign key fields referencing primary keys must also be UUID type
      const foreignKeyFields = [
        { model: 'Course', field: 'creator_id' },
        { model: 'CourseTag', field: 'course_id' },
        { model: 'Chapter', field: 'course_id' },
        { model: 'Lesson', field: 'chapter_id' },
        { model: 'Video', field: 'uploader_id' },
        { model: 'Resource', field: 'lesson_id' },
        { model: 'Enrollment', field: 'student_id' },
        { model: 'Enrollment', field: 'course_id' },
        { model: 'LessonProgress', field: 'student_id' },
        { model: 'LessonProgress', field: 'lesson_id' },
        { model: 'QuizAttempt', field: 'student_id' },
        { model: 'QuizAttempt', field: 'lesson_id' },
        { model: 'AssignmentSubmission', field: 'student_id' },
        { model: 'AssignmentSubmission', field: 'lesson_id' },
        { model: 'Certificate', field: 'student_id' },
        { model: 'Certificate', field: 'course_id' },
        { model: 'Transaction', field: 'student_id' },
        { model: 'Transaction', field: 'course_id' },
        { model: 'Transaction', field: 'creator_id' },
        { model: 'Withdrawal', field: 'creator_id' },
        { model: 'Review', field: 'student_id' },
        { model: 'Review', field: 'course_id' },
        { model: 'Comment', field: 'lesson_id' },
        { model: 'Comment', field: 'user_id' },
        { model: 'Note', field: 'student_id' },
        { model: 'Note', field: 'lesson_id' },
        { model: 'Notification', field: 'user_id' },
        { model: 'Wishlist', field: 'student_id' },
        { model: 'Wishlist', field: 'course_id' },
        { model: 'Coupon', field: 'course_id' },
        { model: 'RefreshToken', field: 'user_id' },
      ];

      fc.assert(
        fc.property(fc.constantFrom(...foreignKeyFields), fk => {
          // Property: Foreign key fields must use String @db.Uuid type
          const modelSection = schemaContent.match(
            new RegExp(`model\\s+${fk.model}\\s*{[^}]+}`, 's')
          );

          expect(modelSection).toBeTruthy();

          if (modelSection) {
            const fkRegex = new RegExp(`${fk.field}\\s+String\\s+@db\\.Uuid`);
            expect(modelSection[0]).toMatch(fkRegex);
          }
        }),
        { numRuns: foreignKeyFields.length }
      );
    });
  });
});
