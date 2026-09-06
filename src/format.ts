import type { TemperatureUnit } from "./types";

export function cToF(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function formatTemp(celsius: number, unit: TemperatureUnit, withUnit = true): string {
  const value = unit === "f" ? cToF(celsius) : celsius;
  const rounded = Math.round(value);
  return withUnit ? `${rounded}°${unit === "f" ? "F" : "C"}` : `${rounded}°`;
}

export function formatWind(kmh: number, unit: TemperatureUnit): string {
  if (unit === "f") {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatPrecip(mm: number, unit: TemperatureUnit): string {
  if (mm <= 0) return "None";
  if (unit === "f") {
    return `${(mm / 25.4).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function compassFromDegrees(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return dirs[index] ?? "N";
}

export function formatPlace(place: {
  name: string;
  admin1?: string;
  country?: string;
}): string {
  const parts = [place.name];
  if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
  if (place.country) parts.push(place.country);
  return parts.join(", ");
}

/** Open-Meteo returns timezone=auto wall-clock strings with no offset. */
export function weekdayLabel(isoDate: string, _timeZone: string, index: number): string {
  if (index === 0) return "Today";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 12));
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

export function hourLabel(isoTime: string, _timeZone?: string): string {
  const hour = Number(isoTime.slice(11, 13));
  if (Number.isNaN(hour)) return isoTime;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12} ${period}`;
}

export function formatUpdated(isoTime: string, _timeZone?: string): string {
  const hour = hourLabel(isoTime);
  const [year, month, day] = isoTime.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 12));
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
  return `${weekday} ${hour}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
