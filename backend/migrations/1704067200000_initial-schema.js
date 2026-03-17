/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Enable UUID extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
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
      default: pgm.func('uuid_generate_v4()'),
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
      default: pgm.func('uuid_generate_v4()'),
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
      default: pgm.func('uuid_generate_v4()'),
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
      default: pgm.func('uuid_generate_v4()'),
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
      default: pgm.func('uuid_generate_v4()'),
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
      default: pgm.func('uuid_generate_v4()'),
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
      default: pgm.func('uuid_generate_v4()'),
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
};

exports.down = pgm => {
  // Drop tables in reverse order due to foreign key constraints
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