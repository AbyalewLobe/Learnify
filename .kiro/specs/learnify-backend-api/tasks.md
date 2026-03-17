# Implementation Plan: Learnify Backend API

## Overview

This implementation plan breaks down the Learnify Backend API into discrete, actionable coding tasks. The system is a comprehensive RESTful API built with Node.js/TypeScript, Express.js, PostgreSQL, Redis, and AWS services (S3, CloudFront, SES, MediaConvert). The implementation follows a layered architecture with clear separation between presentation, business logic, data access, and infrastructure layers.

The tasks are organized to build incrementally, starting with foundational infrastructure, then core authentication and authorization, followed by feature-specific implementations, and concluding with testing and optimization.

## Tasks

- [x] 1. Project Setup and Infrastructure Configuration
  - [x] 1.1 Initialize Node.js/TypeScript project with Express.js
    - Create package.json with dependencies (express, typescript, pg, redis, aws-sdk, stripe, bcrypt, jsonwebtoken, joi)
    - Configure TypeScript with strict mode and appropriate compiler options
    - Set up project structure: src/{controllers, services, repositories, middleware, models, utils, config}
    - Configure ESLint and Prettier for code quality
    - _Requirements: 24.1, 24.2_

  - [x] 1.2 Configure environment variables and secrets management
    - Create .env.example with all required environment variables
    - Set up dotenv for local development
    - Document required variables: DATABASE_URL, REDIS_URL, JWT_SECRET, STRIPE_SECRET_KEY, AWS credentials
    - _Requirements: 1.1, 25.3_

  - [x] 1.3 Set up PostgreSQL database connection and migration system
    - Configure pg connection pool with appropriate pool size (20-50 connections)
    - Set up database migration tool (node-pg-migrate or Knex)
    - Create initial migration for database schema
    - Implement connection health check endpoint
    - _Requirements: 24.1_

  - [x] 1.4 Set up Redis connection for caching and session management
    - Configure Redis client with connection pooling
    - Implement Redis connection error handling and reconnection logic
    - Set up cache key namespacing strategy
    - _Requirements: 25.1_

  - [x] 1.5 Configure AWS services (S3, CloudFront, SES, MediaConvert)
    - Initialize AWS SDK with credentials and region configuration
    - Create S3 bucket configuration for videos, resources, public assets, and uploads
    - Configure CloudFront distribution with signed URL support
    - Set up SES for transactional emails with verified domain
    - Configure MediaConvert endpoint and job templates
    - _Requirements: 4.1, 4.6, 23.1_


- [ ] 2. Database Schema Implementation
  - [ ] 2.1 Create users table migration with indexes
    - Implement users table with all fields (id, email, password_hash, first_name, last_name, role, is_active, profile_image_url, bio, timestamps)
    - Add indexes on email, role
    - Add unique constraint on email
    - Add check constraint for role enum
    - _Requirements: 1.3, 1.5, 2.1_

  - [ ] 2.2 Create courses and course_tags tables with indexes
    - Implement courses table with all fields including status, pricing, ratings, and timestamps
    - Implement course_tags table with course_id and tag fields
    - Add indexes on creator_id, status, category, published_at
    - Add check constraints for status and difficulty_level enums
    - Add unique constraint on course_tags(course_id, tag)
    - _Requirements: 3.1, 3.6, 22.1, 22.3_

  - [ ] 2.3 Create chapters and lessons tables with ordering support
    - Implement chapters table with course_id, title, description, order_index
    - Implement lessons table with chapter_id, title, lesson_type, content (JSONB), duration, order_index, is_preview
    - Add indexes on course_id, chapter_id, order_index
    - Add check constraint for lesson_type enum
    - _Requirements: 3.4, 3.5, 27.1, 27.2_

  - [ ] 2.4 Create videos and resources tables
    - Implement videos table with uploader_id, s3_key, duration, status, resolutions (JSONB), error_message
    - Implement resources table with lesson_id, title, file_type, file_size_bytes, file_url
    - Add indexes on uploader_id, lesson_id, video status
    - _Requirements: 4.1, 4.3, 4.6, 6.1_

  - [ ] 2.5 Create enrollments and progress tracking tables
    - Implement enrollments table with student_id, course_id, enrolled_at, last_accessed_at
    - Implement lesson_progress table with student_id, lesson_id, is_completed, completed_at, video_position_seconds
    - Add unique constraints on (student_id, course_id) and (student_id, lesson_id)
    - Add indexes on student_id, course_id, lesson_id
    - _Requirements: 8.4, 8.6, 10.1, 10.6_

  - [ ] 2.6 Create quiz and assignment tables
    - Implement quiz_attempts table with student_id, lesson_id, answers (JSONB), score, attempted_at
    - Implement assignment_submissions table with student_id, lesson_id, submission_url, grade, feedback, graded_at, graded_by
    - Add indexes on student_id and lesson_id for both tables
    - _Requirements: 20.1, 20.4, 20.6, 20.7_

  - [ ] 2.7 Create certificates table with unique certificate numbers
    - Implement certificates table with student_id, course_id, certificate_number, issued_at, pdf_url
    - Add unique constraint on (student_id, course_id) and certificate_number
    - Add indexes on student_id, course_id, certificate_number
    - _Requirements: 11.1, 11.2_

  - [ ] 2.8 Create transactions and withdrawals tables
    - Implement transactions table with student_id, course_id, creator_id, amount, platform_fee, creator_earnings, stripe_payment_id, status
    - Implement withdrawals table with creator_id, amount, status, stripe_transfer_id, requested_at, processed_at
    - Add indexes on student_id, creator_id, course_id, status for both tables
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

  - [ ] 2.9 Create reviews, comments, and notes tables
    - Implement reviews table with student_id, course_id, rating, review_text, timestamps
    - Implement comments table with lesson_id, user_id, parent_comment_id, content, timestamps
    - Implement notes table with student_id, lesson_id, content, video_timestamp_seconds, timestamps
    - Add unique constraint on reviews(student_id, course_id)
    - Add indexes on all foreign keys
    - _Requirements: 12.1, 13.1, 13.2, 18.1, 18.2_

  - [ ] 2.10 Create notifications, wishlists, coupons, and refresh_tokens tables
    - Implement notifications table with user_id, type, title, message, related_entity_type, related_entity_id, is_read
    - Implement wishlists table with student_id, course_id, added_at and unique constraint
    - Implement coupons table with course_id, code, discount_percentage, max_uses, current_uses, expires_at, is_active
    - Implement refresh_tokens table with user_id, token_hash, expires_at, revoked_at
    - Add appropriate indexes on all tables
    - _Requirements: 23.1, 23.5, 28.1, 28.2, 29.1, 29.2, 1.4_


