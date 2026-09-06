import type { Atmosphere, WeatherMeta } from "./types";

const CODES: Record<number, WeatherMeta> = {
  0: { label: "Clear sky", atmosphere: "clear-day" },
  1: { label: "Mainly clear", atmosphere: "clear-day" },
  2: { label: "Partly cloudy", atmosphere: "cloudy" },
  3: { label: "Overcast", atmosphere: "overcast" },
  45: { label: "Fog", atmosphere: "fog" },
  48: { label: "Rime fog", atmosphere: "fog" },
  51: { label: "Light drizzle", atmosphere: "drizzle" },
  53: { label: "Drizzle", atmosphere: "drizzle" },
  55: { label: "Dense drizzle", atmosphere: "drizzle" },
  56: { label: "Freezing drizzle", atmosphere: "drizzle" },
  57: { label: "Heavy freezing drizzle", atmosphere: "drizzle" },
  61: { label: "Light rain", atmosphere: "rain" },
  63: { label: "Rain", atmosphere: "rain" },
  65: { label: "Heavy rain", atmosphere: "rain" },
  66: { label: "Freezing rain", atmosphere: "rain" },
  67: { label: "Heavy freezing rain", atmosphere: "rain" },
  71: { label: "Light snow", atmosphere: "snow" },
  73: { label: "Snow", atmosphere: "snow" },
  75: { label: "Heavy snow", atmosphere: "snow" },
  77: { label: "Snow grains", atmosphere: "snow" },
  80: { label: "Rain showers", atmosphere: "rain" },
  81: { label: "Heavy showers", atmosphere: "rain" },
  82: { label: "Violent showers", atmosphere: "rain" },
  85: { label: "Snow showers", atmosphere: "snow" },
  86: { label: "Heavy snow showers", atmosphere: "snow" },
  95: { label: "Thunderstorm", atmosphere: "thunder" },
  96: { label: "Thunderstorm with hail", atmosphere: "thunder" },
  99: { label: "Severe thunderstorm", atmosphere: "thunder" },
};

export function describeWeather(code: number, isDay = true): WeatherMeta {
  const meta = CODES[code] ?? { label: "Unknown conditions", atmosphere: "cloudy" as Atmosphere };
  if ((code === 0 || code === 1) && !isDay) {
    return { label: code === 0 ? "Clear night" : "Mostly clear night", atmosphere: "clear-night" };
  }
  return meta;
}

export function weatherIcon(code: number, isDay = true): string {
  if (code === 0) return isDay ? sunIcon() : moonIcon();
  if (code === 1) return isDay ? sunCloudIcon() : moonCloudIcon();
  if (code === 2) return isDay ? sunCloudIcon() : moonCloudIcon();
  if (code === 3) return cloudIcon();
  if (code === 45 || code === 48) return fogIcon();
  if (code >= 51 && code <= 57) return drizzleIcon();
  if (code >= 61 && code <= 67) return rainIcon();
  if (code >= 71 && code <= 77) return snowIcon();
  if (code >= 80 && code <= 82) return rainIcon();
  if (code === 85 || code === 86) return snowIcon();
  if (code >= 95) return thunderIcon();
  return cloudIcon();
}

function svg(inner: string): string {
  return `<svg class="wx-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${inner}</svg>`;
}

function sunIcon(): string {
  return svg(`
    <circle cx="32" cy="32" r="11" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="3" stroke-linecap="round">
      <path d="M32 6v8M32 50v8M6 32h8M50 32h8M13 13l6 6M45 45l6 6M13 51l6-6M45 19l6-6"/>
    </g>
  `);
}

function moonIcon(): string {
  return svg(`<path fill="currentColor" d="M40 8a22 22 0 1 0 14 38A20 20 0 0 1 40 8z"/>`);
}

function cloudIcon(): string {
  return svg(`<path fill="currentColor" d="M22 46h24a12 12 0 0 0 1.2-23.9A16 16 0 0 0 17 28.5 11 11 0 0 0 22 46z"/>`);
}

function sunCloudIcon(): string {
  return svg(`
    <circle cx="42" cy="20" r="8" fill="currentColor"/>
    <path fill="currentColor" d="M20 50h26a11 11 0 0 0 1-22 15 15 0 0 0-28 5A10 10 0 0 0 20 50z" opacity=".95"/>
  `);
}

function moonCloudIcon(): string {
  return svg(`
    <path fill="currentColor" d="M46 12a12 12 0 0 0 8 20 12 12 0 1 1-8-20z" opacity=".85"/>
    <path fill="currentColor" d="M18 50h28a11 11 0 0 0 1-22 15 15 0 0 0-28 5A10 10 0 0 0 18 50z"/>
  `);
}

function rainIcon(): string {
  return svg(`
    <path fill="currentColor" d="M20 38h26a11 11 0 0 0 1-21.8A15 15 0 0 0 18 22a10 10 0 0 0 2 16z"/>
    <g stroke="currentColor" stroke-width="3" stroke-linecap="round">
      <path d="M24 46v8M32 48v8M40 46v8"/>
    </g>
  `);
}

function drizzleIcon(): string {
  return svg(`
    <path fill="currentColor" d="M20 38h26a11 11 0 0 0 1-21.8A15 15 0 0 0 18 22a10 10 0 0 0 2 16z"/>
    <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <path d="M24 46v3M32 48v3M40 46v3"/>
    </g>
  `);
}

function snowIcon(): string {
  return svg(`
    <path fill="currentColor" d="M20 36h26a11 11 0 0 0 1-21.8A15 15 0 0 0 18 20a10 10 0 0 0 2 16z"/>
    <g fill="currentColor">
      <circle cx="24" cy="48" r="2.2"/>
      <circle cx="33" cy="52" r="2.2"/>
      <circle cx="41" cy="47" r="2.2"/>
    </g>
  `);
}

function thunderIcon(): string {
  return svg(`
    <path fill="currentColor" d="M20 34h26a11 11 0 0 0 1-21.8A15 15 0 0 0 18 18a10 10 0 0 0 2 16z"/>
    <path fill="currentColor" d="M34 32 24 50h9l-2 12 14-20h-9l6-10z"/>
  `);
}

function fogIcon(): string {
  return svg(`
    <g stroke="currentColor" stroke-width="3.5" stroke-linecap="round">
      <path d="M12 24h40M10 34h44M16 44h32"/>
    </g>
  `);
}
