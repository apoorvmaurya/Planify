import axios from 'axios';

const YOU_API_KEY = process.env.YOU_API_KEY!;
const YOU_API_BASE = 'https://api.you.com';

interface YouSearchResult {
  title: string;
  snippet: string;
  url: string;
  age?: string;
}

export interface YouContextData {
  trending_mentions: string[];
  sentiment_summary: string;
  recent_features: string[];
  social_buzz_score: number;
}

export async function searchContextualInfo(
  query: string,
  location?: { lat: number; lon: number }
): Promise<YouSearchResult[]> {
  try {
    const locationQuery = location
      ? `${query} near ${location.lat},${location.lon}`
      : query;

    const response = await axios.get(`${YOU_API_BASE}/search`, {
      headers: {
        'X-API-Key': YOU_API_KEY,
      },
      params: {
        query: locationQuery,
        count: 10,
        safeSearch: 'strict',
        freshness: 'week', // Only recent results
      },
      timeout: 15000,
    });
    return response.data.results?.hits || [];
  } catch (error) {
    console.error('You.com search error:', error);
    return [];
  }
}

export async function extractLocationContext(
  venueName: string,
  venueAddress: string
): Promise<YouContextData> {
  const searchQuery = `${venueName} ${venueAddress} reviews trending`;
  const results = await searchContextualInfo(searchQuery);

  if (results.length === 0) {
    return {
      trending_mentions: [],
      sentiment_summary: 'Neutral',
      recent_features: [],
      social_buzz_score: 0,
    };
  }

  // Extract mentions and sentiment
  const mentions = results
    .filter(r => r.snippet.toLowerCase().includes(venueName.toLowerCase()))
    .map(r => r.title);

  const recentFeatures = results
    .filter(r => r.age && (r.age.includes('day') || r.age.includes('hour')))
    .map(r => `${r.title} (${r.age})`);

  // Simple sentiment scoring
  const positiveKeywords = ['best', 'amazing', 'great', 'excellent', 'featured', 'love', 'must-try'];
  const sentimentScore = results.reduce((score, result) => {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    return score + positiveKeywords.filter(kw => text.includes(kw)).length;
  }, 0);

  return {
    trending_mentions: mentions.slice(0, 5),
    sentiment_summary: sentimentScore > 3 ? 'Highly Positive' : 'Neutral',
    recent_features: recentFeatures.slice(0, 3),
    social_buzz_score: Math.min(sentimentScore, 10),
  };
}