- [ ] 3. Core Authentication System
  - [ ] 3.1 Implement password hashing service with bcrypt
    - Create PasswordService with hash() and compare() methods
    - Use bcrypt with 12 salt rounds
    - Implement password complexity validation (minimum 8 characters)
    - _Requirements: 1.5_

  - [ ]* 3.2 Write property test for password hashing
    - **Property 3: Password Hashing Security**
    - **Validates: Requirements 1.5**
    - Test that hashed passwords never match original plaintext
    - Test that bcrypt format is maintained ($2a$, $2b$, or $2y$)

  - [ ] 3.3 Implement JWT token generation and validation service
    - Create TokenService with generateAccessToken(), generateRefreshToken(), and validateToken() methods
    - Use RS256 algorithm with asymmetric keys
    - Set access token expiration to 15 minutes
    - Set refresh token expiration to 7 days
    - Include user ID and role in token payload
    - _Requirements: 1.1, 1.4_

  - [ ]* 3.4 Write property test for token generation
    - **Property 1: Authentication Token Generation**
    - **Validates: Requirements 1.1**
    - Test that valid credentials always produce both access and refresh tokens
    - Test that tokens have appropriate expiration times

  - [ ] 3.5 Implement user registration endpoint
    - Create POST /api/v1/auth/register endpoint
    - Validate input (email format, password strength, required fields)
    - Check for duplicate email addresses
    - Hash password before storage
    - Create user record with selected role (student, creator, admin)
    - Return user data (excluding password hash)
    - _Requirements: 1.3, 1.5, 24.2_

  - [ ] 3.6 Implement user login endpoint with token generation
    - Create POST /api/v1/auth/login endpoint
    - Validate credentials against database
    - Compare password hash using bcrypt
    - Generate access and refresh tokens on success
    - Store refresh token hash in database
    - Cache user session in Redis
    - Return tokens and user data
    - _Requirements: 1.1, 1.2_

  - [ ]* 3.7 Write property test for authentication failure handling
    - **Property 2: Authentication Failure Handling**
    - **Validates: Requirements 1.2**
    - Test that invalid credentials never create sessions
    - Test that authentication errors are returned for malformed inputs

  - [ ] 3.8 Implement token refresh endpoint
    - Create POST /api/v1/auth/refresh endpoint
    - Validate refresh token from database
    - Check token expiration and revocation status
    - Generate new access token
    - Implement refresh token rotation (generate new refresh token)
    - Revoke old refresh token
    - _Requirements: 1.4_

  - [ ] 3.9 Implement logout endpoint with token revocation
    - Create POST /api/v1/auth/logout endpoint
    - Revoke refresh token in database
    - Clear user session from Redis cache
    - _Requirements: 1.4_

  - [ ] 3.10 Implement password reset request and confirmation endpoints
    - Create POST /api/v1/auth/password/reset endpoint to request reset
    - Generate time-limited reset token (1 hour expiration)
    - Send reset email via AWS SES
    - Create POST /api/v1/auth/password/confirm endpoint to confirm reset
    - Validate reset token and expiration
    - Hash and update new password
    - _Requirements: 1.6_


- [ ] 4. Authorization and Access Control
  - [ ] 4.1 Implement authentication middleware for protected routes
    - Create authenticate middleware to extract and validate JWT from Authorization header
    - Verify token signature and expiration
    - Load user data from Redis cache or database
    - Attach user object to request
    - Return 401 Unauthorized for invalid/missing tokens
    - _Requirements: 25.3_

  - [ ] 4.2 Implement role-based authorization middleware
    - Create authorize(...roles) middleware factory
    - Check if authenticated user's role is in allowed roles
    - Return 403 Forbidden for insufficient permissions
    - _Requirements: 2.1, 2.5_

  - [ ]* 4.3 Write property test for role-based access control
    - **Property 4: Role-Based Access Control**
    - **Validates: Requirements 2.1, 2.5**
    - Test that users without required roles always receive 403 Forbidden
    - Test across all role combinations (student, creator, admin)

  - [ ] 4.4 Implement course ownership validation middleware
    - Create authorizeOwnership('course') middleware
    - Check if user is course creator or admin
    - Return 403 Forbidden if not owner
    - _Requirements: 2.3, 3.2, 3.3_

  - [ ]* 4.5 Write property test for course ownership validation
    - **Property 6: Course Ownership Validation**
    - **Validates: Requirements 3.2, 3.3**
    - Test that only course owners and admins can modify courses
    - Test that other users receive 403 Forbidden

  - [ ] 4.6 Implement enrollment verification service
    - Create EnrollmentService.isEnrolled(userId, courseId) method
    - Check enrollments table for active enrollment
    - Cache enrollment status in Redis (30 minute TTL)
    - _Requirements: 2.2, 5.3, 6.5, 13.6_

  - [ ]* 4.7 Write property test for enrollment-based content access
    - **Property 5: Enrollment-Based Content Access**
    - **Validates: Requirements 2.2, 5.3, 6.5, 13.6**
    - Test that non-enrolled students cannot access course content
    - Test that preview content is accessible without enrollment

  - [ ] 4.8 Implement rate limiting middleware
    - Create rate limiter using Redis
    - Set limit to 100 requests per minute per user
    - Return 429 Too Many Requests when limit exceeded
    - Include Retry-After header in response
    - _Requirements: 25.1, 25.2_

  - [ ]* 4.9 Write property test for rate limiting enforcement
    - **Property 24: Rate Limiting Enforcement**
    - **Validates: Requirements 25.1, 25.2**
    - Test that exceeding 100 requests/minute returns 429
    - Test that rate limit resets after time window


- [ ] 5. Course Management System
  - [ ] 5.1 Implement course creation endpoint
    - Create POST /api/v1/courses endpoint (Creator only)
    - Validate input using Joi schema (title, description, category, price, difficulty_level)
    - Set initial status to 'draft'
    - Associate course with authenticated creator
    - Upload thumbnail to S3 if provided
    - Return created course with ID
    - _Requirements: 3.1, 3.6, 22.2_

  - [ ] 5.2 Implement course update endpoint
    - Create PUT /api/v1/courses/:id endpoint
    - Verify course ownership or admin role
    - Validate update fields
    - Handle thumbnail upload/replacement
    - Update course record
    - Invalidate course cache in Redis
    - _Requirements: 3.2_

  - [ ] 5.3 Implement course deletion endpoint
    - Create DELETE /api/v1/courses/:id endpoint
    - Verify course ownership or admin role
    - Check that course is not published (only draft courses can be deleted)
    - Delete course and cascade to chapters, lessons (via database constraints)
    - Delete associated S3 files (thumbnails, videos)
    - _Requirements: 3.3_

  - [ ] 5.4 Implement course retrieval endpoints
    - Create GET /api/v1/courses/:id endpoint for course details
    - Include chapters and lessons in response
    - Cache course data in Redis (10 minute TTL)
    - Create GET /api/v1/courses endpoint for published course listing
    - Support pagination (default 20 items, max 100)
    - Cache course list in Redis (5 minute TTL)
    - _Requirements: 7.1, 7.5_

  - [ ] 5.5 Implement course submission for review endpoint
    - Create POST /api/v1/courses/:id/submit endpoint (Creator only)
    - Verify course ownership
    - Validate course has at least one chapter and one lesson
    - Change status from 'draft' to 'pending'
    - Create notification for admins
    - _Requirements: 3.8, 14.1_

  - [ ] 5.6 Implement creator's course listing endpoint
    - Create GET /api/v1/courses/my endpoint (Creator only)
    - Return all courses owned by authenticated creator
    - Include all statuses (draft, pending, published, rejected)
    - Support pagination
    - _Requirements: 3.2_

  - [ ] 5.7 Implement course tags management
    - Add tag support to course creation and update endpoints
    - Create course_tags records for each tag
    - Support multiple tags per course
    - Validate tag format (max 50 characters, alphanumeric with hyphens)
    - _Requirements: 22.3, 22.5_


