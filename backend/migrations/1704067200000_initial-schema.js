/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Note: Supabase PostgreSQL 13+ has gen_random_uuid() built-in, no extension needed
  // But we'll still try to create uuid-ossp for compatibility
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    first_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    last_name: {
      type: 'varchar(100)',
      notNull: true,
    },
    role: {
      type: 'varchar(20)',
      notNull: true,
      check: "role IN ('student', 'creator', 'admin')",
    },
    is_active: {
      type: 'boolean',
      default: true,
    },
    profile_image_url: 'text',
    bio: 'text',
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for users
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');

  // Courses table
  pgm.createTable('courses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    creator_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: true,
    },
    thumbnail_url: 'text',
    trailer_video_id: 'uuid',
    category: {
      type: 'varchar(100)',
      notNull: true,
    },
    difficulty_level: {
      type: 'varchar(20)',
      check: "difficulty_level IN ('beginner', 'intermediate', 'advanced')",
    },
    price: {
      type: 'decimal(10, 2)',
      notNull: true,
    },
    discount_price: 'decimal(10, 2)',
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'draft',
      check: "status IN ('draft', 'pending', 'published', 'rejected')",
    },
    rejection_reason: 'text',
    average_rating: {
      type: 'decimal(3, 2)',
      default: 0,
    },
    total_ratings: {
      type: 'integer',
      default: 0,
    },
    total_enrollments: {
      type: 'integer',
      default: 0,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    published_at: 'timestamp',
  });

  // Create indexes for courses
  pgm.createIndex('courses', 'creator_id');
  pgm.createIndex('courses', 'status');
  pgm.createIndex('courses', 'category');
  pgm.createIndex('courses', 'published_at', { where: "status = 'published'" });

  // Course tags table
  pgm.createTable('course_tags', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    tag: {
      type: 'varchar(50)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for course_tags
  pgm.createIndex('course_tags', 'course_id');
  pgm.createIndex('course_tags', 'tag');
  pgm.createIndex('course_tags', ['course_id', 'tag'], { unique: true });

  // Chapters table
  pgm.createTable('chapters', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: 'text',
    order_index: {
      type: 'integer',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for chapters
  pgm.createIndex('chapters', 'course_id');
  pgm.createIndex('chapters', ['course_id', 'order_index']);

  // Lessons table
  pgm.createTable('lessons', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    chapter_id: {
      type: 'uuid',
      notNull: true,
      references: 'chapters(id)',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: 'text',
    lesson_type: {
      type: 'varchar(20)',
      notNull: true,
      check: "lesson_type IN ('video', 'quiz', 'reading', 'assignment')",
    },
    content: 'jsonb',
    duration_minutes: 'integer',
    order_index: {
      type: 'integer',
      notNull: true,
    },
    is_preview: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for lessons
  pgm.createIndex('lessons', 'chapter_id');
  pgm.createIndex('lessons', ['chapter_id', 'order_index']);
  pgm.createIndex('lessons', 'lesson_type');

  // Videos table
  pgm.createTable('videos', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    uploader_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
    },
    original_filename: {
      type: 'varchar(255)',
      notNull: true,
    },
    s3_key: {
      type: 'text',
      notNull: true,
    },
    duration_seconds: 'integer',
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'processing', 'ready', 'failed')",
    },
    error_message: 'text',
    resolutions: 'jsonb',
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for videos
  pgm.createIndex('videos', 'uploader_id');
  pgm.createIndex('videos', 'status');

  // Resources table
  pgm.createTable('resources', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    lesson_id: {
      type: 'uuid',
      notNull: true,
      references: 'lessons(id)',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    file_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    file_size_bytes: {
      type: 'bigint',
      notNull: true,
    },
    file_url: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for resources
  pgm.createIndex('resources', 'lesson_id');

  // Enrollments table
  pgm.createTable('enrollments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    enrolled_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    last_accessed_at: 'timestamp',
  });

  // Create indexes for enrollments
  pgm.createIndex('enrollments', 'student_id');
  pgm.createIndex('enrollments', 'course_id');
  pgm.createIndex('enrollments', ['student_id', 'course_id'], { unique: true });

  // Lesson progress table
  pgm.createTable('lesson_progress', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    lesson_id: {
      type: 'uuid',
      notNull: true,
      references: 'lessons(id)',
      onDelete: 'CASCADE',
    },
    is_completed: {
      type: 'boolean',
      default: false,
    },
    completed_at: 'timestamp',
    last_accessed_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    video_position_seconds: {
      type: 'integer',
      default: 0,
    },
  });

  // Create indexes for lesson_progress
  pgm.createIndex('lesson_progress', 'student_id');
  pgm.createIndex('lesson_progress', 'lesson_id');
  pgm.createIndex('lesson_progress', ['student_id', 'lesson_id'], { unique: true });

  // Quiz attempts table
  pgm.createTable('quiz_attempts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    lesson_id: {
      type: 'uuid',
      notNull: true,
      references: 'lessons(id)',
      onDelete: 'CASCADE',
    },
    answers: {
      type: 'jsonb',
      notNull: true,
    },
    score: {
      type: 'decimal(5, 2)',
      notNull: true,
    },
    attempted_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for quiz_attempts
  pgm.createIndex('quiz_attempts', 'student_id');
  pgm.createIndex('quiz_attempts', 'lesson_id');

  // Assignment submissions table
  pgm.createTable('assignment_submissions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    lesson_id: {
      type: 'uuid',
      notNull: true,
      references: 'lessons(id)',
      onDelete: 'CASCADE',
    },
    submission_url: {
      type: 'text',
      notNull: true,
    },
    submitted_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    grade: 'decimal(5, 2)',
    feedback: 'text',
    graded_at: 'timestamp',
    graded_by: {
      type: 'uuid',
      references: 'users(id)',
    },
  });

  // Create indexes for assignment_submissions
  pgm.createIndex('assignment_submissions', 'student_id');
  pgm.createIndex('assignment_submissions', 'lesson_id');

  // Certificates table
  pgm.createTable('certificates', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    certificate_number: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    issued_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    pdf_url: {
      type: 'text',
      notNull: true,
    },
  });

  // Create indexes for certificates
  pgm.createIndex('certificates', 'student_id');
  pgm.createIndex('certificates', 'course_id');
  pgm.createIndex('certificates', 'certificate_number');
  pgm.createIndex('certificates', ['student_id', 'course_id'], { unique: true });

  // Transactions table
  pgm.createTable('transactions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
    },
    creator_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
    },
    amount: {
      type: 'decimal(10, 2)',
      notNull: true,
    },
    platform_fee: {
      type: 'decimal(10, 2)',
      notNull: true,
    },
    creator_earnings: {
      type: 'decimal(10, 2)',
      notNull: true,
    },
    stripe_payment_id: 'varchar(255)',
    status: {
      type: 'varchar(20)',
      notNull: true,
      check: "status IN ('pending', 'completed', 'failed', 'refunded')",
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for transactions
  pgm.createIndex('transactions', 'student_id');
  pgm.createIndex('transactions', 'creator_id');
  pgm.createIndex('transactions', 'course_id');
  pgm.createIndex('transactions', 'status');

  // Withdrawals table
  pgm.createTable('withdrawals', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    creator_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
    },
    amount: {
      type: 'decimal(10, 2)',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      check: "status IN ('pending', 'processing', 'completed', 'failed')",
    },
    stripe_transfer_id: 'varchar(255)',
    requested_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    processed_at: 'timestamp',
  });

  // Create indexes for withdrawals
  pgm.createIndex('withdrawals', 'creator_id');
  pgm.createIndex('withdrawals', 'status');

  // Reviews table
  pgm.createTable('reviews', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    rating: {
      type: 'integer',
      notNull: true,
      check: 'rating >= 1 AND rating <= 5',
    },
    review_text: 'text',
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for reviews
  pgm.createIndex('reviews', 'student_id');
  pgm.createIndex('reviews', 'course_id');
  pgm.createIndex('reviews', 'rating');
  pgm.createIndex('reviews', ['student_id', 'course_id'], { unique: true });

  // Comments table
  pgm.createTable('comments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    lesson_id: {
      type: 'uuid',
      notNull: true,
      references: 'lessons(id)',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    parent_comment_id: {
      type: 'uuid',
      references: 'comments(id)',
      onDelete: 'CASCADE',
    },
    content: {
      type: 'text',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for comments
  pgm.createIndex('comments', 'lesson_id');
  pgm.createIndex('comments', 'user_id');
  pgm.createIndex('comments', 'parent_comment_id');

  // Notes table
  pgm.createTable('notes', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    lesson_id: {
      type: 'uuid',
      notNull: true,
      references: 'lessons(id)',
      onDelete: 'CASCADE',
    },
    content: {
      type: 'text',
      notNull: true,
    },
    video_timestamp_seconds: 'integer',
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for notes
  pgm.createIndex('notes', 'student_id');
  pgm.createIndex('notes', 'lesson_id');

  // Notifications table
  pgm.createTable('notifications', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    message: {
      type: 'text',
      notNull: true,
    },
    related_entity_type: 'varchar(50)',
    related_entity_id: 'uuid',
    is_read: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for notifications
  pgm.createIndex('notifications', 'user_id');
  pgm.createIndex('notifications', ['user_id', 'is_read']);

  // Wishlists table
  pgm.createTable('wishlists', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    added_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for wishlists
  pgm.createIndex('wishlists', 'student_id');
  pgm.createIndex('wishlists', 'course_id');
  pgm.createIndex('wishlists', ['student_id', 'course_id'], { unique: true });

  // Coupons table
  pgm.createTable('coupons', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    course_id: {
      type: 'uuid',
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE',
    },
    code: {
      type: 'varchar(50)',
      notNull: true,
      unique: true,
    },
    discount_percentage: {
      type: 'integer',
      notNull: true,
      check: 'discount_percentage > 0 AND discount_percentage <= 100',
    },
    max_uses: 'integer',
    current_uses: {
      type: 'integer',
      default: 0,
    },
    expires_at: 'timestamp',
    is_active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for coupons
  pgm.createIndex('coupons', 'code');
  pgm.createIndex('coupons', 'course_id');
  pgm.createIndex('coupons', ['is_active', 'expires_at']);

  // Refresh tokens table
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    token_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    revoked_at: 'timestamp',
  });

  // Create indexes for refresh_tokens
  pgm.createIndex('refresh_tokens', 'user_id');
  pgm.createIndex('refresh_tokens', 'token_hash');
};

exports.down = pgm => {
  // Drop tables in reverse order due to foreign key constraints
  pgm.dropTable('refresh_tokens');
  pgm.dropTable('coupons');
  pgm.dropTable('wishlists');
  pgm.dropTable('notifications');
  pgm.dropTable('notes');
  pgm.dropTable('comments');
  pgm.dropTable('reviews');
  pgm.dropTable('withdrawals');
  pgm.dropTable('transactions');
  pgm.dropTable('certificates');
  pgm.dropTable('assignment_submissions');
  pgm.dropTable('quiz_attempts');
  pgm.dropTable('lesson_progress');
  pgm.dropTable('enrollments');
  pgm.dropTable('resources');
  pgm.dropTable('videos');
  pgm.dropTable('lessons');
  pgm.dropTable('chapters');
  pgm.dropTable('course_tags');
  pgm.dropTable('courses');
  pgm.dropTable('users');
  
  // Drop extension
  pgm.dropExtension('uuid-ossp');
};