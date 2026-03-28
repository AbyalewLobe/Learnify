# Video Upload Testing Guide (Mock S3)

Since LocalStack had issues, I've implemented a Mock S3 service that stores files locally. This lets you test video upload functionality without AWS.

## How It Works

- Video files are stored in `backend/mock-s3-storage/` directory
- The API generates mock presigned URLs that point back to our server
- No AWS credentials or S3 buckets needed for development

## Testing Video Upload

### 1. Start Your Backend

```bash
cd backend
npm run dev
```

### 2. Initiate Video Upload

```bash
curl -X POST http://localhost:3001/api/v1/videos/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "my-video.mp4",
    "contentType": "video/mp4",
    "fileSizeBytes": 10485760
  }'
```

Response:
```json
{
  "videoId": "uuid-here",
  "uploadUrl": "http://localhost:3001/api/v1/mock-s3/upload?bucket=learnify-videos-dev&key=originals%2Fuuid%2Fmy-video.mp4"
}
```

### 3. Upload Video File

Use the uploadUrl from step 2:

```bash
curl -X PUT "http://localhost:3001/api/v1/mock-s3/upload?bucket=learnify-videos-dev&key=originals%2Fuuid%2Fmy-video.mp4" \
  -F "file=@/path/to/your/video.mp4"
```

### 4. Confirm Upload

```bash
curl -X POST http://localhost:3001/api/v1/videos/VIDEO_ID/confirm \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "id": "uuid",
  "status": "processing",
  "uploader_id": "user-uuid",
  "original_filename": "my-video.mp4",
  "s3_key": "originals/uuid/my-video.mp4",
  "created_at": "2026-03-28T12:00:00Z",
  "updated_at": "2026-03-28T12:00:00Z"
}
```

### 5. Check Video Status

```bash
curl -X GET http://localhost:3001/api/v1/videos/VIDEO_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Postman Testing

### Collection Setup

1. Create a new request: "Initiate Video Upload"
   - Method: POST
   - URL: `{{base_url}}/videos/upload`
   - Headers: `Authorization: Bearer {{access_token}}`
   - Body (JSON):
     ```json
     {
       "filename": "test-video.mp4",
       "contentType": "video/mp4",
       "fileSizeBytes": 10485760
     }
     ```

2. Save the videoId and uploadUrl from response

3. Create a new request: "Upload Video File"
   - Method: PUT
   - URL: (paste the uploadUrl from previous response)
   - Body: form-data
     - Key: `file`
     - Type: File
     - Value: Select your video file

4. Create a new request: "Confirm Upload"
   - Method: POST
   - URL: `{{base_url}}/videos/{{videoId}}/confirm`
   - Headers: `Authorization: Bearer {{access_token}}`

5. Create a new request: "Check Video Status"
   - Method: GET
   - URL: `{{base_url}}/videos/{{videoId}}/status`
   - Headers: `Authorization: Bearer {{access_token}}`

## Verify Files

Check that files are being stored:

```bash
ls -la backend/mock-s3-storage/learnify-videos-dev/originals/
```

You should see directories with UUIDs containing your uploaded videos.

## Notes

- Mock S3 is only for development
- Video transcoding (Task 7.4) is not implemented yet - videos stay in "processing" status
- For production, you'll need real AWS S3 buckets
- The mock service simulates S3 behavior but doesn't actually transcode videos

## Switching to Real AWS

When ready for production:

1. Create S3 buckets in AWS
2. Update `.env` with real AWS credentials
3. Remove `AWS_ENDPOINT` from `.env`
4. The code will automatically use real S3Service instead of MockS3Service