- [ ] 6. Chapter and Lesson Management
  - [ ] 6.1 Implement chapter creation endpoint
    - Create POST /api/v1/courses/:courseId/chapters endpoint
    - Verify course ownership
    - Validate chapter data (title, description)
    - Calculate next order_index automatically
    - Create chapter record
    - _Requirements: 3.4_

  - [ ] 6.2 Implement chapter update and delete endpoints
    - Create PUT /api/v1/chapters/:id endpoint
    - Create DELETE /api/v1/chapters/:id endpoint
    - Verify course ownership through chapter's course
    - Handle order_index updates when deleting
    - _Requirements: 3.4_

  - [ ] 6.3 Implement chapter reordering endpoint
    - Create PATCH /api/v1/courses/:courseId/chapters/reorder endpoint
    - Accept array of chapter IDs in desired order
    - Verify all chapters belong to the course
    - Update order_index for all chapters in transaction
    - _Requirements: 27.1_

  - [ ]* 6.4 Write property test for chapter ordering
    - **Property 29: Chapter and Lesson Ordering**
    - **Validates: Requirements 27.1, 27.2**
    - Test that chapters maintain unique order_index values
    - Test that lessons within chapters maintain unique order_index values

  - [ ] 6.5 Implement lesson creation endpoint
    - Create POST /api/v1/chapters/:chapterId/lessons endpoint
    - Verify course ownership through chapter
    - Validate lesson data (title, lesson_type, content, duration, is_preview)
    - Store type-specific content in JSONB field (video_id for video lessons, questions for quiz lessons)
    - Calculate next order_index automatically
    - Create lesson record
    - _Requirements: 3.5, 20.1_

  - [ ] 6.6 Implement lesson update and delete endpoints
    - Create PUT /api/v1/lessons/:id endpoint
    - Create DELETE /api/v1/lessons/:id endpoint
    - Verify course ownership through lesson's chapter
    - Handle order_index updates when deleting
    - _Requirements: 3.5_

  - [ ] 6.7 Implement lesson reordering endpoint
    - Create PATCH /api/v1/chapters/:chapterId/lessons/reorder endpoint
    - Accept array of lesson IDs in desired order
    - Verify all lessons belong to the chapter
    - Update order_index for all lessons in transaction
    - _Requirements: 27.2_

  - [ ] 6.8 Implement lesson duplication endpoint
    - Create POST /api/v1/lessons/:id/duplicate endpoint
    - Verify course ownership
    - Copy lesson data with new ID
    - Append "(Copy)" to title
    - Place duplicated lesson after original
    - _Requirements: 27.3_

  - [ ] 6.9 Implement lesson move between chapters endpoint
    - Create PATCH /api/v1/lessons/:id/move endpoint
    - Accept target chapter ID
    - Verify course ownership for both source and target chapters
    - Update lesson's chapter_id and order_index
    - _Requirements: 27.4_


- [ ] 7. Video Upload and Processing System
  - [ ] 7.1 Implement video upload initiation endpoint
    - Create POST /api/v1/videos/upload endpoint
    - Validate video metadata (filename, content type, file size)
    - Reject uploads exceeding 2GB
    - Generate unique video ID
    - Create presigned S3 URL for direct upload to originals bucket
    - Create video record with 'pending' status
    - Return video ID and presigned upload URL
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 7.2 Write property test for video upload size limit
    - **Property 7: Video Upload Size Limit**
    - **Validates: Requirements 4.4, 4.5**
    - Test that files exceeding 2GB are rejected
    - Test that descriptive error messages are returned

  - [ ] 7.3 Implement video upload confirmation and transcoding trigger
    - Create POST /api/v1/videos/:id/confirm endpoint
    - Verify video file exists in S3
    - Update video status to 'processing'
    - Enqueue transcoding job to SQS/RabbitMQ
    - Return video status
    - _Requirements: 4.6_

  - [ ] 7.4 Implement video transcoding worker
    - Create background worker to process transcoding queue
    - Fetch original video from S3
    - Use AWS MediaConvert to transcode to multiple resolutions (360p, 480p, 720p, 1080p)
    - Generate HLS manifest files
    - Store transcoded files in S3 transcoded bucket
    - Generate thumbnail image
    - Update video record with resolutions, duration, and 'ready' status
    - Handle transcoding failures and update status to 'failed' with error message
    - _Requirements: 4.6, 5.2_

  - [ ]* 7.5 Write property test for video processing status tracking
    - **Property 8: Video Processing Status Tracking**
    - **Validates: Requirements 4.6**
    - Test that video status progresses: pending → processing → ready/failed
    - Test that status never skips states or regresses

  - [ ] 7.6 Implement video status check endpoint
    - Create GET /api/v1/videos/:id/status endpoint
    - Return video processing status, duration, available resolutions
    - Include error message if status is 'failed'
    - _Requirements: 4.6_

  - [ ] 7.7 Implement video streaming URL generation endpoint
    - Create GET /api/v1/videos/:id/stream endpoint
    - Verify user enrollment in course containing the video
    - Allow access to preview videos without enrollment
    - Generate CloudFront signed URL for HLS playlist (1 hour expiration)
    - Return streaming URL
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ] 7.8 Implement video playback position tracking
    - Create PATCH /api/v1/videos/:id/position endpoint to update position
    - Create GET /api/v1/videos/:id/position endpoint to retrieve position
    - Store position in lesson_progress table
    - _Requirements: 5.5, 10.6_

  - [ ] 7.9 Implement video deletion endpoint
    - Create DELETE /api/v1/videos/:id endpoint
    - Verify ownership (creator of course containing video or admin)
    - Delete video record from database
    - Delete all video files from S3 (original, transcoded, thumbnails)
    - _Requirements: 4.1_


- [ ] 8. Resource File Management
  - [ ] 8.1 Implement resource file upload endpoint
    - Create POST /api/v1/lessons/:lessonId/resources endpoint
    - Verify course ownership through lesson
    - Validate file type (PDF, ZIP, DOCX, XLSX)
    - Validate file size (max 100MB)
    - Upload file to S3 resources bucket
    - Create resource record with file metadata
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.2 Write property test for resource file size limit
    - **Property 26: Resource File Size Limit**
    - **Validates: Requirements 6.3**
    - Test that files exceeding 100MB are rejected

  - [ ] 8.3 Implement resource listing endpoint
    - Create GET /api/v1/lessons/:lessonId/resources endpoint
    - Return all resources for the lesson
    - Include file metadata (title, type, size)
    - _Requirements: 6.1_

  - [ ] 8.4 Implement resource download endpoint
    - Create GET /api/v1/resources/:id/download endpoint
    - Verify user enrollment in course containing the resource
    - Generate presigned S3 URL for download (15 minute expiration)
    - Return download URL
    - _Requirements: 6.4, 6.5_

  - [ ] 8.5 Implement resource deletion endpoint
    - Create DELETE /api/v1/resources/:id endpoint
    - Verify course ownership
    - Delete resource record from database
    - Delete file from S3
    - _Requirements: 6.1_


- [ ] 9. Course Discovery and Search
  - [ ] 9.1 Implement course marketplace listing endpoint
    - Create GET /api/v1/courses endpoint
    - Return only published courses
    - Support pagination (default 20, max 100)
    - Include course summary data (title, description, thumbnail, price, rating, enrollment count)
    - Cache results in Redis (5 minute TTL)
    - _Requirements: 7.1, 7.5_

  - [ ] 9.2 Implement course search endpoint
    - Create GET /api/v1/search/courses endpoint
    - Support keyword search on title and description using PostgreSQL full-text search
    - Support filtering by category, price range, rating, difficulty level
    - Support sorting by relevance, popularity, rating, price, newest
    - Return paginated results
    - _Requirements: 7.2, 7.3, 7.4, 7.6, 19.1, 19.2, 19.3, 19.4_

  - [ ]* 9.3 Write property test for search result filtering
    - **Property 30: Search Result Filtering**
    - **Validates: Requirements 19.1, 19.2**
    - Test that all returned courses match all specified filter criteria
    - Test with multiple filter combinations

  - [ ] 9.4 Implement course categories endpoint
    - Create GET /api/v1/categories endpoint
    - Return predefined list of course categories
    - Include course count per category
    - _Requirements: 22.1, 22.4_

  - [ ] 9.5 Implement course preview endpoint
    - Create GET /api/v1/courses/:id/preview endpoint
    - Return course overview without requiring enrollment
    - Include trailer video URL if available
    - Include list of preview lessons
    - _Requirements: 26.1, 26.2, 26.3_


