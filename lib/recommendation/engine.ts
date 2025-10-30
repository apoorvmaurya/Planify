import { searchContextualInfo, extractLocationContext, YouContextData } from '@/lib/search/you';
import { geocodeAddress } from '@/lib/maps/locationiq';
import { getDistance } from 'geolib';
import { createClient } from '@/lib/supabase/server';

interface UserLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  weight: number; // Initiator gets 1.5x, others get 1.0x
}

export interface VenueSuggestion {
  name: string;
  address: string;
  lat: number;
  lon: number;
  als_score: number;
  you_context?: YouContextData;
  travel_times: { [userId: string]: number }; // in minutes
}

export function calculateWeightedCentroid(
  members: UserLocation[]
): { lat: number; lon: number } {
  let totalWeight = 0;
  let x = 0, y = 0, z = 0;

  for (const member of members) {
    const latRad = (member.lat * Math.PI) / 180;
    const lonRad = (member.lon * Math.PI) / 180;

    x += Math.cos(latRad) * Math.cos(lonRad) * member.weight;
    y += Math.cos(latRad) * Math.sin(lonRad) * member.weight;
    z += Math.sin(latRad) * member.weight;
    totalWeight += member.weight;
  }

  x /= totalWeight;
  y /= totalWeight;
  z /= totalWeight;

  const lon = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, hyp);

  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI,
  };
}

function extractVenueName(title: string, snippet: string): string | null {
  const quoted = title.match(/"([^"]+)"/) || snippet.match(/"([^"]+)"/);
  if (quoted) return quoted[1];

  const words = title.split(' ');
  const capitalized = words.filter(w => w.length > 1 && w === w.toUpperCase()).slice(0, 3);
  return capitalized.length > 0 ? capitalized.join(' ') : null;
}

export async function getSmartSuggestions(params: {
  members: UserLocation[];
  activityType: string;
  mood: string;
}): Promise<VenueSuggestion[]> {
  const supabase = createClient();
  
  // Step 1: Calculate optimal meeting point
  const centroid = calculateWeightedCentroid(params.members);

  // Step 1.5: Fetch and synthesize user preference signals
  const userIds = params.members.map(m => m.id);
  const { data: signals } = await supabase
    .from('user_preference_signals')
    .select('positive_signal, venue_details')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(20);

  let preferenceSummary = '';
  if (signals && signals.length > 0) {
    // Extract positive preferences (venues they liked)
    const positivePrefs = signals
      .filter(s => s.positive_signal)
      .map(s => s.venue_details?.type)
      .filter(Boolean) as string[];

    // Extract negative preferences (attributes they disliked)
    const negativePrefs = signals
      .filter(s => !s.positive_signal)
      .map(s => s.venue_details?.attributes || [])
      .flat()
      .filter(Boolean) as string[];

    // Get unique preferences
    const uniquePositive = [...new Set(positivePrefs)];
    const uniqueNegative = [...new Set(negativePrefs)];

    // Build preference summary
    const summaryParts: string[] = [];
    if (uniquePositive.length > 0) {
      summaryParts.push(`The group has previously enjoyed ${uniquePositive.join(', ')}.`);
    }
    if (uniqueNegative.length > 0) {
      summaryParts.push(`They tend to dislike venues that are ${uniqueNegative.join(', ')}.`);
    }
    
    if (summaryParts.length > 0) {
      preferenceSummary = ' ' + summaryParts.join(' ');
    }
  }

  // Step 2: Search You.com for contextual information with personalized context
  const youQuery = `best ${params.activityType} in ${params.mood} style trending.${preferenceSummary}`;
  const youResults = await searchContextualInfo(youQuery, centroid);

  // Step 3: Extract venue names from You.com results
  const venueNames = youResults
    .map(r => extractVenueName(r.title, r.snippet))
    .filter((v): v is string => v !== null)
    // Deduplicate
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);

  // Step 4: Geocode venues and calculate scores
  const suggestionPromises = venueNames.map(async (venueName) => {
    const geocoded = await geocodeAddress(`${venueName}, near ${centroid.lat},${centroid.lon}`);
    if (!geocoded) return null;

    const lat = parseFloat(geocoded.lat);
    const lon = parseFloat(geocoded.lon);

    // Calculate travel times for each member
    const travelTimes: { [key: string]: number } = {};
    let maxTravelTime = 0;
    for (const member of params.members) {
      const distance = getDistance(
        { latitude: member.lat, longitude: member.lon },
        { latitude: lat, longitude: lon }
      );
      // Rough estimate: 50 km/h average speed
      const travelMinutes = (distance / 1000) / 50 * 60;
      travelTimes[member.id] = Math.round(travelMinutes);
      maxTravelTime = Math.max(maxTravelTime, travelMinutes);
    }

    // Get You.com context
    const youContext = await extractLocationContext(venueName, geocoded.display_name);

    // Calculate Aggregate Location Score (ALS)
    const proximityScore = 100 - Math.min(maxTravelTime * 1.5, 100); // Penalize long travel
    const trendingBoost = youContext.social_buzz_score * 5;
    const als_score = Math.round(proximityScore + trendingBoost);

    return {
      name: venueName,
      address: geocoded.display_name,
      lat,
      lon,
      als_score,
      you_context: youContext,
      travel_times: travelTimes,
    };
  });

  const suggestions = (await Promise.all(suggestionPromises)).filter((s): s is VenueSuggestion => s !== null);

  // Sort by ALS score and return top 5
  return suggestions.sort((a, b) => b.als_score - a.als_score).slice(0, 5);
}

