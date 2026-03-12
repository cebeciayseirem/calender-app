import { NextRequest, NextResponse } from 'next/server';

const WMO_CONDITIONS: Record<number, { condition: string; description: string }> = {
  0: { condition: 'Clear', description: 'clear sky' },
  1: { condition: 'Clear', description: 'mainly clear' },
  2: { condition: 'Clouds', description: 'partly cloudy' },
  3: { condition: 'Clouds', description: 'overcast' },
  45: { condition: 'Fog', description: 'fog' },
  48: { condition: 'Fog', description: 'depositing rime fog' },
  51: { condition: 'Drizzle', description: 'light drizzle' },
  53: { condition: 'Drizzle', description: 'moderate drizzle' },
  55: { condition: 'Drizzle', description: 'dense drizzle' },
  61: { condition: 'Rain', description: 'slight rain' },
  63: { condition: 'Rain', description: 'moderate rain' },
  65: { condition: 'Rain', description: 'heavy rain' },
  71: { condition: 'Snow', description: 'slight snow' },
  73: { condition: 'Snow', description: 'moderate snow' },
  75: { condition: 'Snow', description: 'heavy snow' },
  80: { condition: 'Rain', description: 'slight rain showers' },
  81: { condition: 'Rain', description: 'moderate rain showers' },
  82: { condition: 'Rain', description: 'violent rain showers' },
  95: { condition: 'Thunderstorm', description: 'thunderstorm' },
  96: { condition: 'Thunderstorm', description: 'thunderstorm with slight hail' },
  99: { condition: 'Thunderstorm', description: 'thunderstorm with heavy hail' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Weather API error' }, { status: 502 });
    }

    const data = await res.json();
    const weatherCode = data.current?.weather_code ?? 0;
    const mapped = WMO_CONDITIONS[weatherCode] || { condition: 'Unknown', description: 'unknown' };

    return NextResponse.json({
      temp: Math.round(data.current.temperature_2m),
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      condition: mapped.condition,
      description: mapped.description,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}