- [ ] 10. Payment Processing and Enrollment
  - [ ] 10.1 Implement Stripe payment integration service
    - Create PaymentService with Stripe SDK initialization
    - Implement createPaymentIntent() method
    - Configure Stripe webhook endpoint URL
    - Set up Stripe Connect for creator payouts
    - _Requirements: 9.1_

  - [ ] 10.2 Implement course purchase endpoint
    - Create POST /api/v1/payments/purchase endpoint
    - Validate user is not already enrolled
    - Apply coupon discount if provided
    - Create Stripe payment intent with course price
    - Include metadata (courseId, userId, couponCode)
    - Return payment intent client secret
    - _Requirements: 8.1, 8.4_

  - [ ] 10.3 Implement price calculation endpoint with coupon support
    - Create POST /api/v1/payments/calculate endpoint
    - Accept course ID and optional coupon code
    - Validate coupon (expiration, usage limits, active status)
    - Calculate discounted price
    - Return original price, discount, and final price
    - _Requirements: 29.3, 29.4_

  - [ ]* 10.4 Write property test for coupon discount calculation
    - **Property 22: Coupon Discount Calculation**
    - **Validates: Requirements 29.3**
    - Test that discounted price = original × (1 - discount_percentage/100)
    - Test that discounted price is never negative

  - [ ]* 10.5 Write property test for coupon validation
    - **Property 21: Coupon Validation**
    - **Validates: Requirements 29.4**
    - Test that expired, over-limit, or inactive coupons are rejected

  - [ ] 10.6 Implement Stripe webhook handler
    - Create POST /api/v1/payments/webhook endpoint
    - Verify Stripe webhook signature
    - Handle payment_intent.succeeded event: create enrollment, record transaction, send confirmation email
    - Handle payment_intent.failed event: log failure, notify user
    - Handle charge.refunded event: remove enrollment, update transaction
    - Return 200 OK to acknowledge webhook
    - _Requirements: 8.2, 8.3, 8.5_

  - [ ]* 10.7 Write property test for payment and enrollment atomicity
    - **Property 9: Payment and Enrollment Atomicity**
    - **Validates: Requirements 8.2, 8.3**
    - Test that successful payment always creates enrollment
    - Test that failed payment never creates enrollment

  - [ ] 10.8 Implement revenue split calculation
    - Create calculateRevenueSplit() function
    - Calculate 90% to creator, 10% to platform
    - Store split amounts in transaction record
    - _Requirements: 9.1, 9.2_

  - [ ]* 10.9 Write property test for revenue split calculation
    - **Property 11: Revenue Split Calculation**
    - **Validates: Requirements 9.1**
    - Test that creator_earnings + platform_fee = total_amount
    - Test that creator receives 90% and platform receives 10%

  - [ ] 10.10 Implement transaction history endpoint
    - Create GET /api/v1/payments/transactions endpoint
    - Return user's transaction history (purchases for students, sales for creators)
    - Support pagination
    - Include transaction details (course, amount, date, status)
    - _Requirements: 9.6_

  - [ ]* 10.11 Write property test for duplicate enrollment prevention
    - **Property 10: Duplicate Enrollment Prevention**
    - **Validates: Requirements 8.4**
    - Test that multiple enrollment attempts for same student-course pair fail


- [ ] 11. Creator Earnings and Withdrawals
  - [ ] 11.1 Implement creator earnings summary endpoint
    - Create GET /api/v1/withdrawals/earnings endpoint (Creator only)
    - Calculate total earnings from transactions
    - Calculate pending balance (earnings minus withdrawals)
    - Aggregate earnings by time period (daily, weekly, monthly)
    - Return earnings breakdown by course
    - _Requirements: 9.3, 15.2, 15.6_

  - [ ] 11.2 Implement withdrawal request endpoint
    - Create POST /api/v1/withdrawals endpoint (Creator only)
    - Validate minimum withdrawal amount ($50)
    - Check available balance
    - Create withdrawal record with 'pending' status
    - Initiate Stripe transfer to creator's connected account
    - _Requirements: 9.4, 9.5_

  - [ ]* 11.3 Write property test for withdrawal minimum amount
    - **Property 23: Withdrawal Minimum Amount**
    - **Validates: Requirements 9.5**
    - Test that withdrawal requests below $50 are rejected

  - [ ] 11.4 Implement withdrawal history endpoint
    - Create GET /api/v1/withdrawals endpoint (Creator only)
    - Return creator's withdrawal history
    - Include status, amount, requested date, processed date
    - Support pagination
    - _Requirements: 9.4_

  - [ ] 11.5 Implement withdrawal processing worker
    - Create background worker to process pending withdrawals
    - Execute Stripe transfers
    - Update withdrawal status to 'completed' or 'failed'
    - Send confirmation email to creator
    - _Requirements: 9.4_


- [ ] 12. Progress Tracking and Completion
  - [ ] 12.1 Implement lesson completion endpoint
    - Create POST /api/v1/progress/lessons/:id/complete endpoint
    - Verify user enrollment in course
    - Create or update lesson_progress record
    - Set is_completed to true and record completion timestamp
    - Update enrollment's last_accessed_at
    - Check if all course lessons are completed
    - Trigger certificate generation if course is complete
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ] 12.2 Implement course progress retrieval endpoint
    - Create GET /api/v1/progress/courses/:id endpoint
    - Calculate completed lessons count
    - Calculate total lessons count
    - Calculate completion percentage
    - Return last accessed timestamp
    - Cache progress data in Redis (30 minute TTL)
    - _Requirements: 10.3, 10.5_

  - [ ]* 12.3 Write property test for lesson completion progress
    - **Property 12: Lesson Completion Progress**
    - **Validates: Requirements 10.3**
    - Test that completion percentage = (completed / total) × 100
    - Test that percentage is always between 0 and 100

  - [ ] 12.4 Implement lesson progress retrieval endpoint
    - Create GET /api/v1/progress/lessons/:id endpoint
    - Return completion status, completion timestamp, last accessed timestamp
    - Return video playback position for video lessons
    - _Requirements: 10.5, 10.6_


- [ ] 13. Certificate Generation
  - [ ] 13.1 Implement certificate generation service
    - Create CertificateService with generateCertificate() method
    - Generate unique certificate number (format: CERT-{year}-{random})
    - Create PDF certificate with student name, course title, completion date, certificate number
    - Use PDF generation library (pdfkit or puppeteer)
    - Upload PDF to S3 public bucket
    - Create certificate record in database
    - _Requirements: 11.1, 11.2_

  - [ ]* 13.2 Write property test for certificate generation prerequisite
    - **Property 13: Certificate Generation Prerequisite**
    - **Validates: Requirements 11.1, 11.5**
    - Test that certificates are only generated when all lessons are completed

  - [ ]* 13.3 Write property test for certificate uniqueness
    - **Property 14: Certificate Uniqueness**
    - **Validates: Requirements 11.2**
    - Test that only one certificate exists per student-course pair
    - Test that certificate numbers are unique

  - [ ] 13.4 Implement certificate retrieval endpoints
    - Create GET /api/v1/certificates endpoint to list user's certificates
    - Create GET /api/v1/certificates/:id endpoint for certificate details
    - Include shareable URL for verification
    - _Requirements: 11.4_

  - [ ] 13.5 Implement certificate download endpoint
    - Create GET /api/v1/certificates/:id/download endpoint
    - Verify certificate ownership or provide public access via shareable URL
    - Return presigned S3 URL for PDF download
    - _Requirements: 11.3_

  - [ ] 13.6 Implement certificate verification endpoint
    - Create GET /api/v1/certificates/verify/:number endpoint
    - Look up certificate by certificate number
    - Return certificate details (student name, course title, completion date)
    - Public endpoint (no authentication required)
    - _Requirements: 11.4_


