/**
 * POST /api/reporting/analyze
 * Epic 23: Flexible AI Reports - Story 23.2
 *
 * Parse uploaded file and analyze data structure.
 * AC-23.2.1: Extract all rows/columns from Excel/CSV
 * AC-23.2.2: PDF parsed via LlamaParse with table extraction
 * AC-23.2.3: AI detects column types
 * AC-23.2.4: AI suggests 3-5 relevant report prompts
 * AC-23.2.5: Analysis completes within 15 seconds for files < 10K rows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/admin/audit-logger';
import { parseFile } from '@/lib/reporting/file-parser';
import { analyzeColumnTypes, generateSuggestedPrompts } from '@/lib/reporting/data-analyzer';
import type { ApiError, AnalyzeResponse, AllowedFileType } from '@/types/reporting';
import type { Json } from '@/types/database.types';
import { z } from 'zod';

// Request body schema
const analyzeRequestSchema = z.object({
  sourceId: z.string().uuid('Invalid source ID format'),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    // Parse and validate request body
    let body: { sourceId: string };
    try {
      body = await request.json();
      analyzeRequestSchema.parse(body);
    } catch {
      const error: ApiError = {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body. Expected { sourceId: string }',
      };
      return NextResponse.json({ data: null, error }, { status: 400 });
    }

    const { sourceId } = body;

    // Fetch source record (RLS will ensure agency scope)
    const { data: source, error: sourceError } = await supabase
      .from('commission_data_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      const error: ApiError = {
        code: 'NOT_FOUND',
        message: 'Data source not found',
      };
      return NextResponse.json({ data: null, error }, { status: 404 });
    }

    // Validate status is 'pending'
    if (source.status !== 'pending') {
      const error: ApiError = {
        code: 'INVALID_STATUS',
        message: `Cannot analyze source with status '${source.status}'. Expected 'pending'.`,
        details: { currentStatus: source.status },
      };
      return NextResponse.json({ data: null, error }, { status: 400 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('reporting')
      .download(source.storage_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      const error: ApiError = {
        code: 'DOWNLOAD_FAILED',
        message: 'Failed to download file from storage',
        details: { storageError: downloadError?.message },
      };
      return NextResponse.json({ data: null, error }, { status: 500 });
    }

    // Convert blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file based on type
    let parsedData;
    try {
      parsedData = await parseFile(buffer, source.file_type as AllowedFileType);
    } catch (parseError) {
      console.error('File parsing error:', parseError);

      // Update status to 'failed' using service client
      const serviceClient = await createServiceClient();
      await serviceClient
        .from('commission_data_sources')
        .update({
          status: 'failed',
          error_message: parseError instanceof Error ? parseError.message : 'Parse error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sourceId);

      const error: ApiError = {
        code: 'PARSE_ERROR',
        message: `Failed to parse ${source.file_type} file`,
        details: { parseError: parseError instanceof Error ? parseError.message : 'Unknown' },
      };
      return NextResponse.json({ data: null, error }, { status: 422 });
    }

    // Analyze column types (AC-23.2.3)
    const analyzedColumns = analyzeColumnTypes(parsedData);

    // Generate suggested prompts (AC-23.2.4)
    let suggestedPrompts: string[] = [];
    try {
      suggestedPrompts = await generateSuggestedPrompts(analyzedColumns, parsedData);
    } catch (promptError) {
      console.error('Error generating suggested prompts:', promptError);
      // Continue without prompts - not a fatal error
      suggestedPrompts = [
        'Summarize the key insights from this data',
        'Show the most important trends',
        'Generate a comprehensive report',
      ];
    }

    // Update database with parsed data using service client (mutations per verify-then-service pattern)
    const serviceClient = await createServiceClient();
    const { error: updateError } = await serviceClient
      .from('commission_data_sources')
      .update({
        parsed_data: {
          columns: analyzedColumns,
          rows: parsedData.rows,
          metadata: parsedData.metadata,
        } as unknown as Json,
        parsed_at: new Date().toISOString(),
        row_count: parsedData.metadata.totalRows,
        column_count: parsedData.metadata.totalColumns,
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    if (updateError) {
      console.error('Database update error:', updateError);
      const error: ApiError = {
        code: 'DB_ERROR',
        message: 'Failed to update data source record',
        details: { dbError: updateError.message },
      };
      return NextResponse.json({ data: null, error }, { status: 500 });
    }

    // Log audit event
    const processingTimeMs = Date.now() - startTime;
    await logAuditEvent({
      agencyId,
      userId: user.id,
      action: 'reporting_analyzed',
      metadata: {
        sourceId,
        filename: source.filename,
        fileType: source.file_type,
        rowCount: parsedData.metadata.totalRows,
        columnCount: parsedData.metadata.totalColumns,
        processingTimeMs,
        timestamp: new Date().toISOString(),
      },
    });

    // AC-23.2.5: Log performance warning if > 15 seconds
    if (processingTimeMs > 15000) {
      console.warn(`Analysis took ${processingTimeMs}ms (> 15s target)`, {
        sourceId,
        rowCount: parsedData.metadata.totalRows,
        fileType: source.file_type,
      });
    }

    // Return success response
    const response: AnalyzeResponse = {
      sourceId,
      status: 'ready',
      columns: analyzedColumns,
      rowCount: parsedData.metadata.totalRows,
      suggestedPrompts,
    };

    return NextResponse.json({ data: response, error: null }, { status: 200 });
  } catch (err) {
    console.error('Analyze route error:', err);
    const error: ApiError = {
      code: 'ANALYSIS_FAILED',
      message: 'An unexpected error occurred during analysis',
    };
    return NextResponse.json({ data: null, error }, { status: 500 });
  }
}
