import axios from 'axios';
import { createClient } from '@/lib/supabase/server';
import PQueue from 'p-queue';

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY!;
const BASE_URL = 'https://us1.locationiq.com/v1';

// Rate limiter: max 2 requests per second
const queue = new PQueue({ intervalCap: 2, interval: 1000 });

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const trimmedAddress = address.toLowerCase().trim();
  if (!trimmedAddress) return null;

  // Step 1: Check cache first
  const supabase = createClient();
  const { data: cached } = await supabase
    .from('geocoding_cache')
    .select('latitude, longitude, display_name, id, hits')
    .eq('address_query', trimmedAddress)
    .single();

  if (cached) {
    // Update hit counter asynchronously, don't wait for it
    supabase
      .from('geocoding_cache')
      .update({ hits: cached.hits + 1 })
      .eq('id', cached.id)
      .then();

    return {
      lat: cached.latitude.toString(),
      lon: cached.longitude.toString(),
      display_name: cached.display_name!,
    };
  }

  // Step 2: Make API call with rate limiting
  try {
    const result = await queue.add(async () => {
      const response = await axios.get(`${BASE_URL}/search.php`, {
        params: {
          key: LOCATIONIQ_API_KEY,
          q: address,
          format: 'json',
          limit: 1,
        },
        timeout: 10000,
      });
      return response.data[0];
    });

    if (!result) return null;

    // Step 3: Cache the result
    await supabase.from('geocoding_cache').insert({
      address_query: trimmedAddress,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
    });

    return {
      lat: result.lat,
      lon: result.lon,
      display_name: result.display_name,
    };
  } catch (error) {
    console.error('LocationIQ geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const result = await queue.add(async () => {
      const response = await axios.get(`${BASE_URL}/reverse.php`, {
        params: {
          key: LOCATIONIQ_API_KEY,
          lat,
          lon,
          format: 'json',
        },
        timeout: 10000,
      });
      return response.data;
    });

    return result?.display_name || null;
  } catch (error) {
    console.error('LocationIQ reverse geocoding error:', error);
    return null;
  }
}

export function getStaticMapUrl(lat: number, lon: number, zoom: number = 14): string {
  return `${BASE_URL}/staticmap?key=${LOCATIONIQ_API_KEY}&center=${lat},${lon}&zoom=${zoom}&size=600x400&format=png&markers=icon:red-cutout|${lat},${lon}`;
}

