/**
 * POST /api/reporting/upload
 * Epic 23: Custom Reporting - File Upload Infrastructure
 * Story 23.1: Upload commission statement files
 *
 * AC-23.1.1: Accept Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf) up to 50MB
 * AC-23.1.3: Reject invalid file types with clear error message
 * AC-23.1.4: Store files in Supabase Storage: {agency_id}/reporting/{source_id}/{filename}
 * AC-23.1.5: Create commission_data_sources record with status='pending'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/admin/audit-logger';
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  getFileType,
  isAllowedMimeType,
  type UploadResponse,
  type ApiError,
  type AllowedFileType,
} from '@/types/reporting';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const error: ApiError = {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      };
      return NextResponse.json({ data: null, error }, { status: 401 });
    }

    // Get user's agency
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      const error: ApiError = {
        code: 'AUTH_REQUIRED',
        message: 'User not found',
      };
      return NextResponse.json({ data: null, error }, { status: 401 });
    }

    const agencyId = userData.agency_id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      const error: ApiError = {
        code: 'INVALID_FILE_TYPE',
        message: 'No file provided',
      };
      return NextResponse.json({ data: null, error }, { status: 400 });
    }

    // Validate file type by extension
    const fileType = getFileType(file.name);
    if (!fileType) {
      const error: ApiError = {
        code: 'INVALID_FILE_TYPE',
        message: `Invalid file type. Supported formats: ${ALLOWED_FILE_TYPES.join(', ')}`,
        details: { filename: file.name, supportedFormats: ALLOWED_FILE_TYPES },
      };
      return NextResponse.json({ data: null, error }, { status: 400 });
    }

    // Validate MIME type (secondary check)
    if (!isAllowedMimeType(file.type)) {
      const error: ApiError = {
        code: 'INVALID_FILE_TYPE',
        message: `Invalid file type. Supported formats: ${ALLOWED_FILE_TYPES.join(', ')}`,
        details: { filename: file.name, mimeType: file.type },
      };
      return NextResponse.json({ data: null, error }, { status: 400 });
    }

    // Validate file size (AC-23.1.1: 50MB limit)
    if (file.size > MAX_FILE_SIZE) {
      const error: ApiError = {
        code: 'FILE_TOO_LARGE',
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        details: { fileSize: file.size, maxSize: MAX_FILE_SIZE },
      };
      return NextResponse.json({ data: null, error }, { status: 413 });
    }

    // Generate source ID for the record
    const sourceId = crypto.randomUUID();

    // Storage path: {agency_id}/reporting/{source_id}/{filename}
    const storagePath = `${agencyId}/reporting/${sourceId}/${file.name}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('reporting')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      const error: ApiError = {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload file to storage',
        details: { storageError: uploadError.message },
      };
      return NextResponse.json({ data: null, error }, { status: 500 });
    }

    // Create commission_data_sources record (AC-23.1.5)
    const { error: dbError } = await supabase
      .from('commission_data_sources')
      .insert({
        id: sourceId,
        agency_id: agencyId,
        user_id: user.id,
        filename: file.name,
        file_type: fileType as AllowedFileType,
        storage_path: storagePath,
        status: 'pending',
        column_mappings: [],
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Attempt to clean up uploaded file
      await supabase.storage.from('reporting').remove([storagePath]);

      const error: ApiError = {
        code: 'DB_ERROR',
        message: 'Failed to create data source record',
        details: { dbError: dbError.message },
      };
      return NextResponse.json({ data: null, error }, { status: 500 });
    }

    // Log audit event
    await logAuditEvent({
      agencyId,
      userId: user.id,
      action: 'reporting_uploaded',
      metadata: {
        sourceId,
        filename: file.name,
        fileType,
        fileSize: file.size,
        timestamp: new Date().toISOString(),
      },
    });

    // Return success response
    const response: UploadResponse = {
      sourceId,
      status: 'pending',
      filename: file.name,
    };

    return NextResponse.json({ data: response, error: null }, { status: 201 });
  } catch (err) {
    console.error('Upload route error:', err);
    const error: ApiError = {
      code: 'UPLOAD_FAILED',
      message: 'An unexpected error occurred during upload',
    };
    return NextResponse.json({ data: null, error }, { status: 500 });
  }
}
