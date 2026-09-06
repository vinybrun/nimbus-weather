import type { SavedPlace, TemperatureUnit } from "./types";

const UNIT_KEY = "nimbus:unit";
const PLACE_KEY = "nimbus:last-place";

export function loadUnit(): TemperatureUnit {
  try {
    const value = localStorage.getItem(UNIT_KEY);
    return value === "f" ? "f" : "c";
  } catch {
    return "c";
  }
}

export function saveUnit(unit: TemperatureUnit): void {
  try {
    localStorage.setItem(UNIT_KEY, unit);
  } catch {
    // Private mode or blocked storage should not break the app.
  }
}

export function loadLastPlace(): SavedPlace | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPlace;
    if (
      typeof parsed.name === "string" &&
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLastPlace(place: SavedPlace): void {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {
    // Ignore quota / privacy errors.
  }
}
