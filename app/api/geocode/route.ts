import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/maps/locationiq';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address || typeof address !== 'string' || address.length < 3) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const result = await geocodeAddress(address);
    
    if (!result) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
