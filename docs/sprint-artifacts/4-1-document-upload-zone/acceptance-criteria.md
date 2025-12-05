# Acceptance Criteria

## AC-4.1.1: Default Upload Zone Display
- Upload zone displays dashed border with "Drop a document here or click to upload" text
- Zone is visually prominent and clearly indicates drop target area
- Uses Trustworthy Slate color theme per UX spec

## AC-4.1.2: Drag Hover State
- Drag hover state shows border color change to primary (#475569)
- Background highlights subtly to indicate active drop target
- Visual feedback is immediate (<100ms response)

## AC-4.1.3: File Picker Integration
- Click on zone opens native file picker
- File picker is filtered to PDF files only (accept="application/pdf")
- Works consistently across Chrome, Firefox, Safari, Edge

## AC-4.1.4: File Type Validation
- Drag-and-drop accepts PDF files
- Rejects other file types with toast: "Only PDF files are supported"
- Server-side MIME type validation (not just extension)

## AC-4.1.5: File Size Validation
- Files over 50MB are rejected with toast: "File too large. Maximum size is 50MB"
- Validation happens client-side before upload attempt
- Clear feedback prevents wasted upload time

## AC-4.1.6: Multi-File Upload Support
- Multiple files (up to 5) can be uploaded simultaneously
- Parallel uploads for efficiency
- Clear indication of each file's upload status
- 6th file and beyond rejected with toast: "Maximum 5 files at once"

## AC-4.1.7: Storage Path Structure
- Uploaded file is stored at path `{agency_id}/{document_id}/{filename}` in Supabase Storage
- Path structure enforces agency isolation
- Document ID is UUID generated before upload

## AC-4.1.8: Document Record Creation
- Document record created with status='processing' immediately after upload
- Record includes: id, agency_id, uploaded_by, filename, storage_path, status
- Processing job queued automatically for document extraction
