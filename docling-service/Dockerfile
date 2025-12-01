# Docling Document Parsing Service
# CPU-optimized build for document processing
# Implements AC-4.8.1, AC-4.8.7

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    # Docling/PyTorch threading optimization for containers
    OMP_NUM_THREADS=4 \
    MKL_NUM_THREADS=4 \
    OPENBLAS_NUM_THREADS=4 \
    # Disable GPU (CPU-only build)
    CUDA_VISIBLE_DEVICES="" \
    # Application settings
    PORT=8000 \
    WORKERS=1

WORKDIR /app

# Install system dependencies required by Docling
# Note: libgl1 replaces deprecated libgl1-mesa-glx in newer Debian versions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    poppler-utils \
    tesseract-ocr \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with CPU-only PyTorch
# This significantly reduces image size compared to default PyTorch with CUDA
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Download Docling models during build
# This avoids model download at runtime which would cause timeout
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()" \
    || echo "Model pre-download attempted"

# Copy application code
COPY main.py .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "main.py"]
