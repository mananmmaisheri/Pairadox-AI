
// Open-Meteo API (Free, no key required)

interface GeoResult {
  results?: {
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }[];
}

interface WeatherResult {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  current_weather_units?: {
    temperature: string;
    windspeed: string;
  }
}

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

// Helper for Geolocation
const getCurrentPosition = (): Promise<{lat: number, lon: number}> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => reject(err),
            { timeout: 5000 }
        );
    });
};

export const getWeather = async (location: string): Promise<string> => {
  try {
    let latitude: number;
    let longitude: number;
    let locationName = location;
    let unitTemp = '°C';
    let unitWind = 'km/h';

    // Check if location is "current_location" (from tool call)
    if (location.toLowerCase() === 'current_location' || location.toLowerCase() === 'here') {
        try {
            const pos = await getCurrentPosition();
            latitude = pos.lat;
            longitude = pos.lon;
            locationName = "Your Current Location";
        } catch (e) {
            console.warn("Geolocation failed, defaulting to London");
            // Fallback if permission denied
            latitude = 51.5074;
            longitude = -0.1278;
            locationName = "London, UK (Default)";
        }
    } else {
        // 1. Geocoding for specific city
        // We use a broader search to handle fuzzy inputs
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData: GeoResult = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return `Could not find weather data for: "${location}". Please try a major city name.`;
        }

        const res = geoData.results[0];
        latitude = res.latitude;
        longitude = res.longitude;
        locationName = `${res.name}, ${res.country}`;
    }

    // 2. Weather
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData: WeatherResult = await weatherRes.json();

    const current = weatherData.current_weather;
    const condition = WMO_CODES[current.weathercode] || 'Unknown';
    if (weatherData.current_weather_units) {
        unitTemp = weatherData.current_weather_units.temperature;
        unitWind = weatherData.current_weather_units.windspeed;
    }

    return JSON.stringify({
      location: locationName,
      temperature: `${current.temperature}${unitTemp}`,
      condition: condition,
      wind: `${current.windspeed} ${unitWind}`
    });

  } catch (error) {
    console.error("Weather API Error:", error);
    return "Error fetching weather data. Please try again.";
  }
};