- [ ] 14. Quiz and Assignment System
  - [ ] 14.1 Implement quiz submission endpoint
    - Create POST /api/v1/lessons/:id/quiz/submit endpoint
    - Verify user enrollment
    - Validate lesson type is 'quiz'
    - Extract correct answers from lesson content
    - Calculate score based on correct answers
    - Create quiz_attempts record with answers and score
    - Mark lesson as completed if score meets threshold
    - _Requirements: 20.3, 20.4_

  - [ ]* 14.2 Write property test for quiz score calculation
    - **Property 20: Quiz Score Calculation**
    - **Validates: Requirements 20.3**
    - Test that score = (correct / total) × 100
    - Test that score is always between 0 and 100

  - [ ] 14.3 Implement quiz attempts retrieval endpoints
    - Create GET /api/v1/lessons/:id/quiz/attempts endpoint to list all attempts
    - Create GET /api/v1/lessons/:id/quiz/attempts/:attemptId endpoint for specific attempt
    - Return answers, score, and timestamp
    - _Requirements: 20.4_

  - [ ] 14.4 Implement assignment submission endpoint
    - Create POST /api/v1/lessons/:id/assignment/submit endpoint
    - Verify user enrollment
    - Validate lesson type is 'assignment'
    - Upload submission file to S3 uploads bucket
    - Create assignment_submissions record
    - _Requirements: 20.6_

  - [ ] 14.5 Implement assignment submissions listing endpoint
    - Create GET /api/v1/lessons/:id/assignment/submissions endpoint (Creator only)
    - Verify course ownership
    - Return all submissions for the assignment
    - Include student info, submission file URL, grade, feedback
    - _Requirements: 20.7_

  - [ ] 14.6 Implement assignment grading endpoint
    - Create PATCH /api/v1/assignments/:id/grade endpoint (Creator only)
    - Verify course ownership
    - Update submission with grade and feedback
    - Record graded_at timestamp and graded_by user ID
    - Mark lesson as completed for the student
    - Send notification to student
    - _Requirements: 20.7_


- [ ] 15. Reviews and Ratings
  - [ ] 15.1 Implement course review submission endpoint
    - Create POST /api/v1/courses/:id/reviews endpoint
    - Verify user enrollment in course
    - Validate rating (1-5 stars)
    - Create or update review record (one review per student per course)
    - Update course's average_rating and total_ratings
    - Invalidate course cache
    - _Requirements: 18.1, 18.2, 18.4, 18.5_

  - [ ]* 15.2 Write property test for review enrollment requirement
    - **Property 18: Review Enrollment Requirement**
    - **Validates: Requirements 18.5**
    - Test that only enrolled students can submit reviews

  - [ ]* 15.3 Write property test for rating value constraints
    - **Property 19: Rating Value Constraints**
    - **Validates: Requirements 18.1, 18.3**
    - Test that ratings are between 1 and 5 inclusive
    - Test that average rating is also between 1 and 5

  - [ ] 15.4 Implement course reviews listing endpoint
    - Create GET /api/v1/courses/:id/reviews endpoint
    - Return all reviews for the course
    - Include student name, rating, review text, timestamp
    - Support sorting by helpfulness or recency
    - Support pagination
    - _Requirements: 18.6_

  - [ ] 15.5 Implement review update and delete endpoints
    - Create PUT /api/v1/reviews/:id endpoint
    - Create DELETE /api/v1/reviews/:id endpoint
    - Verify review ownership
    - Update course's average_rating and total_ratings after changes
    - _Requirements: 18.4_


- [ ] 16. Discussion Forums and Comments
  - [ ] 16.1 Implement comment posting endpoint
    - Create POST /api/v1/lessons/:id/comments endpoint
    - Verify user enrollment in course
    - Validate comment content
    - Create comment record
    - Support parent_comment_id for threaded replies
    - _Requirements: 13.1, 13.2, 13.6_

  - [ ] 16.2 Implement comment listing endpoint
    - Create GET /api/v1/lessons/:id/comments endpoint
    - Verify user enrollment or allow public access for preview lessons
    - Return comments with nested replies
    - Sort by timestamp (newest first)
    - Support pagination
    - _Requirements: 13.7_

  - [ ] 16.3 Implement comment update and delete endpoints
    - Create PUT /api/v1/comments/:id endpoint
    - Create DELETE /api/v1/comments/:id endpoint
    - Verify comment ownership
    - _Requirements: 13.4, 13.5_

  - [ ]* 16.4 Write property test for comment ownership
    - **Property 16: Comment Ownership**
    - **Validates: Requirements 13.4, 13.5**
    - Test that only comment authors can edit or delete their comments

  - [ ] 16.5 Implement comment reply endpoint
    - Create POST /api/v1/comments/:id/reply endpoint
    - Verify user enrollment
    - Create comment with parent_comment_id set
    - _Requirements: 13.2_


- [ ] 17. Note-Taking System
  - [ ] 17.1 Implement note creation endpoint
    - Create POST /api/v1/lessons/:id/notes endpoint
    - Verify user enrollment in course
    - Validate note content
    - Store video timestamp if provided
    - Create note record
    - _Requirements: 12.1, 12.5_

  - [ ] 17.2 Implement note listing endpoint
    - Create GET /api/v1/lessons/:id/notes endpoint
    - Return only notes created by authenticated user
    - Sort by creation timestamp or video timestamp
    - _Requirements: 12.4_

  - [ ] 17.3 Implement note update and delete endpoints
    - Create PUT /api/v1/notes/:id endpoint
    - Create DELETE /api/v1/notes/:id endpoint
    - Verify note ownership
    - _Requirements: 12.2, 12.3_

  - [ ]* 17.4 Write property test for note ownership
    - **Property 15: Note Ownership**
    - **Validates: Requirements 12.2, 12.3**
    - Test that only note creators can update or delete their notes


- [ ] 18. Course Approval Workflow (Admin)
  - [ ] 18.1 Implement pending courses listing endpoint
    - Create GET /api/v1/courses/pending endpoint (Admin only)
    - Return all courses with 'pending' status
    - Include course details and creator information
    - Support pagination
    - _Requirements: 14.2_

  - [ ] 18.2 Implement course approval endpoint
    - Create PATCH /api/v1/courses/:id/approve endpoint (Admin only)
    - Change course status from 'pending' to 'published'
    - Set published_at timestamp
    - Create notification for creator
    - Send approval email to creator
    - Invalidate course cache
    - _Requirements: 14.3, 14.5_

  - [ ] 18.3 Implement course rejection endpoint
    - Create PATCH /api/v1/courses/:id/reject endpoint (Admin only)
    - Change course status from 'pending' to 'rejected'
    - Store rejection reason
    - Create notification for creator
    - Send rejection email with reason to creator
    - _Requirements: 14.4, 14.5_

  - [ ]* 18.4 Write property test for course approval state transitions
    - **Property 17: Course Approval State Transitions**
    - **Validates: Requirements 14.1, 14.3, 14.4**
    - Test valid transitions: draft → pending → (published | rejected)
    - Test that published courses cannot transition back to draft or pending

  - [ ] 18.5 Implement course content preview for admins
    - Extend video streaming and resource download endpoints
    - Allow admins to access any course content without enrollment
    - _Requirements: 21.1, 21.2, 21.3_

  - [ ] 18.6 Implement content flagging endpoint
    - Create POST /api/v1/courses/:id/flag endpoint (Admin only)
    - Record flagged content with reason
    - Create notification for creator and admin team
    - _Requirements: 21.4, 21.5_


