# Docling Document Parser Service

Self-hosted document parsing service using IBM Docling for the docuMINE application.

## Features

- Parse PDF, DOCX, XLSX, and image files
- Returns markdown with page markers (`--- PAGE X ---`)
- 97.9% table extraction accuracy (IBM TableFormer model)
- REST API with health check endpoint

## API Endpoints

### Health Check
```
GET /health
→ {"status": "healthy", "version": "1.0.0"}
```

### Parse Document
```
POST /parse
Content-Type: multipart/form-data
Body: file=<document>

→ {
    "markdown": "--- PAGE 1 ---\n\n# Title\n\nContent...",
    "page_markers": [{"page_number": 1, "start_index": 0, "end_index": 14}],
    "page_count": 3,
    "processing_time_ms": 5234
  }
```

## Deployment

### Railway (Recommended)

1. Connect this repo to Railway
2. Railway auto-detects Dockerfile
3. Set environment variables:
   - `PORT=8000`
   - `WORKERS=2`
   - `OMP_NUM_THREADS=4`

### Local Development

```bash
docker build -t docling-service .
docker run -p 8000:8000 docling-service
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Server port |
| `WORKERS` | 1 | Uvicorn workers |
| `OMP_NUM_THREADS` | 4 | CPU threads for ML models |

## Resource Requirements

- **Memory:** 1-2GB RAM recommended
- **CPU:** 2+ cores recommended
- **First request:** ~30-60s (model loading)
- **Processing:** ~3 sec/page (CPU)
