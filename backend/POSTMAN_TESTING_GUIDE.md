# Postman Testing Guide for Learnify Backend API

This guide will help you test the implemented endpoints using Postman.

## Prerequisites

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The server should be running on `http://localhost:3001`

2. **Ensure Services are Running**
   - PostgreSQL database
   - Redis cache
   - AWS services (optional for basic testing)

3. **Check Health Status**
   Open your browser or Postman and visit: `http://localhost:3001/health`
   
   You should see a response like:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "uptime": 123.456,
     "services": {
       "database": "connected",
       "redis": "connected",
       "aws": {
         "s3": "connected",
         "ses": "connected",
         "mediaConvert": "connected"
       }
     },
     "version": "1.0.0"
   }
   ```

## Postman Setup

### Option 1: Import Postman Collection (Recommended)

I'll create a Postman collection file for you. Save the JSON below as `Learnify_API.postman_collection.json` and import it into Postman.

### Option 2: Manual Setup

Follow the step-by-step instructions below to create requests manually.

---

## Environment Variables Setup

Create a Postman Environment with these variables:

1. Click "Environments" in Postman
2. Click "+" to create a new environment
3. Name it "Learnify Local"
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:3001` | `http://localhost:3001` |
| `access_token` | (leave empty) | (will be set automatically) |
| `refresh_token` | (leave empty) | (will be set automatically) |
| `user_id` | (leave empty) | (will be set automatically) |
| `course_id` | (leave empty) | (will be set automatically) |

---

## Testing Workflow

### Step 1: Health Check

**Request:**
- Method: `GET`
- URL: `{{base_url}}/health`
- Headers: None required

**Expected Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "services": {
    "database": "connected",
    "redis": "connected",
    "aws": { ... }
  },
  "version": "1.0.0"
}
```

---

### Step 2: Register a New User (Student)

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Postman Test Script (Auto-save tokens):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.tokens.accessToken);
    pm.environment.set("refresh_token", response.data.tokens.refreshToken);
    pm.environment.set("user_id", response.data.user.id);
    console.log("Tokens saved to environment");
}
```

---

### Step 3: Register a Creator User

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "creator@example.com",
  "password": "CreatorPass123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "creator"
}
```

**Expected Response (201 Created):**
Similar to Step 2, but with `"role": "creator"`

**Postman Test Script:**
Same as Step 2 to auto-save tokens.

---

### Step 4: Login

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "creator@example.com",
  "password": "CreatorPass123!"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "creator@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "creator"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.tokens.accessToken);
    pm.environment.set("refresh_token", response.data.tokens.refreshToken);
    pm.environment.set("user_id", response.data.user.id);
    console.log("Tokens saved to environment");
}
```

---

### Step 5: Refresh Access Token

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/auth/refresh`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token-here",
    "refreshToken": "new-refresh-token-here"
  }
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.accessToken);
    pm.environment.set("refresh_token", response.data.refreshToken);
    console.log("Tokens refreshed and saved");
}
```

---

### Step 6: Create a Course (Creator Only)

**Important:** Make sure you're logged in as a creator (use the creator tokens).

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/courses`
- Headers:
  - `Authorization: Bearer {{access_token}}`
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "title": "Introduction to TypeScript",
  "description": "Learn TypeScript from scratch with hands-on examples",
  "price": 49.99,
  "level": "beginner",
  "tags": ["typescript", "programming", "web-development"]
}
```

**Expected Response (201 Created):**
```json
{
  "id": "course-uuid-here",
  "title": "Introduction to TypeScript",
  "description": "Learn TypeScript from scratch with hands-on examples",
  "price": 49.99,
  "level": "beginner",
  "status": "draft",
  "creatorId": "creator-uuid-here",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Postman Test Script:**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("course_id", response.id);
    console.log("Course ID saved:", response.id);
}
```

---