- [ ] 19. User Management (Admin)
  - [ ] 19.1 Implement user listing endpoint
    - Create GET /api/v1/users endpoint (Admin only)
    - Support filtering by role (student, creator, admin)
    - Include user details (email, name, role, registration date, is_active)
    - Support pagination
    - _Requirements: 17.1_

  - [ ] 19.2 Implement user details endpoint
    - Create GET /api/v1/users/:id endpoint
    - Return full user profile including activity statistics
    - Accessible by user themselves or admins
    - _Requirements: 17.4_

  - [ ] 19.3 Implement user profile update endpoint
    - Create PUT /api/v1/users/:id endpoint
    - Allow users to update their own profile (name, bio, profile image)
    - Validate and upload profile image to S3 if provided
    - _Requirements: 17.4_

  - [ ] 19.4 Implement user deactivation and reactivation endpoints
    - Create DELETE /api/v1/users/:id endpoint (Admin only) to deactivate
    - Create PATCH /api/v1/users/:id/activate endpoint (Admin only) to reactivate
    - Set is_active flag accordingly
    - Revoke all refresh tokens on deactivation
    - _Requirements: 17.2, 17.3_

  - [ ] 19.5 Implement user role change endpoint
    - Create PATCH /api/v1/users/:id/role endpoint (Admin only)
    - Validate new role value
    - Update user role
    - Revoke existing tokens to force re-authentication with new role
    - _Requirements: 17.5_

  - [ ] 19.6 Implement current user profile endpoint
    - Create GET /api/v1/auth/me endpoint
    - Return authenticated user's profile
    - Include role-specific data (enrolled courses for students, created courses for creators)
    - _Requirements: 17.4_


- [ ] 20. Notification System
  - [ ] 20.1 Implement notification creation service
    - Create NotificationService.createNotification() method
    - Support notification types: enrollment, course_published, status_change, new_content, completion, withdrawal
    - Store notification in database
    - Enqueue email notification to message queue
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [ ] 20.2 Implement notification retrieval endpoint
    - Create GET /api/v1/notifications endpoint
    - Support filtering by read/unread status
    - Return notifications sorted by creation timestamp (newest first)
    - Support pagination
    - _Requirements: 23.5_

  - [ ] 20.3 Implement notification mark as read endpoints
    - Create PATCH /api/v1/notifications/:id/read endpoint for single notification
    - Create PATCH /api/v1/notifications/read-all endpoint for all notifications
    - Update is_read flag
    - _Requirements: 23.6_

  - [ ] 20.4 Implement email notification worker
    - Create background worker to process email notification queue
    - Use AWS SES to send emails
    - Support email templates for different notification types
    - Handle email delivery failures with retry logic
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [ ] 20.5 Integrate notification creation into relevant endpoints
    - Add notification creation to enrollment (notify creator)
    - Add notification creation to course approval/rejection (notify creator)
    - Add notification creation to new content publication (notify enrolled students)
    - Add notification creation to course completion (notify student)
    - Add notification creation to withdrawal processing (notify creator)
    - _Requirements: 23.1, 23.2, 23.3, 23.4_


- [ ] 21. Wishlist System
  - [ ] 21.1 Implement add to wishlist endpoint
    - Create POST /api/v1/wishlist endpoint
    - Validate course exists and is published
    - Check user is not already enrolled
    - Create wishlist entry with unique constraint
    - _Requirements: 28.1, 28.2_

  - [ ]* 21.2 Write property test for wishlist duplicate prevention
    - **Property 27: Wishlist Duplicate Prevention**
    - **Validates: Requirements 28.2**
    - Test that duplicate wishlist entries are prevented

  - [ ] 21.3 Implement wishlist retrieval endpoint
    - Create GET /api/v1/wishlist endpoint
    - Return all wishlisted courses for authenticated user
    - Include course details (title, price, thumbnail, rating)
    - _Requirements: 28.4_

  - [ ] 21.4 Implement remove from wishlist endpoint
    - Create DELETE /api/v1/wishlist/:courseId endpoint
    - Remove wishlist entry
    - _Requirements: 28.3_

  - [ ] 21.5 Implement automatic wishlist removal on enrollment
    - Extend enrollment creation logic
    - Check if course is in user's wishlist
    - Remove wishlist entry if exists
    - _Requirements: 28.5_

  - [ ]* 21.6 Write property test for wishlist removal on enrollment
    - **Property 28: Wishlist Removal on Enrollment**
    - **Validates: Requirements 28.5**
    - Test that wishlisted courses are automatically removed upon enrollment


- [ ] 22. Coupon Management System
  - [ ] 22.1 Implement coupon creation endpoint
    - Create POST /api/v1/courses/:id/coupons endpoint (Creator only)
    - Verify course ownership
    - Validate coupon data (code, discount_percentage, max_uses, expires_at)
    - Ensure code is unique
    - Create coupon record
    - _Requirements: 29.1, 29.2_

  - [ ] 22.2 Implement coupon listing endpoint
    - Create GET /api/v1/courses/:id/coupons endpoint (Creator only)
    - Verify course ownership
    - Return all coupons for the course
    - Include usage statistics
    - _Requirements: 29.1_

  - [ ] 22.3 Implement coupon update and deactivation endpoints
    - Create PATCH /api/v1/coupons/:id endpoint (Creator only)
    - Create DELETE /api/v1/coupons/:id endpoint (Creator only) to deactivate
    - Verify course ownership through coupon
    - Update coupon details or set is_active to false
    - _Requirements: 29.6_

  - [ ] 22.4 Implement coupon validation endpoint
    - Create POST /api/v1/coupons/validate endpoint
    - Accept course ID and coupon code
    - Check coupon exists, is active, not expired, and has remaining uses
    - Return validation result and discount details
    - _Requirements: 29.3, 29.4_

  - [ ] 22.5 Integrate coupon usage tracking
    - Extend payment processing to increment current_uses when coupon is applied
    - Enforce max_uses limit
    - _Requirements: 29.5_


- [ ] 23. Analytics and Reporting
  - [ ] 23.1 Implement course analytics endpoint
    - Create GET /api/v1/analytics/courses/:id endpoint (Creator only)
    - Verify course ownership
    - Calculate total enrollments, total revenue, average rating, completion rate
    - Aggregate revenue by time period (daily, weekly, monthly)
    - Cache analytics data in Redis (1 hour TTL)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.6_

  - [ ] 23.2 Implement creator analytics dashboard endpoint
    - Create GET /api/v1/analytics/creator endpoint (Creator only)
    - Aggregate data across all creator's courses
    - Return total students, total revenue, average rating across courses
    - Include per-course breakdown
    - _Requirements: 15.5_

  - [ ] 23.3 Implement platform analytics endpoint
    - Create GET /api/v1/analytics/platform endpoint (Admin only)
    - Calculate total users by role
    - Calculate total courses by status
    - Calculate total platform revenue and enrollments
    - Track new user registrations by time period
    - Track course publication trends by time period
    - Cache platform analytics in Redis (1 hour TTL)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [ ] 23.4 Implement analytics aggregation worker
    - Create background worker to pre-calculate analytics data
    - Run daily to update cached analytics
    - Store aggregated data for historical reporting
    - _Requirements: 15.6, 16.5, 16.6_


