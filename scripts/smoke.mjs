#!/usr/bin/env node
/**
 * Contract smoke test against Open-Meteo (no API key).
 * Verifies geocoding + forecast fields the UI depends on.
 */

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  assert(response.ok, `${url} -> HTTP ${response.status}`);
  return response.json();
}

const geoUrl = new URL(GEOCODE);
geoUrl.searchParams.set("name", "Lisbon");
geoUrl.searchParams.set("count", "1");
geoUrl.searchParams.set("language", "en");
geoUrl.searchParams.set("format", "json");

const geo = await getJson(geoUrl);
const place = geo.results?.[0];
assert(place?.name, "geocoding returned no Lisbon result");
assert(typeof place.latitude === "number", "missing latitude");
assert(typeof place.longitude === "number", "missing longitude");

const miss = await getJson(`${GEOCODE}?name=zzzznotacity999&count=1&language=en&format=json`);
assert(!miss.results?.length, "invalid city should return no results");

const forecastUrl = new URL(FORECAST);
forecastUrl.searchParams.set("latitude", String(place.latitude));
forecastUrl.searchParams.set("longitude", String(place.longitude));
forecastUrl.searchParams.set(
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
forecastUrl.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability");
forecastUrl.searchParams.set(
  "daily",
  "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
);
forecastUrl.searchParams.set("timezone", "auto");
forecastUrl.searchParams.set("forecast_days", "7");

const data = await getJson(forecastUrl);
const current = data.current;
assert(typeof current.temperature_2m === "number", "current temperature");
assert(typeof current.apparent_temperature === "number", "feels-like");
assert(typeof current.relative_humidity_2m === "number", "humidity");
assert(typeof current.wind_speed_10m === "number", "wind");
assert(typeof current.weather_code === "number", "weather code");
assert(Array.isArray(data.daily.time) && data.daily.time.length >= 5, "5-day forecast");
assert(data.daily.temperature_2m_max.length === data.daily.time.length, "daily highs");
assert(data.hourly.time.length > 12, "hourly strip");

console.log(
  `OK  ${place.name} ${current.temperature_2m}°C  days=${data.daily.time.length}  hourly=${data.hourly.time.length}`,
);
