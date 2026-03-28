#!/bin/bash

# Script to initialize LocalStack S3 buckets for local development

echo "Initializing LocalStack S3 buckets..."

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
until curl -s http://localhost:4566/_localstack/health | grep -q '"s3": "available"'; do
  echo "Waiting for LocalStack S3..."
  sleep 2
done

echo "LocalStack is ready!"

# Create S3 buckets
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-videos-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-resources-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-public-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://learnify-uploads-dev

echo "S3 buckets created successfully!"

# List buckets to verify
echo "Verifying buckets..."
aws --endpoint-url=http://localhost:4566 s3 ls

echo "LocalStack initialization complete!"
