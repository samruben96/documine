/**
 * Google Places Autocomplete Proxy
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-4: Address autocomplete suggestions
 *
 * Server-side proxy to protect API key from client exposure.
 * Uses Google Places Autocomplete (New) API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AutocompleteRequest {
  input: string;
  sessionToken: string;
}

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

/**
 * POST /api/quoting/places/autocomplete
 *
 * Proxies requests to Google Places Autocomplete API.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { predictions: [], error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Parse request body
    const body: AutocompleteRequest = await request.json();
    const { input, sessionToken } = body;

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] });
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not configured');
      return NextResponse.json({
        predictions: [],
        error: { message: 'Address autocomplete not configured' },
      });
    }

    // Call Google Places Autocomplete API
    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json'
    );
    url.searchParams.set('input', input);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('types', 'address');
    url.searchParams.set('components', 'country:us');
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json({
        predictions: [],
        error: { message: 'Failed to fetch address suggestions' },
      });
    }

    // Transform response
    const predictions: PlacePrediction[] = (data.predictions ?? []).map(
      (p: {
        place_id: string;
        description: string;
        structured_formatting?: {
          main_text?: string;
          secondary_text?: string;
        };
      }) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text ?? p.description,
        secondaryText: p.structured_formatting?.secondary_text ?? '',
      })
    );

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return NextResponse.json(
      { predictions: [], error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