- [ ] 24. Data Export System
  - [ ] 24.1 Implement enrollment data export endpoint
    - Create POST /api/v1/exports/enrollments endpoint (Creator only)
    - Accept course ID and date range filters
    - Verify course ownership
    - Generate CSV with enrollment data (student name, email, enrollment date, progress)
    - Upload CSV to S3 with expiring presigned URL
    - Return export job ID
    - _Requirements: 30.1_

  - [ ] 24.2 Implement transaction data export endpoint
    - Create POST /api/v1/exports/transactions endpoint (Creator only)
    - Accept date range filters
    - Generate CSV with transaction data (course, amount, date, status)
    - Upload CSV to S3
    - Return export job ID
    - _Requirements: 30.2_

  - [ ] 24.3 Implement reviews data export endpoint
    - Create POST /api/v1/exports/reviews endpoint (Creator only)
    - Accept course ID filter
    - Verify course ownership
    - Generate CSV with review data (student name, rating, review text, date)
    - Upload CSV to S3
    - Return export job ID
    - _Requirements: 30.3_

  - [ ] 24.4 Implement analytics PDF report generation
    - Extend course analytics endpoint to support PDF format
    - Generate PDF report with charts and tables
    - Use PDF generation library (puppeteer or pdfkit)
    - Upload PDF to S3
    - Return download URL
    - _Requirements: 30.4_

  - [ ] 24.5 Implement export download endpoint
    - Create GET /api/v1/exports/:id/download endpoint
    - Verify export ownership
    - Return presigned S3 URL for download
    - _Requirements: 30.5_

  - [ ] 24.6 Implement export processing worker
    - Create background worker to process export jobs asynchronously
    - Generate CSV/PDF files
    - Upload to S3
    - Send notification when export is ready
    - _Requirements: 30.5_


- [ ] 25. Enrollment Management
  - [ ] 25.1 Implement enrollment listing endpoint
    - Create GET /api/v1/enrollments endpoint
    - Return authenticated user's enrollments (students) or course enrollments (creators)
    - Include course details and progress information
    - Support pagination
    - Cache enrollment list in Redis (30 minute TTL)
    - _Requirements: 8.5_

  - [ ] 25.2 Implement enrollment details endpoint
    - Create GET /api/v1/enrollments/:id endpoint
    - Return detailed enrollment information
    - Include course structure, progress, and last accessed lesson
    - _Requirements: 8.5_

  - [ ] 25.3 Implement course students listing endpoint
    - Create GET /api/v1/courses/:id/students endpoint (Creator/Admin only)
    - Verify course ownership or admin role
    - Return all enrolled students with progress data
    - Support pagination
    - _Requirements: 8.5_


- [ ] 26. Input Validation and Error Handling
  - [ ] 26.1 Implement comprehensive input validation middleware
    - Create validation schemas using Joi for all endpoints
    - Validate required fields, data types, formats (email, URL)
    - Validate numeric ranges and string lengths
    - Return 400 Bad Request with descriptive error messages
    - _Requirements: 24.1, 24.2, 24.3_

  - [ ]* 26.2 Write property test for input validation
    - **Property 25: Input Validation**
    - **Validates: Requirements 24.1, 24.2, 24.3**
    - Test that invalid data always returns 400 with descriptive errors
    - Test across various invalid input types

  - [ ] 26.3 Implement global error handling middleware
    - Create error handler middleware to catch all errors
    - Return consistent error response format
    - Return 404 for resource not found
    - Return 500 for unexpected server errors
    - Log all errors with context (user ID, request ID, stack trace)
    - _Requirements: 24.5, 24.6_

  - [ ] 26.4 Implement file upload validation
    - Validate file types for videos (MP4, AVI, MOV) and resources (PDF, ZIP, DOCX, XLSX)
    - Validate file sizes (2GB for videos, 100MB for resources)
    - Return descriptive error messages for validation failures
    - _Requirements: 4.2, 4.4, 6.2, 6.3, 24.4_

  - [ ] 26.5 Implement security input sanitization
    - Sanitize all user inputs to prevent XSS attacks
    - Use parameterized queries to prevent SQL injection
    - Validate and sanitize file names
    - _Requirements: 25.5_


- [ ] 27. Security Hardening
  - [ ] 27.1 Implement CORS configuration
    - Configure CORS middleware with whitelist of allowed origins
    - Set appropriate CORS headers
    - _Requirements: 25.4_

  - [ ] 27.2 Implement security headers with Helmet.js
    - Add Helmet.js middleware for security headers
    - Configure Content Security Policy
    - Enable HSTS, X-Frame-Options, X-Content-Type-Options
    - _Requirements: 25.4_

  - [ ] 27.3 Implement request logging and security monitoring
    - Log all authentication failures with IP address and timestamp
    - Log all authorization failures
    - Set up alerts for suspicious activity patterns
    - _Requirements: 25.6_

  - [ ] 27.4 Implement data encryption configuration
    - Ensure TLS 1.3 is enforced for all API connections
    - Configure S3 server-side encryption (AES-256) for all buckets
    - Verify database encryption at rest is enabled
    - _Requirements: 25.3_


- [ ] 28. Caching Implementation
  - [ ] 28.1 Implement session caching in Redis
    - Cache user sessions with 15 minute TTL
    - Implement cache invalidation on logout
    - Key pattern: session:{userId}
    - _Requirements: 1.4_

  - [ ] 28.2 Implement course catalog caching
    - Cache published course listings with 5 minute TTL
    - Implement cache invalidation on course publish/update
    - Key pattern: courses:list:{filters_hash}
    - _Requirements: 7.1_

  - [ ] 28.3 Implement course details caching
    - Cache individual course data with 10 minute TTL
    - Include chapters and lessons in cached data
    - Implement cache invalidation on course update
    - Key pattern: course:{courseId}
    - _Requirements: 7.5_

  - [ ] 28.4 Implement enrollment caching
    - Cache user enrollments with 30 minute TTL
    - Implement cache invalidation on new enrollment
    - Key pattern: enrollments:{userId}
    - _Requirements: 8.5_

  - [ ] 28.5 Implement analytics caching
    - Cache analytics data with 1 hour TTL
    - Key pattern: analytics:{type}:{id}:{period}
    - Implement daily cache refresh via worker
    - _Requirements: 15.1, 16.1_


- [ ] 29. Message Queue Setup
  - [ ] 29.1 Implement message queue infrastructure
    - Set up AWS SQS or RabbitMQ
    - Create queues: video-processing, email-notifications, analytics-aggregation, dead-letter
    - Configure queue settings (visibility timeout, message retention)
    - _Requirements: 4.6, 23.1_

  - [ ] 29.2 Implement queue producer service
    - Create QueueService.enqueue() method
    - Support different queue types
    - Include retry logic for queue failures
    - _Requirements: 4.6, 23.1_

  - [ ] 29.3 Implement queue consumer framework
    - Create base worker class for queue consumers
    - Implement message acknowledgment and error handling
    - Support graceful shutdown
    - Move failed messages to dead letter queue after max retries
    - _Requirements: 4.6, 23.1_


- [ ] 30. Logging and Monitoring
  - [ ] 30.1 Implement application logging with Winston
    - Configure Winston logger with multiple transports (console, file, CloudWatch)
    - Set up log levels (error, warn, info, debug)
    - Include context in logs (request ID, user ID, timestamp)
    - _Requirements: 24.6_

  - [ ] 30.2 Implement error tracking with Sentry
    - Integrate Sentry SDK
    - Configure error reporting with context
    - Set up alerts for critical errors
    - _Requirements: 24.6_

  - [ ] 30.3 Implement health check endpoints
    - Create GET /health endpoint for basic health check
    - Create GET /health/detailed endpoint with database and Redis status
    - Return appropriate status codes (200 OK, 503 Service Unavailable)
    - _Requirements: 24.6_

  - [ ] 30.4 Set up CloudWatch dashboards
    - Create dashboards for API metrics (request rate, error rate, latency)
    - Create dashboards for database metrics (connection pool, query performance)
    - Create dashboards for cache metrics (hit rate, memory usage)
    - Set up alarms for critical thresholds
    - _Requirements: 24.6_


