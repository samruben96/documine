/**
 * Quote Data Extraction Edge Function
 *
 * Story 11.6: Phase 2 of phased document processing.
 * Extracts structured quote data from documents in the background.
 *
 * This function is called asynchronously after Phase 1 (process-document)
 * completes. It reads the raw_text stored during Phase 1 and extracts
 * structured insurance quote data using OpenAI.
 *
 * AC-11.6.2: Separate edge function for extraction
 * AC-11.6.3: Uses existing raw_text from documents table
 * AC-11.6.5: Error handling with extraction_status updates
 *
 * @module supabase/functions/extract-quote-data
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Configuration
const QUOTE_EXTRACTION_TIMEOUT_MS = 60000; // 60 seconds (AC-10.12.8)
const EXTRACTION_VERSION = 3; // Must match src/types/compare.ts

// Types
interface ExtractionPayload {
  documentId: string;
  agencyId: string;
}

interface LogData {
  [key: string]: unknown;
}

// Structured logging
const log = {
  info: (message: string, data?: LogData): void => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
  warn: (message: string, data?: LogData): void => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
  error: (message: string, error: Error, data?: LogData): void => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
};

/**
 * System prompt for insurance quote extraction.
 * Mirrors the prompt from process-document for consistency.
 */
const EXTRACTION_SYSTEM_PROMPT = `You are an expert insurance document analyst.
Your task is to extract structured data from insurance quote documents.

IMPORTANT GUIDELINES:
- Extract exact values as they appear in the document
- For each extracted item, include the page number(s) where it appears
- If a field is not found in the document, omit it or set to null
- Do NOT guess or infer values that are not explicitly stated
- For currency amounts, extract the numeric value only (no $ or commas)
- For dates, use YYYY-MM-DD format

COVERAGE TYPE MAPPINGS:
- "General Liability", "CGL", "Commercial General Liability" → general_liability
- "Property", "Building", "Business Personal Property", "BPP" → property
- "Auto Liability", "Automobile Liability", "Commercial Auto" → auto_liability
- "Physical Damage", "Collision", "Comprehensive", "Auto Physical" → auto_physical_damage
- "Umbrella", "Excess Liability", "Excess" → umbrella
- "Workers Compensation", "WC", "Workers' Comp" → workers_comp
- "Professional Liability", "E&O", "Errors and Omissions" → professional_liability
- "Cyber Liability", "Data Breach", "Network Security" → cyber
- "EPLI", "Employment Practices Liability" → epli
- "D&O", "Directors and Officers" → d_and_o
- "Crime", "Fidelity", "Employee Dishonesty" → crime
- Other coverages → other

EXCLUSION CATEGORY MAPPINGS:
- Flood, water damage → flood
- Earthquake, earth movement → earthquake
- Pollution, contamination → pollution
- Mold, fungus → mold
- Cyber, data breach (when excluded) → cyber
- Employment practices (when excluded) → employment
- Other exclusions → other

LIMIT TYPE MAPPINGS:
- "Each Occurrence", "Per Occurrence", "Per Claim" → per_occurrence
- "Aggregate", "Annual Aggregate", "Policy Aggregate" → aggregate
- "Per Person", "Each Person" → per_person
- "CSL", "Combined Single Limit" → combined_single

Extract all available information and include source page numbers for traceability.`;

/**
 * JSON Schema for quote extraction structured output.
 */
const EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    carrierName: { type: ['string', 'null'], description: 'Insurance carrier/company name' },
    policyNumber: { type: ['string', 'null'], description: 'Policy or quote number' },
    namedInsured: { type: ['string', 'null'], description: 'Named insured (policyholder)' },
    effectiveDate: { type: ['string', 'null'], description: 'Policy effective date (YYYY-MM-DD)' },
    expirationDate: { type: ['string', 'null'], description: 'Policy expiration date (YYYY-MM-DD)' },
    annualPremium: { type: ['number', 'null'], description: 'Total annual premium in USD' },
    coverages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['general_liability', 'property', 'auto_liability', 'auto_physical_damage',
                   'umbrella', 'workers_comp', 'professional_liability', 'cyber', 'other',
                   'epli', 'd_and_o', 'crime', 'pollution', 'inland_marine', 'builders_risk',
                   'business_interruption', 'product_liability', 'garage_liability',
                   'liquor_liability', 'medical_malpractice', 'fiduciary']
          },
          name: { type: 'string' },
          limit: { type: ['number', 'null'] },
          sublimit: { type: ['number', 'null'] },
          limitType: { type: ['string', 'null'], enum: ['per_occurrence', 'aggregate', 'per_person', 'combined_single', null] },
          deductible: { type: ['number', 'null'] },
          description: { type: 'string' },
          sourcePages: { type: 'array', items: { type: 'integer' } },
          aggregateLimit: { type: ['number', 'null'] },
          selfInsuredRetention: { type: ['number', 'null'] },
          coinsurance: { type: ['number', 'null'] },
          waitingPeriod: { type: ['string', 'null'] },
          indemnityPeriod: { type: ['string', 'null'] },
        },
        required: ['type', 'name', 'limit', 'sublimit', 'limitType', 'deductible', 'description', 'sourcePages', 'aggregateLimit', 'selfInsuredRetention', 'coinsurance', 'waitingPeriod', 'indemnityPeriod'],
        additionalProperties: false,
      },
    },
    exclusions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['flood', 'earthquake', 'pollution', 'mold', 'cyber', 'employment', 'other'] },
          sourcePages: { type: 'array', items: { type: 'integer' } },
        },
        required: ['name', 'description', 'category', 'sourcePages'],
        additionalProperties: false,
      },
    },
    deductibles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          amount: { type: 'number' },
          appliesTo: { type: 'string' },
          sourcePages: { type: 'array', items: { type: 'integer' } },
        },
        required: ['type', 'amount', 'appliesTo', 'sourcePages'],
        additionalProperties: false,
      },
    },
    policyMetadata: {
      type: ['object', 'null'],
      properties: {
        formType: { type: ['string', 'null'], enum: ['iso', 'proprietary', 'manuscript', null] },
        formNumbers: { type: 'array', items: { type: 'string' } },
        policyType: { type: ['string', 'null'], enum: ['occurrence', 'claims-made', null] },
        retroactiveDate: { type: ['string', 'null'] },
        extendedReportingPeriod: { type: ['string', 'null'] },
        auditType: { type: ['string', 'null'], enum: ['annual', 'monthly', 'final', 'none', null] },
        sourcePages: { type: 'array', items: { type: 'integer' } },
      },
      required: ['formType', 'formNumbers', 'policyType', 'retroactiveDate', 'extendedReportingPeriod', 'auditType', 'sourcePages'],
      additionalProperties: false,
    },
    endorsements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          formNumber: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['broadening', 'restricting', 'conditional'] },
          description: { type: 'string' },
          affectedCoverage: { type: ['string', 'null'] },
          sourcePages: { type: 'array', items: { type: 'integer' } },
        },
        required: ['formNumber', 'name', 'type', 'description', 'affectedCoverage', 'sourcePages'],
        additionalProperties: false,
      },
    },
    carrierInfo: {
      type: ['object', 'null'],
      properties: {
        amBestRating: { type: ['string', 'null'] },
        amBestFinancialSize: { type: ['string', 'null'] },
        naicCode: { type: ['string', 'null'] },
        admittedStatus: { type: ['string', 'null'], enum: ['admitted', 'non-admitted', 'surplus', null] },
        claimsPhone: { type: ['string', 'null'] },
        underwriter: { type: ['string', 'null'] },
        sourcePages: { type: 'array', items: { type: 'integer' } },
      },
      required: ['amBestRating', 'amBestFinancialSize', 'naicCode', 'admittedStatus', 'claimsPhone', 'underwriter', 'sourcePages'],
      additionalProperties: false,
    },
    premiumBreakdown: {
      type: ['object', 'null'],
      properties: {
        basePremium: { type: ['number', 'null'] },
        coveragePremiums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              coverage: { type: 'string' },
              premium: { type: 'number' },
            },
            required: ['coverage', 'premium'],
            additionalProperties: false,
          },
        },
        taxes: { type: ['number', 'null'] },
        fees: { type: ['number', 'null'] },
        brokerFee: { type: ['number', 'null'] },
        surplusLinesTax: { type: ['number', 'null'] },
        totalPremium: { type: 'number' },
        paymentPlan: { type: ['string', 'null'] },
        sourcePages: { type: 'array', items: { type: 'integer' } },
      },
      required: ['basePremium', 'coveragePremiums', 'taxes', 'fees', 'brokerFee', 'surplusLinesTax', 'totalPremium', 'paymentPlan', 'sourcePages'],
      additionalProperties: false,
    },
  },
  required: ['carrierName', 'policyNumber', 'namedInsured', 'effectiveDate', 'expirationDate', 'annualPremium', 'coverages', 'exclusions', 'deductibles', 'policyMetadata', 'endorsements', 'carrierInfo', 'premiumBreakdown'],
  additionalProperties: false,
} as const;

