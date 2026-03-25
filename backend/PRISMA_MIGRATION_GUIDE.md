# Prisma Migration Guide

This guide documents the migration from the pg library with raw SQL queries to Prisma ORM, and provides instructions for working with Prisma in the Learnify backend.

## Table of Contents

- [Migration Overview](#migration-overview)
- [What Changed](#what-changed)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Migration Overview

The Learnify backend has been migrated from using the `pg` library with raw SQL queries to Prisma ORM. This migration provides:

- **Type Safety**: Compile-time verification of database operations
- **Better Developer Experience**: Auto-completion and IntelliSense for database queries
- **Simplified Migrations**: Declarative schema management
- **Improved Maintainability**: Less boilerplate code and clearer data access patterns

### What Was Migrated

- ✅ All 24 database tables defined in Prisma schema
- ✅ UserRepository, CourseRepository, and RefreshTokenRepository converted to Prisma
- ✅ Database connection management replaced with Prisma Client singleton
- ✅ Migration system changed from node-pg-migrate to Prisma Migrate
- ✅ All tests updated to use Prisma Client
- ✅ Error handling updated for Prisma error types

## What Changed

### Before: pg Library

```typescript
// Old approach with raw SQL
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function findUserById(id: string) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}
```

### After: Prisma ORM

```typescript
// New approach with Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id }
  });
}
```

### Key Differences

1. **No Manual SQL**: Prisma provides a type-safe query builder
2. **Automatic Type Generation**: TypeScript types are generated from the schema
3. **Connection Management**: Prisma handles connection pooling automatically
4. **Schema-First**: Database schema is defined in `prisma/schema.prisma`
5. **Migration System**: Declarative migrations instead of imperative SQL scripts

## Development Workflow

### Making Schema Changes

When you need to modify the database schema:

1. **Edit the Prisma Schema**
   
   Open `prisma/schema.prisma` and make your changes:
   
   ```prisma
   model User {
     id         String   @id @default(uuid()) @db.Uuid
     email      String   @unique @db.VarChar(255)
     first_name String   @db.VarChar(100)
     last_name  String   @db.VarChar(100)
     // Add new field
     phone      String?  @db.VarChar(20)
     
     @@index([email])
     @@map("users")
   }
   ```

2. **Create a Migration**
   
   ```bash
   npm run prisma:migrate:dev --name add_user_phone
   ```
   
   This command will:
   - Generate a SQL migration file in `prisma/migrations/`
   - Apply the migration to your development database
   - Regenerate Prisma Client with updated types

3. **Update Your Code**
   
   TypeScript will now recognize the new field:
   
   ```typescript
   const user = await prisma.user.create({
     data: {
       email: 'user@example.com',
       first_name: 'John',
       last_name: 'Doe',
       phone: '+1234567890', // New field with type safety
     }
   });
   ```

### Regenerating Prisma Client

After pulling schema changes from git, regenerate the client:

```bash
npm run prisma:generate
```

This is automatically run after `npm install` via the `postinstall` script.

### Inspecting the Database

Use Prisma Studio to visually browse and edit data:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555`.

### Resetting the Database

To reset your development database (WARNING: deletes all data):

```bash
npm run prisma:migrate:reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations
4. Run seed scripts (if configured)

## Production Deployment

### Deploying Migrations

In production, use `migrate deploy` instead of `migrate dev`:

```bash
npm run prisma:migrate:deploy
```

This command:
- Applies pending migrations
- Does NOT create new migrations
- Does NOT prompt for input
- Is safe for CI/CD pipelines

### Deployment Checklist

1. **Set DATABASE_URL**: Ensure the production database URL is configured
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

2. **Run Migrations**: Apply pending migrations
   ```bash
   npm run prisma:migrate:deploy
   ```

3. **Generate Client**: Ensure Prisma Client is generated
   ```bash
   npm run prisma:generate
   ```

4. **Start Application**: The application will use the generated client
   ```bash
   npm start
   ```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Generate Prisma Client
  run: npm run prisma:generate

- name: Run migrations
  run: npm run prisma:migrate:deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Run tests
  run: npm test
```

## Common Tasks

### Adding a New Model

1. Add the model to `prisma/schema.prisma`:

```prisma
model Category {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(100)
  description String?  @db.Text
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  courses Course[]
  
  @@index([name])
  @@map("categories")
}
```

2. Add the relation to existing models:

```prisma
model Course {
  // ... existing fields
  category_id String?   @db.Uuid
  category    Category? @relation(fields: [category_id], references: [id])
}
```

3. Create and apply the migration:

```bash
npm run prisma:migrate:dev --name add_categories
```

### Adding an Index

1. Add the index to your model:

```prisma
model Course {
  // ... fields
  
  @@index([status, published_at])
  @@index([creator_id, status])
}
```

2. Create the migration:

```bash
npm run prisma:migrate:dev --name add_course_indexes
```

### Modifying a Field

1. Update the field in the schema:

```prisma
model User {
  // Change from optional to required
  bio String @db.Text  // was: bio String? @db.Text
}
```

2. Create the migration:

```bash
npm run prisma:migrate:dev --name make_bio_required
```

3. Prisma will prompt you if data migration is needed

### Creating a Repository

Follow the repository pattern used in the codebase:

```typescript
import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';

export class CategoryRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    // Accept optional client for transaction support
    this.prisma = prismaClient || prisma;
  }

  async create(data: { name: string; description?: string }) {
    return await this.prisma.category.create({
      data
    });
  }

  async findById(id: string) {
    return await this.prisma.category.findUnique({
      where: { id }
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    return await this.prisma.category.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await this.prisma.category.delete({
      where: { id }
    });
  }
}
```

### Using Transactions

Execute multiple operations atomically:

```typescript
import { prisma } from '../config/prisma';

async function transferCourse(courseId: string, newCreatorId: string) {
  return await prisma.$transaction(async (tx) => {
    // All operations use the transaction client
    const course = await tx.course.update({
      where: { id: courseId },
      data: { creator_id: newCreatorId }
    });

    await tx.notification.create({
      data: {
        user_id: newCreatorId,
        type: 'course_transfer',
        title: 'Course Transferred',
        message: `You are now the creator of ${course.title}`,
      }
    });

    return course;
  });
}
```

### Querying Relations

Load related data efficiently:

```typescript
// Include related data
const course = await prisma.course.findUnique({
  where: { id: courseId },
  include: {
    creator: true,
    chapters: {
      include: {
        lessons: {
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { order_index: 'asc' }
    },
    course_tags: {
      select: { tag: true }
    }
  }
});

// Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    first_name: true,
    last_name: true,
  }
});
```

### Pagination

Implement cursor-based or offset-based pagination:

```typescript
// Offset-based pagination
async function getCourses(page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    }),
    prisma.course.count()
  ]);
  
  return {
    courses,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

// Cursor-based pagination
async function getCoursesAfter(cursor: string, limit: number) {
  return await prisma.course.findMany({
    take: limit,
    skip: 1, // Skip the cursor
    cursor: { id: cursor },
    orderBy: { created_at: 'desc' }
  });
}
```

## Troubleshooting

### Migration Conflicts

**Problem**: Migration fails due to conflicts

**Solution**: 
1. Check the migration file in `prisma/migrations/`
2. Manually resolve conflicts in the SQL
3. Apply the migration again

### Schema Out of Sync

**Problem**: "Schema is out of sync with the database"

**Solution**:
```bash
# Pull the current database schema
npm run prisma:db:pull

# Or reset and reapply migrations
npm run prisma:migrate:reset
```

### Prisma Client Not Generated

**Problem**: TypeScript errors about missing Prisma types

**Solution**:
```bash
npm run prisma:generate
```

### Connection Issues

**Problem**: "Can't reach database server"

**Solution**:
1. Check DATABASE_URL in `.env`
2. Verify PostgreSQL is running
3. Check network connectivity
4. Verify credentials

### Type Errors After Schema Changes

**Problem**: TypeScript errors after modifying schema

**Solution**:
1. Regenerate Prisma Client: `npm run prisma:generate`
2. Restart TypeScript server in your IDE
3. Clear TypeScript cache if needed

### Migration Already Applied

**Problem**: "Migration has already been applied"

**Solution**:
```bash
# Mark migration as applied without running it
npx prisma migrate resolve --applied <migration_name>

# Or mark as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

### Performance Issues

**Problem**: Slow queries

**Solution**:
1. Add indexes to frequently queried fields
2. Use `select` to limit returned fields
3. Use `include` instead of multiple queries
4. Enable query logging to identify slow queries:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate Reference](https://www.prisma.io/docs/reference/api-reference/command-reference#prisma-migrate)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Support

If you encounter issues not covered in this guide:

1. Check the [Prisma GitHub Issues](https://github.com/prisma/prisma/issues)
2. Ask in the team's Slack channel
3. Consult the [Prisma Community Discord](https://discord.gg/prisma)