- [ ] 31. Testing Infrastructure
  - [ ] 31.1 Set up Jest testing framework
    - Configure Jest with TypeScript support
    - Set up test database with migrations
    - Configure test environment variables
    - Set up test coverage reporting
    - _Requirements: All_

  - [ ] 31.2 Set up fast-check for property-based testing
    - Install and configure fast-check
    - Create property test utilities and helpers
    - Configure minimum 100 iterations per property test
    - Set up property test tagging format
    - _Requirements: All_

  - [ ] 31.3 Create test fixtures and factories
    - Create factory functions for test data (users, courses, enrollments)
    - Create database seeding utilities for tests
    - Create mock services for external dependencies (Stripe, AWS)
    - _Requirements: All_

  - [ ] 31.4 Implement integration test utilities
    - Create test server setup and teardown utilities
    - Create authenticated request helpers for different roles
    - Create database cleanup utilities
    - _Requirements: All_


- [ ] 32. Unit Tests for Core Services
  - [ ]* 32.1 Write unit tests for AuthenticationService
    - Test registration with valid and invalid data
    - Test login with correct and incorrect credentials
    - Test token generation and validation
    - Test password reset flow
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [ ]* 32.2 Write unit tests for AuthorizationService
    - Test role-based permission checks
    - Test course ownership validation
    - Test enrollment verification
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 32.3 Write unit tests for CourseService
    - Test course CRUD operations
    - Test course status transitions
    - Test chapter and lesson management
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

  - [ ]* 32.4 Write unit tests for PaymentService
    - Test payment intent creation
    - Test revenue split calculation
    - Test coupon application
    - Test webhook handling
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 29.3, 29.4_

  - [ ]* 32.5 Write unit tests for ProgressTracker
    - Test lesson completion tracking
    - Test course progress calculation
    - Test video position tracking
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

  - [ ]* 32.6 Write unit tests for CertificateGenerator
    - Test certificate generation logic
    - Test certificate uniqueness
    - Test certificate verification
    - _Requirements: 11.1, 11.2, 11.4_


- [ ] 33. Integration Tests
  - [ ]* 33.1 Write integration tests for authentication flow
    - Test complete registration → login → token refresh → logout flow
    - Test password reset flow end-to-end
    - Test authentication failures and error responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [ ]* 33.2 Write integration tests for course creation and approval workflow
    - Test creator creates course → submits for review → admin approves → course published
    - Test rejection workflow with notifications
    - _Requirements: 3.1, 3.8, 14.1, 14.3, 14.4_

  - [ ]* 33.3 Write integration tests for enrollment and payment flow
    - Test course purchase → payment success → enrollment creation → access granted
    - Test payment failure handling
    - Test coupon application in purchase flow
    - _Requirements: 8.1, 8.2, 8.3, 29.3_

  - [ ]* 33.4 Write integration tests for progress tracking and certificate generation
    - Test lesson completion → progress update → course completion → certificate generation
    - Test certificate retrieval and verification
    - _Requirements: 10.1, 10.3, 11.1, 11.2_

  - [ ]* 33.5 Write integration tests for video upload and streaming
    - Test video upload → transcoding → streaming URL generation
    - Test enrollment-based access control for videos
    - _Requirements: 4.1, 4.6, 5.1, 5.3_


- [ ] 34. API Documentation
  - [ ] 34.1 Set up Swagger/OpenAPI documentation
    - Install and configure swagger-jsdoc and swagger-ui-express
    - Create OpenAPI specification file
    - Document all API endpoints with request/response schemas
    - Add authentication requirements to documentation
    - _Requirements: All_

  - [ ] 34.2 Document API endpoints with JSDoc comments
    - Add JSDoc comments to all controller methods
    - Document request parameters, body, and responses
    - Include example requests and responses
    - _Requirements: All_

  - [ ] 34.3 Create API usage guide
    - Document authentication flow
    - Document common use cases (course creation, enrollment, progress tracking)
    - Document error codes and handling
    - Document rate limiting and pagination
    - _Requirements: All_


- [ ] 35. Performance Optimization
  - [ ] 35.1 Implement database query optimization
    - Review and optimize N+1 query problems
    - Add missing indexes based on query patterns
    - Implement query result pagination for large datasets
    - Use database connection pooling efficiently
    - _Requirements: 7.1, 7.5, 19.4_

  - [ ] 35.2 Implement API response optimization
    - Add response compression (gzip) for responses > 1KB
    - Implement ETag support for cache validation
    - Implement field selection to allow clients to request specific fields
    - _Requirements: 7.5_

  - [ ] 35.3 Optimize video streaming performance
    - Configure CloudFront edge caching with 24-hour TTL
    - Implement thumbnail pre-generation during transcoding
    - Optimize HLS segment size for adaptive streaming
    - _Requirements: 5.1, 5.2_

  - [ ] 35.4 Implement database read replicas
    - Configure PostgreSQL read replicas
    - Route read queries to replicas
    - Route write queries to primary database
    - _Requirements: 7.1, 15.1, 16.1_


- [ ] 36. Deployment Configuration
  - [ ] 36.1 Create Docker configuration
    - Create Dockerfile for Node.js application
    - Create docker-compose.yml for local development (API, PostgreSQL, Redis)
    - Configure environment-specific settings
    - _Requirements: All_

  - [ ] 36.2 Create deployment scripts
    - Create database migration scripts for production
    - Create deployment script for AWS (ECS, EC2, or Lambda)
    - Configure auto-scaling policies
    - _Requirements: All_

  - [ ] 36.3 Set up CI/CD pipeline
    - Configure GitHub Actions or similar for automated testing
    - Set up automated deployment to staging and production
    - Configure environment-specific secrets and variables
    - _Requirements: All_

  - [ ] 36.4 Create infrastructure as code
    - Create Terraform or CloudFormation templates for AWS resources
    - Define VPC, subnets, security groups
    - Define RDS, ElastiCache, S3, CloudFront, SES configurations
    - _Requirements: All_


- [ ] 37. Final Integration and Testing
  - [ ] 37.1 Checkpoint - Run all tests and verify functionality
    - Run all unit tests and ensure they pass
    - Run all property-based tests and ensure they pass
    - Run all integration tests and ensure they pass
    - Verify test coverage meets minimum threshold (80%)
    - Ensure all tests pass, ask the user if questions arise.

  - [ ] 37.2 Perform end-to-end testing
    - Test complete user journeys for all three roles (Student, Creator, Admin)
    - Test error scenarios and edge cases
    - Test concurrent operations and race conditions
    - Verify all API endpoints return correct responses
    - _Requirements: All_

  - [ ] 37.3 Perform security audit
    - Review authentication and authorization implementation
    - Test for common vulnerabilities (SQL injection, XSS, CSRF)
    - Verify rate limiting and input validation
    - Review error messages for information leakage
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 37.4 Perform performance testing
    - Load test with 1000 concurrent users
    - Test video streaming with 100 concurrent streams
    - Test payment processing with 50 concurrent purchases
    - Verify API response times meet requirements (< 200ms for 95th percentile)
    - _Requirements: All_

  - [ ] 37.5 Final checkpoint - Verify all requirements are met
    - Review all 30 requirements and verify implementation
    - Review all 30 correctness properties and verify tests
    - Verify all API endpoints are documented
    - Verify deployment configuration is complete
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Checkpoints ensure incremental validation at major milestones
- All implementation uses TypeScript with Node.js and Express.js
- The system uses PostgreSQL for data storage, Redis for caching, and AWS services for infrastructure