// Main handler
Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required environment variables' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let payload: ExtractionPayload;
  try {
    payload = await req.json() as ExtractionPayload;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { documentId, agencyId } = payload;

  if (!documentId || !agencyId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing documentId or agencyId' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  log.info('Phase 2 extraction started', { documentId, agencyId });

  try {
    // Step 1: Update extraction_status to 'extracting' (AC-11.6.4)
    await supabase
      .from('documents')
      .update({
        extraction_status: 'extracting',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Step 2: Get document data including raw_text (AC-11.6.3)
    const { data: docData, error: fetchError } = await supabase
      .from('documents')
      .select('raw_text, document_type, page_count')
      .eq('id', documentId)
      .single();

    if (fetchError || !docData) {
      throw new Error(`Document not found: ${fetchError?.message || 'No data'}`);
    }

    // Skip extraction for general documents
    if (docData.document_type === 'general') {
      log.info('Skipping extraction for general document', { documentId });
      await supabase
        .from('documents')
        .update({
          extraction_status: 'skipped',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'general document' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawText = docData.raw_text;
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No raw_text available for extraction');
    }

    // Step 3: Perform extraction with OpenAI
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), QUOTE_EXTRACTION_TIMEOUT_MS);

    try {
      const requestBody = {
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Extract structured insurance quote data from the following document:\n\n${rawText}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'quote_extraction',
            strict: true,
            schema: EXTRACTION_JSON_SCHEMA,
          },
        },
        temperature: 0.1,
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in extraction response');
      }

      // Parse the extraction result
      const extraction = JSON.parse(content);

      // Add metadata fields
      extraction.extractedAt = new Date().toISOString();
      extraction.modelUsed = 'gpt-4.1';

      // Step 4: Store extraction in documents table (AC-11.6.4)
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          extraction_data: extraction,
          extraction_version: EXTRACTION_VERSION,
          extraction_status: 'complete',
          extraction_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) {
        throw new Error(`Failed to store extraction: ${updateError.message}`);
      }

      // Step 5: Also cache in quote_extractions table for comparison flow
      const { error: cacheError } = await supabase
        .from('quote_extractions')
        .upsert(
          {
            document_id: documentId,
            agency_id: agencyId,
            extracted_data: extraction,
            extraction_version: EXTRACTION_VERSION,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'document_id',
            ignoreDuplicates: false,
          }
        );

      if (cacheError) {
        log.warn('Failed to cache extraction in quote_extractions', {
          documentId,
          error: cacheError.message,
        });
        // Don't throw - documents table update succeeded
      }

      const duration = Date.now() - startTime;
      log.info('Phase 2 extraction completed', {
        documentId,
        duration,
        coverageCount: extraction.coverages?.length || 0,
        exclusionCount: extraction.exclusions?.length || 0,
        carrierName: extraction.carrierName || null,
        annualPremium: extraction.annualPremium || null,
      });

      return new Response(
        JSON.stringify({
          success: true,
          coverageCount: extraction.coverages?.length || 0,
          duration,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const duration = Date.now() - startTime;

    log.error('Phase 2 extraction failed', err, { documentId, agencyId, duration });

    // Update extraction_status to 'failed' with error message (AC-11.6.5)
    try {
      await supabase
        .from('documents')
        .update({
          extraction_status: 'failed',
          extraction_error: err.message,
          extraction_data: null,
          extraction_version: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);
    } catch (updateError) {
      log.error('Failed to update extraction error status', updateError as Error, { documentId });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
