# LocalStack Setup Guide

LocalStack provides a local AWS cloud stack for development and testing. This allows you to test S3, SES, and other AWS services without needing real AWS credentials or incurring costs.

## Quick Start

### 1. Start LocalStack

```bash
# From the project root
docker-compose up -d localstack
```

Wait for LocalStack to be ready (check logs):
```bash
docker-compose logs -f localstack
```

Look for: `Ready.`

### 2. Initialize S3 Buckets

```bash
cd backend
./scripts/init-localstack.sh
```

This creates the required S3 buckets:
- `learnify-videos-dev`
- `learnify-resources-dev`
- `learnify-public-dev`
- `learnify-uploads-dev`

### 3. Verify Setup

Check that buckets were created:
```bash
aws --endpoint-url=http://localhost:4566 s3 ls
```

You should see all four buckets listed.

### 4. Start Your Backend

```bash
npm run dev
```

The backend will now use LocalStack for S3 operations.

## Configuration

The `.env` file is already configured for LocalStack:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566
```

## Testing Video Upload

### 1. Initiate Upload

```bash
POST http://localhost:3001/api/v1/videos/upload
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "filename": "my-video.mp4",
  "contentType": "video/mp4",
  "fileSizeBytes": 10485760
}
```

Response:
```json
{
  "videoId": "uuid",
  "uploadUrl": "http://localhost:4566/learnify-videos-dev/originals/uuid/my-video.mp4?..."
}
```

### 2. Upload File to S3

```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: video/mp4" \
  --data-binary "@path/to/your/video.mp4"
```

### 3. Confirm Upload

```bash
POST http://localhost:3001/api/v1/videos/<videoId>/confirm
Authorization: Bearer <your-token>
```

### 4. Check Status

```bash
GET http://localhost:3001/api/v1/videos/<videoId>/status
Authorization: Bearer <your-token>
```

## Viewing S3 Contents

List files in a bucket:
```bash
aws --endpoint-url=http://localhost:4566 s3 ls s3://learnify-videos-dev --recursive
```

Download a file:
```bash
aws --endpoint-url=http://localhost:4566 s3 cp s3://learnify-videos-dev/originals/uuid/file.mp4 ./downloaded.mp4
```

Delete a file:
```bash
aws --endpoint-url=http://localhost:4566 s3 rm s3://learnify-videos-dev/originals/uuid/file.mp4
```

## Troubleshooting

### LocalStack not starting

Check logs:
```bash
docker-compose logs localstack
```

Restart LocalStack:
```bash
docker-compose restart localstack
```

### Buckets not created

Run the init script again:
```bash
./scripts/init-localstack.sh
```

### AWS CLI not found

Install AWS CLI:
```bash
# Ubuntu/Debian
sudo apt-get install awscli

# macOS
brew install awscli

# Or use pip
pip install awscli
```

### Connection refused errors

Make sure LocalStack is running:
```bash
docker-compose ps localstack
```

Check health:
```bash
curl http://localhost:4566/_localstack/health
```

## Production Setup

For production, you'll need:

1. **Real AWS Account**: Create an AWS account
2. **S3 Buckets**: Create the four S3 buckets in your AWS account
3. **IAM User**: Create an IAM user with S3 permissions
4. **Credentials**: Update `.env` with real AWS credentials
5. **Remove Endpoint**: Remove or comment out `AWS_ENDPOINT` in `.env`

Example production `.env`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# AWS_ENDPOINT=  # Remove this line for production
```

## LocalStack Web UI

LocalStack Pro includes a web UI. For the free version, use AWS CLI commands to interact with services.

## Notes

- LocalStack data persists in the `localstack_data` Docker volume
- To reset LocalStack, remove the volume: `docker-compose down -v`
- LocalStack supports many AWS services beyond S3 and SES
- For video transcoding (MediaConvert), you'll need LocalStack Pro or use real AWS

