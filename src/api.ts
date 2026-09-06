import type { ForecastResponse, GeoPlace, GeocodingResponse } from "./types";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "not-found" | "bad-response" | "empty-query" = "network",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Could not reach the weather service. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new ApiError("The weather service returned an unexpected response. Please try again.", "bad-response");
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("The weather service returned unreadable data.", "bad-response");
  }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const name = query.trim();
  if (name.length < 2) return [];

  const url = new URL(GEOCODE_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await getJson<GeocodingResponse>(url.toString(), signal);
  return data.results ?? [];
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ForecastResponse> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "is_day",
      "precipitation",
    ].join(","),
  );
  url.searchParams.set(
    "hourly",
    ["temperature_2m", "weather_code", "precipitation_probability"].join(","),
  );
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
    ].join(","),
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  return getJson<ForecastResponse>(url.toString(), signal);
}
