/**
 * Quote Session Client Data API Route
 * Story Q3.1: Data Capture Forms
 * Story Q3.2: Auto-Save Implementation
 *
 * PATCH /api/quoting/[id]/client-data - Update client data (partial merge)
 *
 * AC-Q3.1 (all): Wire up data persistence with partial update merging
 * AC-Q3.2-11: Data persists when navigating away and returning
 * AC-Q3.2-12: Data persists after browser refresh
 * AC-Q3.2-13: Partial updates only send changed data, preserve unchanged fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { updateQuoteSessionClientData } from '@/lib/quoting/service';
import type { QuoteClientData } from '@/types/quoting';

/**
 * Partial client data schema for validation
 * AC-Q3.2 Task 3.4: Validate incoming data shape with Zod
 * Allows any partial subset of client data fields
 */
const partialClientDataSchema = z
  .object({
    personal: z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        mailingAddress: z
          .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    property: z
      .object({
        sameAsMailingAddress: z.boolean().optional(),
        address: z
          .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
          })
          .optional(),
        yearBuilt: z.number().optional(),
        squareFootage: z.number().optional(),
        constructionType: z.string().optional(),
        roofType: z.string().optional(),
        roofYear: z.number().optional(),
        dwellingCoverage: z.number().optional(),
        liabilityCoverage: z.string().optional(),
        deductible: z.string().optional(),
        hasPool: z.boolean().optional(),
        hasTrampoline: z.boolean().optional(),
      })
      .optional(),
    auto: z
      .object({
        vehicles: z
          .array(
            z.object({
              id: z.string().optional(),
              year: z.number().optional(),
              make: z.string().optional(),
              model: z.string().optional(),
              vin: z.string().optional(),
              usage: z.string().optional(),
              annualMileage: z.number().optional(),
            })
          )
          .optional(),
        drivers: z
          .array(
            z.object({
              id: z.string().optional(),
              firstName: z.string().optional(),
              lastName: z.string().optional(),
              dateOfBirth: z.string().optional(),
              licenseNumber: z.string().optional(),
              licenseState: z.string().optional(),
              yearsLicensed: z.number().optional(),
              relationship: z.string().optional(),
              accidentsPast5Years: z.number().optional(),
              violationsPast5Years: z.number().optional(),
            })
          )
          .optional(),
        coverage: z
          .object({
            bodilyInjuryLiability: z.string().optional(),
            propertyDamageLiability: z.string().optional(),
            comprehensiveDeductible: z.string().optional(),
            collisionDeductible: z.string().optional(),
            uninsuredMotorist: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .strict();

/**
 * Standard response helper
 */
function successResponse<T>(data: T): Response {
  return NextResponse.json({ data, error: null });
}

function errorResponse(message: string, code?: string, status = 400): Response {
  return NextResponse.json(
    { data: null, error: { message, code } },
    { status }
  );
}

/**
 * PATCH /api/quoting/[id]/client-data
 * Update client data with partial merge
 *
 * Request body: Partial<QuoteClientData>
 * {
 *   personal?: { firstName?: string, ... },
 *   property?: { yearBuilt?: number, ... },
 *   auto?: { vehicles?: Vehicle[], drivers?: Driver[], coverage?: AutoCoverage }
 * }
 *
 * Response:
 * {
 *   data: { updatedAt: string },
 *   error: null
 * }
 *
 * AC-Q3.2 Task 3.2: Deep merge incoming partial data with existing JSONB
 * AC-Q3.2 Task 3.3: Update updated_at timestamp on save
 * AC-Q3.2 Task 3.5: Return updated timestamp for optimistic UI sync
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Quote client data update unauthorized');
      return errorResponse('Authentication required', 'QUOTE_002', 401);
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 'QUOTE_010', 400);
    }

    // AC-Q3.2 Task 3.4: Validate incoming data shape with Zod
    const parseResult = partialClientDataSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      console.warn('Client data validation failed', {
        sessionId: id,
        errors: errorMessage,
      });
      return errorResponse(
        `Validation error: ${errorMessage}`,
        'QUOTE_011',
        400
      );
    }

    // Cast to Partial<QuoteClientData> - Zod validation ensures correct shape
    const clientDataPatch = parseResult.data as Partial<QuoteClientData>;

    // Check if any data was provided
    if (Object.keys(clientDataPatch).length === 0) {
      return errorResponse('No data provided', 'QUOTE_012', 400);
    }

    // Update via service (RLS handles authorization)
    // AC-Q3.2 Task 3.2: Deep merge performed in service layer
    const updated = await updateQuoteSessionClientData(supabase, id, clientDataPatch);

    if (!updated) {
      console.warn('Quote session not found for client data update', { sessionId: id, userId: user.id });
      return errorResponse('Quote session not found', 'QUOTE_007', 404);
    }

    console.info('Quote session client data updated', {
      userId: user.id,
      sessionId: id,
      sections: Object.keys(clientDataPatch),
    });

    // AC-Q3.2 Task 3.5: Return updated timestamp for optimistic UI sync
    return successResponse({ updatedAt: updated.updatedAt });
  } catch (error) {
    console.error('Quote client data update error', { error });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update client data',
      'QUOTE_013',
      500
    );
  }
}
