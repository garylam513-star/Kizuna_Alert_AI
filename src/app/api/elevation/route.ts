import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${apiKey}`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          return NextResponse.json({
            elevationMeters: Math.round(data.results[0].elevation * 10) / 10,
            resolution: data.results[0].resolution,
            source: 'google_elevation_api',
          });
        }
      } catch (apiErr) {
        console.warn('Failed to fetch from Google Maps Elevation API:', apiErr);
      }
    }

    // High accuracy fallback for presets or simulated terrain
    // Onna Coast: ~3.2m
    if (Math.abs(lat - 26.4950) < 0.05 && Math.abs(lng - 127.8540) < 0.05) {
      return NextResponse.json({ elevationMeters: 3.2, source: 'curated_topography' });
    }
    // Shibuya: ~22.0m
    if (Math.abs(lat - 35.6595) < 0.05 && Math.abs(lng - 139.7005) < 0.05) {
      return NextResponse.json({ elevationMeters: 22.0, source: 'curated_topography' });
    }
    // Umeda: ~1.8m
    if (Math.abs(lat - 34.7024) < 0.05 && Math.abs(lng - 135.4959) < 0.05) {
      return NextResponse.json({ elevationMeters: 1.8, source: 'curated_topography' });
    }

    // Default simulated elevation
    const mockElevation = Math.max(1.5, Math.round(((Math.sin(lat * 10) + Math.cos(lng * 10) + 1.2) * 8) * 10) / 10);
    return NextResponse.json({ elevationMeters: mockElevation, source: 'simulated_mesh' });
  } catch (error) {
    console.error('Elevation API route error:', error);
    return NextResponse.json({ elevationMeters: 5.0, source: 'fallback' });
  }
}
