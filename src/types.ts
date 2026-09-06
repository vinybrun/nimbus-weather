export type TemperatureUnit = "c" | "f";

export interface GeoPlace {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
}

export interface GeocodingResponse {
  results?: GeoPlace[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  current_units: {
    temperature_2m: string;
    apparent_temperature: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
  };
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    is_day: 0 | 1;
    precipitation: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: (number | null)[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface SavedPlace {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  source: "search" | "geo";
}

export type Atmosphere =
  | "clear-day"
  | "clear-night"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

export interface WeatherMeta {
  label: string;
  atmosphere: Atmosphere;
}
