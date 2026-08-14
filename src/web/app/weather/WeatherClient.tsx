'use client';

import { useState, useEffect, useCallback } from 'react';

interface WeatherData {
  latitude: number;
  longitude: number;
  current: {
    temperature: number;
    relative_humidity: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed: number;
    time: string;
  };
  timezone: string;
}

const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌧️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '⛈️' },
  71: { description: 'Slight snow', icon: '❄️' },
  73: { description: 'Moderate snow', icon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  77: { description: 'Snow grains', icon: '❄️' },
  80: { description: 'Slight rain showers', icon: '🌧️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  85: { description: 'Slight snow showers', icon: '❄️' },
  86: { description: 'Heavy snow showers', icon: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with hail', icon: '⛈️' },
};

export function WeatherClient() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user's geolocation
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err)
        );
      });

      // Fetch weather data from Open-Meteo API (free, no API key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${position.latitude}&` +
        `longitude=${position.longitude}&` +
        `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&` +
        `timezone=auto`
      );

      if (!response.ok) throw new Error('Failed to fetch weather data');

      const data = await response.json();
      setWeather({
        latitude: position.latitude,
        longitude: position.longitude,
        current: data.current,
        timezone: data.timezone,
      });
    } catch (err) {
      const message =
        err instanceof GeolocationPositionError
          ? 'Please enable location access to see weather'
          : err instanceof Error
          ? err.message
          : 'Failed to fetch weather data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const weatherInfo = weather ? WEATHER_CODES[weather.current.weather_code] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Weather</h1>

        {loading && (
          <div className="text-center text-white">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p>Loading weather data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg p-6 text-red-800 dark:text-red-200">
            <p className="font-medium">⚠️ {error}</p>
            <button
              onClick={() => fetchWeather()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {weather && weatherInfo && (
          <div className="space-y-6">
            {/* Main weather card */}
            <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl p-8 text-center">
              <div className="text-6xl mb-4">{weatherInfo.icon}</div>
              <p className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                {weatherInfo.description}
              </p>
              <div className="flex justify-center gap-8 mb-6">
                <div>
                  <p className="text-5xl font-bold text-blue-600">
                    {Math.round(weather.current.temperature)}°
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Temperature</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-400">
                    {Math.round(weather.current.apparent_temperature)}°
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Feels Like</p>
                </div>
              </div>

              {/* Additional info grid */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-100 dark:bg-zinc-700 rounded-2xl p-6">
                <div className="text-left">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                    Humidity
                  </p>
                  <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
                    {weather.current.relative_humidity}%
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                    Wind Speed
                  </p>
                  <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
                    {Math.round(weather.current.wind_speed)} km/h
                  </p>
                </div>
              </div>

              {/* Location and time */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  📍 Lat: {weather.latitude.toFixed(2)}, Lon: {weather.longitude.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  ⏰ {new Date(weather.current.time).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  🌍 {weather.timezone}
                </p>
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => fetchWeather()}
              className="w-full bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-xl py-3 font-semibold hover:shadow-lg transition-shadow"
            >
              🔄 Refresh Weather
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
