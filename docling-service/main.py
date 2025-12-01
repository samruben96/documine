"""
Docling Document Parsing Service

FastAPI REST API for document parsing using IBM Docling.
Accepts PDF, DOCX, XLSX, and image files; returns markdown with page markers.

Implements AC-4.8.1, AC-4.8.2, AC-4.8.3
"""

import os
import re
import tempfile
import time
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Docling imports
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    TableFormerMode,
    TableStructureOptions,
)

app = FastAPI(
    title="Docling Document Parser",
    description="Document parsing service using IBM Docling",
    version="1.0.0",
)

# CORS middleware for Edge Function access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize converter once at startup
converter: Optional[DocumentConverter] = None

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
}


class PageMarker(BaseModel):
    """Page marker with position information."""
    page_number: int
    start_index: int
    end_index: int


class ParseResponse(BaseModel):
    """Response from document parsing."""
    markdown: str
    page_markers: List[PageMarker]
    page_count: int
    processing_time_ms: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str


@app.on_event("startup")
async def startup_event():
    """Initialize the document converter on startup with optimized settings."""
    global converter
    print("Initializing Docling DocumentConverter with optimized settings...")
    start = time.time()

    # Configure PDF pipeline for better extraction
    pdf_pipeline_options = PdfPipelineOptions(
        # Enable table structure recognition with accurate mode
        do_table_structure=True,
        table_structure_options=TableStructureOptions(
            do_cell_matching=True,  # Match cells to table structure
            mode=TableFormerMode.ACCURATE,  # Use accurate mode (97.9% accuracy)
        ),
    )

    # Create converter with optimized format options
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pdf_pipeline_options,
            ),
        }
    )
    print(f"DocumentConverter initialized in {time.time() - start:.2f}s")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns service status and version.
    Implements AC-4.8.1: Health check endpoint available.
    """
    return HealthResponse(status="healthy", version="1.0.0")


@app.post("/parse", response_model=ParseResponse)
async def parse_document(file: UploadFile = File(...)):
    """
    Parse a document and return markdown with page markers.

    Accepts: PDF, DOCX, XLSX, PNG, JPEG, TIFF
    Returns: Markdown with page markers in format '--- PAGE X ---'

    Implements:
    - AC-4.8.1: REST API endpoint accepts PDF/DOCX/XLSX/image files
    - AC-4.8.2: Format support parity with LlamaParse
    - AC-4.8.3: Page marker compatibility with existing chunking service
    """
    if converter is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    start_time = time.time()

    # Validate file extension
    filename = file.filename or "document"
    ext = Path(filename).suffix.lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS.keys())}"
        )

    # Save uploaded file to temp location
    try:
        content = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Convert document using Docling
            result = converter.convert(tmp_path)

            # Export to markdown with page break placeholder
            # Using a unique placeholder we can reliably split on
            page_placeholder = "<!-- DOCLING_PAGE_BREAK -->"
            markdown_raw = result.document.export_to_markdown(
                page_break_placeholder=page_placeholder
            )

            # Process markdown to inject proper page markers
            markdown, page_markers, page_count = inject_page_markers(
                markdown_raw,
                page_placeholder
            )

            processing_time = int((time.time() - start_time) * 1000)

            return ParseResponse(
                markdown=markdown,
                page_markers=page_markers,
                page_count=page_count,
                processing_time_ms=processing_time,
            )

        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document parsing failed: {str(e)}"
        )


def inject_page_markers(
    markdown: str,
    placeholder: str
) -> tuple[str, List[PageMarker], int]:
    """
    Replace page break placeholders with proper page markers.

    Input: Markdown with placeholder markers
    Output: Markdown with '--- PAGE X ---' markers matching LlamaParse format

    This ensures compatibility with the existing chunking service regex:
    /---\\s*PAGE\\s+(\\d+)\\s*---/gi
    """
    # Split by placeholder
    pages = markdown.split(placeholder)

    # Handle case with no page breaks (single page document)
    if len(pages) == 1:
        # Single page - add PAGE 1 marker at start
        marker = "--- PAGE 1 ---\n\n"
        final_markdown = marker + pages[0].strip()
        return (
            final_markdown,
            [PageMarker(page_number=1, start_index=0, end_index=len(marker) - 1)],
            1
        )

    # Build markdown with page markers
    result_parts = []
    page_markers = []
    current_index = 0

    for i, page_content in enumerate(pages):
        page_num = i + 1
        marker = f"--- PAGE {page_num} ---"

        # Record marker position
        marker_start = current_index
        marker_end = current_index + len(marker)
        page_markers.append(PageMarker(
            page_number=page_num,
            start_index=marker_start,
            end_index=marker_end
        ))

        # Add marker and content
        if page_content.strip():
            part = f"{marker}\n\n{page_content.strip()}"
        else:
            part = marker

        result_parts.append(part)
        current_index += len(part) + 2  # +2 for the separator newlines

    final_markdown = "\n\n".join(result_parts)
    page_count = len(pages)

    return final_markdown, page_markers, page_count


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    workers = int(os.environ.get("WORKERS", 1))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=workers,
        log_level="info",
    )
