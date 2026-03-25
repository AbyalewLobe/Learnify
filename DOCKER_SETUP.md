# Docker Setup for Learnify Backend

This guide will help you run the Learnify backend using Docker Desktop with PostgreSQL and Redis.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Build and Start All Services

From the project root directory (where `docker-compose.yml` is located):

```bash
docker-compose up --build
```

This will:
- Build the backend Docker image
- Start PostgreSQL database
- Start Redis cache
- Start the backend API server

### 2. Run Database Migrations

After the services are running, open a new terminal and run:

```bash
docker-compose exec backend npm run migrate:up
```

### 3. Access the Application

- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api-docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Docker Commands

### Start Services (Detached Mode)

```bash
docker-compose up -d
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Rebuild Backend Only

```bash
docker-compose up --build backend
```

### Execute Commands in Backend Container

```bash
# Run migrations
docker-compose exec backend npm run migrate:up

# Access backend shell
docker-compose exec backend sh

# Run tests
docker-compose exec backend npm test
```

### Check Service Status

```bash
docker-compose ps
```

## Environment Variables

The `docker-compose.yml` file contains all environment variables. Key configurations:

### Database Connection
- **Host**: `postgres` (Docker service name)
- **Port**: `5432`
- **Database**: `learnify_db`
- **User**: `postgres`
- **Password**: `postgres123`

### Redis Connection
- **Host**: `redis` (Docker service name)
- **Port**: `6379`

### Update Environment Variables

Edit the `environment` section in `docker-compose.yml` for the backend service.

## Database Management

### Connect to PostgreSQL

```bash
# Using docker-compose
docker-compose exec postgres psql -U postgres -d learnify_db

# Or using psql from host (if installed)
psql -h localhost -p 5432 -U postgres -d learnify_db
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres learnify_db > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres learnify_db < backup.sql
```

## Redis Management

### Connect to Redis CLI

```bash
docker-compose exec redis redis-cli
```

### Clear Redis Cache

```bash
docker-compose exec redis redis-cli FLUSHALL
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
lsof -ti:6379 | xargs kill -9  # Redis
```

Or change the ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Map host port 3001 to container port 3000
```

### Container Won't Start

Check logs:
```bash
docker-compose logs backend
```

Rebuild from scratch:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Database Connection Issues

Ensure PostgreSQL is healthy:
```bash
docker-compose ps
```

Check if migrations ran:
```bash
docker-compose exec postgres psql -U postgres -d learnify_db -c "\dt"
```

### Permission Issues

If you encounter permission issues with volumes:

```bash
docker-compose down -v
sudo chown -R $USER:$USER .
docker-compose up --build
```

## Development Workflow

### 1. Make Code Changes

Edit files in the `backend/` directory.

### 2. Rebuild and Restart

```bash
docker-compose up --build backend
```

### 3. Run Tests

```bash
docker-compose exec backend npm test
```

### 4. View Logs

```bash
docker-compose logs -f backend
```

## Production Deployment

For production, update the following in `docker-compose.yml`:

1. Change `NODE_ENV` to `production`
2. Update JWT secrets
3. Configure real AWS credentials
4. Use strong database passwords
5. Enable SSL/TLS
6. Configure proper CORS origins

## Useful Docker Commands

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# View container resource usage
docker stats

# Inspect a container
docker inspect learnify-backend
```

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

### Using Postman

1. Import the API from Swagger: http://localhost:3000/api-docs
2. Set base URL: `http://localhost:3000/api/v1`
3. Test endpoints

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Restart services: `docker-compose restart`
- Clean rebuild: `docker-compose down -v && docker-compose up --build`
