# Tasks / Subtasks

- [x] **Task 1: Install required dependencies** (AC: All)
  - [x] Run `npm install react-dropzone` for drag-drop handling
  - [x] Verify react-dropzone is compatible with React 19
  - [x] Update package.json and package-lock.json

- [x] **Task 2: Create upload zone component** (AC: 4.1.1, 4.1.2, 4.1.3)
  - [x] Create `src/components/documents/upload-zone.tsx`
  - [x] Implement dashed border default state with text
  - [x] Add drag-over state with color/background change
  - [x] Integrate react-dropzone for drag-drop and click handling
  - [x] Apply Trustworthy Slate colors (#475569 for primary)

- [x] **Task 3: Implement file validation** (AC: 4.1.4, 4.1.5, 4.1.6)
  - [x] Add client-side PDF MIME type validation
  - [x] Add 50MB file size validation
  - [x] Limit to 5 files per upload batch
  - [x] Use sonner toast for validation error messages
  - [x] Add Zod schema for file validation

- [x] **Task 4: Create document upload service** (AC: 4.1.7)
  - [x] Create `src/lib/documents/upload.ts`
  - [x] Implement `uploadDocument(file, agencyId, documentId)` function
  - [x] Generate UUID for document_id before upload
  - [x] Upload to Supabase Storage at agency-scoped path
  - [x] Return storage path on success

- [x] **Task 5: Create document database service** (AC: 4.1.8)
  - [x] Create `src/lib/documents/service.ts`
  - [x] Implement `createDocumentRecord(data)` function
  - [x] Insert document with status='processing'
  - [x] Create processing_jobs record to trigger Edge Function
  - [x] Handle transaction for atomic record creation

- [x] **Task 6: Create server action for upload flow** (AC: All)
  - [x] Create `src/app/(dashboard)/documents/actions.ts`
  - [x] Implement `uploadDocument(formData)` server action
  - [x] Orchestrate: validate -> generate ID -> upload storage -> create record -> queue job
  - [x] Return document for optimistic UI update

- [x] **Task 7: Integrate upload zone into documents page** (AC: All)
  - [x] Add upload zone to `/documents` page layout
  - [x] Position for easy access (top of page or prominent area)
  - [x] Handle upload completion callback
  - [x] Show immediate feedback on successful upload

- [x] **Task 8: Testing and verification** (All ACs)
  - [x] Test drag-drop with valid PDF
  - [x] Test drag-drop with invalid file type (docx, xlsx)
  - [x] Test file picker opens and filters correctly
  - [x] Test 50MB+ file rejection
  - [x] Test 5+ file batch rejection
  - [x] Verify storage path format in Supabase Storage
  - [x] Verify document record created with correct status
  - [x] Run build to check for type errors
  - [x] Verify existing tests still pass
