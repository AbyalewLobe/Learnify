# Quick Fix for S3 Error

The S3 Forbidden error occurs because you don't have real AWS credentials configured. Here's how to fix it:

## Solution: Use LocalStack (Local AWS)

### Step 1: Start LocalStack

```bash
# From project root
docker-compose up -d localstack
```

### Step 2: Wait for LocalStack to be Ready

```bash
# Check logs
docker-compose logs -f localstack

# Or check health
curl http://localhost:4566/_localstack/health
```

Wait until you see `"s3": "available"` in the health check.

### Step 3: Create S3 Buckets

```bash
cd backend
./scripts/init-localstack.sh
```

Or manually:
```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-videos-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-resources-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-public-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-uploads-dev
```

### Step 4: Restart Your Backend

```bash
# Stop the backend (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Test Video Upload

Now try your video upload again - it should work!

## Verify Setup

Check buckets exist:
```bash
aws --endpoint-url=http://localhost:4566 s3 ls
```

You should see:
```
2026-03-28 12:00:00 learnify-videos-dev
2026-03-28 12:00:00 learnify-resources-dev
2026-03-28 12:00:00 learnify-public-dev
2026-03-28 12:00:00 learnify-uploads-dev
```

## What Changed

1. Added LocalStack to `docker-compose.yml`
2. Updated `.env` to use LocalStack endpoint
3. Updated AWS config to support custom endpoints
4. Created initialization script for S3 buckets

## Alternative: Use Real AWS

If you prefer to use real AWS instead:

1. Create an AWS account
2. Create the four S3 buckets in AWS Console
3. Create IAM user with S3 permissions
4. Update `.env` with real credentials:
   ```env
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   # Remove or comment out AWS_ENDPOINT
   ```