### Step 7: Create Course with Thumbnail (Multipart Form Data)

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/courses`
- Headers:
  - `Authorization: Bearer {{access_token}}`
- Body (form-data):
  - `title`: `Advanced Node.js`
  - `description`: `Master Node.js with advanced concepts`
  - `price`: `79.99`
  - `level`: `advanced`
  - `tags`: `["nodejs", "backend", "javascript"]` (as text)
  - `thumbnail`: (select a file - JPEG, PNG, GIF, or WebP)

**Expected Response (201 Created):**
Similar to Step 6, but with `thumbnailUrl` field populated.

---

### Step 8: Get All Published Courses (Public)

**Request:**
- Method: `GET`
- URL: `{{base_url}}/api/v1/courses?page=1&limit=20`
- Headers: None required (public endpoint)

**Expected Response (200 OK):**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Introduction to TypeScript",
      "description": "Learn TypeScript from scratch",
      "price": 49.99,
      "level": "beginner",
      "status": "published",
      "thumbnailUrl": "https://...",
      "creatorId": "uuid",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### Step 9: Get Course by ID

**Request:**
- Method: `GET`
- URL: `{{base_url}}/api/v1/courses/{{course_id}}`
- Headers: None required

**Expected Response (200 OK):**
```json
{
  "id": "course-uuid",
  "title": "Introduction to TypeScript",
  "description": "Learn TypeScript from scratch",
  "price": 49.99,
  "level": "beginner",
  "status": "draft",
  "thumbnailUrl": null,
  "creatorId": "creator-uuid",
  "creator": {
    "id": "creator-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "creator@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Step 10: Update Course (Owner Only)

**Request:**
- Method: `PUT`
- URL: `{{base_url}}/api/v1/courses/{{course_id}}`
- Headers:
  - `Authorization: Bearer {{access_token}}`
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "title": "Introduction to TypeScript - Updated",
  "description": "Learn TypeScript from scratch with updated content",
  "price": 59.99,
  "level": "intermediate"
}
```

**Expected Response (200 OK):**
Updated course object with new values.

---

### Step 11: Get My Courses (Creator Only)

**Request:**
- Method: `GET`
- URL: `{{base_url}}/api/v1/courses/my?page=1&limit=20`
- Headers:
  - `Authorization: Bearer {{access_token}}`

**Expected Response (200 OK):**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Introduction to TypeScript",
      "status": "draft",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### Step 12: Submit Course for Review (Creator Only)

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/courses/{{course_id}}/submit`
- Headers:
  - `Authorization: Bearer {{access_token}}`

**Expected Response (200 OK):**
```json
{
  "id": "course-uuid",
  "title": "Introduction to TypeScript",
  "status": "pending",
  ...
}
```

---

### Step 13: Delete Course (Owner Only, Draft Only)

**Request:**
- Method: `DELETE`
- URL: `{{base_url}}/api/v1/courses/{{course_id}}`
- Headers:
  - `Authorization: Bearer {{access_token}}`

**Expected Response (204 No Content):**
Empty response body.

**Note:** Only draft courses can be deleted. If you try to delete a published or pending course, you'll get a 400 error.

---

### Step 14: Logout

**Request:**
- Method: `POST`
- URL: `{{base_url}}/api/v1/auth/logout`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Course not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Email already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## Testing Tips

### 1. Use Environment Variables
Always use `{{base_url}}`, `{{access_token}}`, etc. instead of hardcoding values.

### 2. Auto-Save Tokens
Add the test scripts provided above to automatically save tokens after login/register.

### 3. Test Different Roles
- Create both student and creator accounts
- Test that students cannot create courses (403 Forbidden)
- Test that creators can create courses

### 4. Test Authorization
- Try accessing protected endpoints without tokens (401)
- Try updating someone else's course (403)
- Try deleting a published course (400)

### 5. Test Validation
- Try registering with invalid email
- Try creating course with missing required fields
- Try uploading invalid file types

### 6. Test Pagination
- Create multiple courses
- Test different page and limit values
- Verify pagination metadata

---

## Postman Collection JSON

Save this as `Learnify_API.postman_collection.json` and import into Postman:

```json
{
  "info": {
    "name": "Learnify Backend API",
    "description": "Complete API collection for Learnify Backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register Student",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('access_token', response.data.tokens.accessToken);",
                  "    pm.environment.set('refresh_token', response.data.tokens.refreshToken);",
                  "    pm.environment.set('user_id', response.data.user.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"SecurePass123!\",\n  \"first_name\": \"John\",\n  \"last_name\": \"Doe\",\n  \"role\": \"student\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/auth/register",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "auth", "register"]
            }
          }
        },
        {
          "name": "Register Creator",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('access_token', response.data.tokens.accessToken);",
                  "    pm.environment.set('refresh_token', response.data.tokens.refreshToken);",
                  "    pm.environment.set('user_id', response.data.user.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"creator@example.com\",\n  \"password\": \"CreatorPass123!\",\n  \"first_name\": \"Jane\",\n  \"last_name\": \"Smith\",\n  \"role\": \"creator\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/auth/register",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('access_token', response.data.tokens.accessToken);",
                  "    pm.environment.set('refresh_token', response.data.tokens.refreshToken);",
                  "    pm.environment.set('user_id', response.data.user.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"creator@example.com\",\n  \"password\": \"CreatorPass123!\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "auth", "login"]
            }
          }
        },
        {
          "name": "Refresh Token",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('access_token', response.data.accessToken);",
                  "    pm.environment.set('refresh_token', response.data.refreshToken);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"refreshToken\": \"{{refresh_token}}\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/auth/refresh",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "auth", "refresh"]
            }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"refreshToken\": \"{{refresh_token}}\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/auth/logout",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "auth", "logout"]
            }
          }
        }
      ]
    },
    {
      "name": "Courses",
      "item": [
        {
          "name": "Create Course",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('course_id', response.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Introduction to TypeScript\",\n  \"description\": \"Learn TypeScript from scratch with hands-on examples\",\n  \"price\": 49.99,\n  \"level\": \"beginner\",\n  \"tags\": [\"typescript\", \"programming\", \"web-development\"]\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/courses",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "courses"]
            }
          }
        },
        {
          "name": "Get All Courses",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/v1/courses?page=1&limit=20",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "courses"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "20"
                }
              ]
            }
          }
        },
        {
          "name": "Get Course by ID",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/v1/courses/{{course_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "courses", "{{course_id}}"]
            }
          }
        },
        {
          "name": "Update Course",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Introduction to TypeScript - Updated\",\n  \"description\": \"Learn TypeScript from scratch with updated content\",\n  \"price\": 59.99,\n  \"level\": \"intermediate\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/v1/courses/{{course_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "courses", "{{course_id}}"]
            }
          }
        },
        {
          "name": "Get My Courses",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/courses/my?page=1&limit=20",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "courses", "my"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "20"
                }
              ]
            }
          }
        },
        {
          "name": "Submit Course for Review",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/courses/{{course_id}}/submit",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "courses", "{{course_id}}", "submit"]
            }
          }
        },
        {
          "name": "Delete Course",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/v1/courses/{{course_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "v1", "courses", "{{course_id}}"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Next Steps

After testing these endpoints, you can continue implementing:
- Chapter management endpoints
- Lesson management endpoints
- Video upload and streaming
- Payment processing
- Progress tracking
- And more...

Happy testing! 🚀
