// Geocode a city/place string using Nominatim (OpenStreetMap).
// Free, no API key, ~1 req/sec rate limit.
// https://operations.osmfoundation.org/policies/nominatim/

export interface Geocoded {
  display: string;     // canonical display name e.g. "Madison, Wisconsin, United States"
  city: string;        // simplified for storage e.g. "Madison, WI"
  lat: number;
  lng: number;
}

export async function geocode(query: string): Promise<Geocoded | null> {
  if (!query.trim()) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a User-Agent identifying the application
        'User-Agent': 'thegivingexperiment.com (johnny@thegivingexperiment.com)',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const r = data[0];
    return {
      display: r.display_name,
      city: simplifyCity(r),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
  } catch {
    return null;
  }
}

// Turn Nominatim's verbose name into "City, ST" or "City, Country"
function simplifyCity(r: { display_name: string; address?: Record<string, string> }): string {
  const a = r.address || {};
  const place = a.city || a.town || a.village || a.hamlet || a.municipality || a.county || '';
  const region = a['ISO3166-2-lvl4'] || a.state_code || a.state || a.country_code?.toUpperCase() || a.country || '';
  if (place && region) {
    // If region looks like "US-MI", trim to "MI"
    const r2 = region.includes('-') ? region.split('-').pop() : region;
    return `${place}, ${r2}`;
  }
  return r.display_name.split(',').slice(0, 2).join(',').trim();
}
