/**
 * Google Places Details Proxy
 * Story Q3.1: Data Capture Forms
 *
 * AC-Q3.1-5: Get full address from place ID
 *
 * Server-side proxy to protect API key from client exposure.
 * Uses Google Places Details API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Address } from '@/types/quoting';

interface PlaceDetailsRequest {
  placeId: string;
  sessionToken: string;
}

// Google Places address component types
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/**
 * POST /api/quoting/places/details
 *
 * Proxies requests to Google Places Details API.
 * Returns structured address data.
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
        { address: null, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Parse request body
    const body: PlaceDetailsRequest = await request.json();
    const { placeId, sessionToken } = body;

    if (!placeId) {
      return NextResponse.json({
        address: null,
        error: { message: 'Place ID is required' },
      });
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not configured');
      return NextResponse.json({
        address: null,
        error: { message: 'Address lookup not configured' },
      });
    }

    // Call Google Places Details API
    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/details/json'
    );
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', 'address_components,formatted_address');
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json({
        address: null,
        error: { message: 'Failed to fetch address details' },
      });
    }

    // Parse address components
    const components: AddressComponent[] =
      data.result?.address_components ?? [];

    const address = parseAddressComponents(components);

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Places details error:', error);
    return NextResponse.json(
      { address: null, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * Parse Google address components into our Address structure
 */
function parseAddressComponents(components: AddressComponent[]): Address {
  const findComponent = (types: string[]): AddressComponent | undefined => {
    return components.find((c) =>
      types.some((type) => c.types.includes(type))
    );
  };

  // Street number + route = street address
  const streetNumber = findComponent(['street_number'])?.long_name ?? '';
  const route = findComponent(['route'])?.long_name ?? '';
  const street = [streetNumber, route].filter(Boolean).join(' ');

  // City: try locality, then sublocality, then administrative_area_level_2
  const city =
    findComponent(['locality'])?.long_name ??
    findComponent(['sublocality'])?.long_name ??
    findComponent(['administrative_area_level_2'])?.long_name ??
    '';

  // State: use short_name for state code
  const state =
    findComponent(['administrative_area_level_1'])?.short_name ?? '';

  // ZIP code
  const zipCode = findComponent(['postal_code'])?.long_name ?? '';

  return {
    street,
    city,
    state,
    zipCode,
  };
}
