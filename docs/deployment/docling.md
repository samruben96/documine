# Docling Document Parsing Service Deployment

This guide covers deployment of the self-hosted Docling document parsing service.

## Overview

Docling replaces LlamaParse for document processing, providing:
- 97.9% table extraction accuracy (vs 75% with LlamaParse)
- Zero API costs (self-hosted)
- Full data privacy for sensitive documents
- Support for PDF, DOCX, XLSX, and images

## Local Development

### Prerequisites

- Docker and Docker Compose
- 4GB+ available RAM

### Quick Start

```bash
# From the documine directory
cd /path/to/documine

# Build and start the Docling service
docker-compose up -d docling

# Check health
curl http://localhost:8000/health
# Expected: {"status":"healthy","version":"1.0.0"}

# Test document parsing
curl -X POST http://localhost:8000/parse \
  -F "file=@test-document.pdf"
```

### Environment Variables

Add to your `.env.local`:

```bash
# Docling service URL (replaces LLAMA_CLOUD_API_KEY)
DOCLING_SERVICE_URL=http://localhost:8000
```

### Docker Compose Services

```yaml
services:
  docling:
    build:
      context: ./docling-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - WORKERS=2
      - OMP_NUM_THREADS=4
```

## Production Deployment

### Option 1: Railway (Recommended for MVP)

1. Create a new Railway project
2. Add Dockerfile service from `docling-service/`
3. Set environment variables:
   - `PORT=8000`
   - `WORKERS=2`
   - `OMP_NUM_THREADS=4`
4. Deploy

Estimated cost: $5-20/month depending on usage

### Option 2: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
cd docling-service
fly launch --name documine-docling --no-deploy

# Configure in fly.toml
[env]
  PORT = "8000"
  WORKERS = "2"
  OMP_NUM_THREADS = "4"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

# Deploy
fly deploy
```

### Option 3: Self-Hosted VPS

Requirements:
- 2+ vCPU
- 2GB+ RAM
- 10GB+ storage (for Docker image)

```bash
# On the server
git clone <your-repo>
cd documine

# Build and run
docker-compose -f docker-compose.prod.yml up -d

# Configure reverse proxy (nginx/caddy) for HTTPS
```

## Resource Requirements

| Configuration | CPU | Memory | Use Case |
|--------------|-----|--------|----------|
| Minimum | 1 vCPU | 1GB | Development |
| Recommended | 2 vCPU | 2GB | Production |
| Performance | 4 vCPU | 4GB | High volume |

### Processing Speed

- CPU-only: ~3.1 sec/page (x86), ~1.3 sec/page (Apple Silicon)
- With GPU: ~0.5 sec/page (NVIDIA L4)

## API Reference

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Parse Document

```
POST /parse
Content-Type: multipart/form-data
```

Request:
- `file`: Document file (PDF, DOCX, XLSX, PNG, JPEG, TIFF)

Response:
```json
{
  "markdown": "--- PAGE 1 ---\n\n# Document Title\n\nContent here...",
  "page_markers": [
    {"page_number": 1, "start_index": 0, "end_index": 14}
  ],
  "page_count": 3,
  "processing_time_ms": 5234
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Unsupported file type |
| 500 | Processing error |
| 503 | Service not initialized |

## Monitoring

### Logs

Docker logs:
```bash
docker-compose logs -f docling
```

### Health Checks

The service includes a built-in health check that runs every 30 seconds.
Configure your monitoring to hit `/health` endpoint.

### Metrics

Processing metrics are returned in each response:
- `processing_time_ms`: Time taken to parse document

## Troubleshooting

### Container won't start

Check memory limits:
```bash
docker stats docling
```

Increase memory if needed in docker-compose.yml.

### Slow processing

1. Check OMP_NUM_THREADS matches available CPU cores
2. Consider increasing WORKERS for parallel processing
3. Ensure adequate memory (at least 1GB per worker)

### Connection refused from Edge Function

1. Verify DOCLING_SERVICE_URL is correctly set in Supabase secrets
2. Check firewall rules allow outbound connections
3. Verify service is running and healthy

## Migration from LlamaParse

1. Deploy Docling service
2. Update Supabase Edge Function secrets:
   - Remove: `LLAMA_CLOUD_API_KEY`
   - Add: `DOCLING_SERVICE_URL`
3. Deploy updated Edge Function
4. Test with a sample document
5. Monitor logs for any errors

Existing processed documents remain valid - no re-processing required unless you want improved accuracy on tables.
