'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  high: number;
  low: number;
  condition: string;
  description: string;
  icon: string;
}

const WEATHER_ICONS: Record<string, string> = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
};

function getCachedWeather(): WeatherData | null {
  try {
    const cached = localStorage.getItem('weather-data');
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 30 * 60 * 1000) return data;
    return null;
  } catch {
    return null;
  }
}

function cacheWeather(data: WeatherData) {
  localStorage.setItem('weather-data', JSON.stringify({ data, timestamp: Date.now() }));
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedWeather();
    if (cached) {
      setWeather(cached);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          cacheWeather(data);
          setWeather(data);
        } catch {
          setError('Unable to load weather');
        }
      },
      () => setError('Location access denied')
    );
  }, []);

  if (error) {
    return (
      <div className="px-5 py-4">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Current Weather</p>
        <p className="text-xs text-text-muted">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="px-5 py-4">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Current Weather</p>
        <p className="text-xs text-text-muted">Loading...</p>
      </div>
    );
  }

  const icon = WEATHER_ICONS[weather.condition] || '🌤️';

  return (
    <div className="px-5 py-4">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Current Weather</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-2xl font-bold text-text">{weather.temp}°F</p>
            <p className="text-xs text-text-muted capitalize">{weather.description}</p>
          </div>
        </div>
        <div className="text-right text-xs text-text-muted">
          <p>High: {weather.high}°</p>
          <p>Low: {weather.low}°</p>
        </div>
      </div>
    </div>
  );
}
