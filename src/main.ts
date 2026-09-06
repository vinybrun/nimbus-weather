import { ApiError, fetchForecast, searchPlaces } from "./api";
import {
  compassFromDegrees,
  escapeHtml,
  formatPlace,
  formatPrecip,
  formatTemp,
  formatUpdated,
  formatWind,
  hourLabel,
  weekdayLabel,
} from "./format";
import { loadLastPlace, loadUnit, saveLastPlace, saveUnit } from "./storage";
import type { ForecastResponse, GeoPlace, SavedPlace, TemperatureUnit } from "./types";
import { describeWeather, weatherIcon } from "./weather";

const cityInput = document.querySelector<HTMLInputElement>("#city-input")!;
const searchForm = document.querySelector<HTMLFormElement>("#search-form")!;
const suggestionsEl = document.querySelector<HTMLUListElement>("#suggestions")!;
const locateBtn = document.querySelector<HTMLButtonElement>("#locate-btn")!;
const statusEl = document.querySelector<HTMLDivElement>("#status")!;
const appEl = document.querySelector<HTMLElement>("#app")!;
const unitC = document.querySelector<HTMLButtonElement>("#unit-c")!;
const unitF = document.querySelector<HTMLButtonElement>("#unit-f")!;

const EMPTY_HTML = appEl.innerHTML;

let unit: TemperatureUnit = loadUnit();
let activePlace: SavedPlace | null = null;
let forecast: ForecastResponse | null = null;
let suggestionItems: GeoPlace[] = [];
let highlightIndex = -1;
let searchTimer = 0;
let suggestController: AbortController | null = null;
let weatherController: AbortController | null = null;

function setUnit(next: TemperatureUnit): void {
  unit = next;
  saveUnit(unit);
  unitC.setAttribute("aria-pressed", String(unit === "c"));
  unitF.setAttribute("aria-pressed", String(unit === "f"));
  if (forecast && activePlace) renderWeather(activePlace, forecast);
}

function showEmpty(): void {
  appEl.innerHTML = EMPTY_HTML;
}

function setStatus(kind: "idle" | "loading" | "error" | "empty", message = ""): void {
  statusEl.dataset.kind = kind;
  if (kind === "idle") {
    statusEl.innerHTML = "";
    return;
  }
  if (kind === "loading") {
    statusEl.innerHTML = `
      <div class="banner loading">
        <span class="spinner" aria-hidden="true"></span>
        <span>${escapeHtml(message || "Fetching the forecast…")}</span>
      </div>
    `;
    appEl.innerHTML = `
      <div class="skeleton" aria-hidden="true">
        <div class="skel lg"></div>
        <div class="skel"></div>
        <div class="skel"></div>
      </div>
    `;
    return;
  }
  statusEl.innerHTML = `<div class="banner ${kind}">${escapeHtml(message)}</div>`;
}

function hideSuggestions(): void {
  suggestionsEl.hidden = true;
  suggestionsEl.innerHTML = "";
  suggestionItems = [];
  highlightIndex = -1;
  cityInput.setAttribute("aria-expanded", "false");
}

function renderSuggestions(places: GeoPlace[]): void {
  suggestionItems = places;
  highlightIndex = places.length ? 0 : -1;
  if (!places.length) {
    hideSuggestions();
    return;
  }

  suggestionsEl.hidden = false;
  cityInput.setAttribute("aria-expanded", "true");
  suggestionsEl.innerHTML = places
    .map((place, index) => {
      const subtitle = [place.admin1, place.country].filter(Boolean).join(", ");
      return `
        <li>
          <button type="button" class="suggestion" role="option" data-index="${index}" aria-selected="${index === 0}">
            <strong>${escapeHtml(place.name)}</strong>
            <small>${escapeHtml(subtitle)}</small>
          </button>
        </li>
      `;
    })
    .join("");
}

function updateHighlight(next: number): void {
  if (!suggestionItems.length) return;
  highlightIndex = (next + suggestionItems.length) % suggestionItems.length;
  suggestionsEl.querySelectorAll<HTMLButtonElement>("button").forEach((button, index) => {
    button.setAttribute("aria-selected", String(index === highlightIndex));
  });
}

async function loadSuggestions(query: string): Promise<void> {
  suggestController?.abort();
  if (query.trim().length < 2) {
    hideSuggestions();
    return;
  }
  suggestController = new AbortController();
  try {
    const places = await searchPlaces(query, suggestController.signal);
    if (cityInput.value.trim() !== query.trim()) return;
    renderSuggestions(places);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    hideSuggestions();
  }
}

function labelFromTimezone(timezone: string): string {
  const leaf = timezone.split("/").pop() ?? timezone;
  return leaf.replaceAll("_", " ");
}

function toSavedPlace(place: GeoPlace, source: SavedPlace["source"]): SavedPlace {
  return {
    name: place.name,
    country: place.country,
    admin1: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
    source,
  };
}

async function loadWeather(place: SavedPlace, label?: string): Promise<void> {
  weatherController?.abort();
  weatherController = new AbortController();
  activePlace = place;
  saveLastPlace(place);
  hideSuggestions();
  setStatus("loading", label ?? `Loading weather for ${place.name}…`);

  try {
    const data = await fetchForecast(place.latitude, place.longitude, weatherController.signal);
    forecast = data;
    if (place.source === "geo" && place.name === "Your location") {
      place = {
        ...place,
        name: labelFromTimezone(data.timezone),
        admin1: `${place.latitude.toFixed(2)}°, ${place.longitude.toFixed(2)}°`,
      };
      activePlace = place;
      saveLastPlace(place);
      cityInput.value = place.name;
    }
    setStatus("idle");
    renderWeather(place, data);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    forecast = null;
    showEmpty();
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while loading the forecast.";
    setStatus("error", message);
  }
}

function renderWeather(place: SavedPlace, data: ForecastResponse): void {
  const current = data.current;
  const meta = describeWeather(current.weather_code, current.is_day === 1);
  document.body.dataset.atmosphere = meta.atmosphere;
  document.title = `${formatTemp(current.temperature_2m, unit)} in ${place.name} · Nimbus`;

  const locationLine = formatPlace(place);
  const wind = `${formatWind(current.wind_speed_10m, unit)} ${compassFromDegrees(current.wind_direction_10m)}`;

  const now = new Date(current.time).getTime();
  const hourlyItems: string[] = [];
  for (let i = 0; i < data.hourly.time.length && hourlyItems.length < 12; i += 1) {
    const stamp = new Date(data.hourly.time[i]).getTime();
    if (stamp < now - 30 * 60 * 1000) continue;
    const code = data.hourly.weather_code[i];
    const pop = data.hourly.precipitation_probability[i];
    hourlyItems.push(`
      <article class="hour">
        <p class="when">${escapeHtml(hourLabel(data.hourly.time[i]))}</p>
        ${weatherIcon(code, true)}
        <p class="hour-temp">${escapeHtml(formatTemp(data.hourly.temperature_2m[i], unit, false))}</p>
        <p class="pop">${pop == null ? "—" : `${pop}%`}</p>
      </article>
    `);
  }

  const days = data.daily.time
    .map((date, index) => {
      const code = data.daily.weather_code[index];
      const dayMeta = describeWeather(code, true);
      const pop = data.daily.precipitation_probability_max[index];
      return `
        <article class="day">
          <p class="day-label">${escapeHtml(weekdayLabel(date, data.timezone, index))}</p>
          ${weatherIcon(code, true)}
          <p class="day-desc">${escapeHtml(dayMeta.label)}${pop == null ? "" : ` · ${pop}% rain`}</p>
          <p class="day-range">
            <span>${escapeHtml(formatTemp(data.daily.temperature_2m_max[index], unit, false))}</span>
            <span class="min">${escapeHtml(formatTemp(data.daily.temperature_2m_min[index], unit, false))}</span>
          </p>
        </article>
      `;
    })
    .join("");

  appEl.innerHTML = `
    <section class="hero">
      <div>
        <p class="kicker">Now</p>
        <h1 class="place-name">${escapeHtml(place.name)}</h1>
        <p class="place-meta">${escapeHtml(locationLine)}</p>
        <p class="updated">Updated ${escapeHtml(formatUpdated(current.time))}</p>
        <div class="temp-row">
          <span class="temp">${escapeHtml(formatTemp(current.temperature_2m, unit, false))}</span>
        </div>
        <p class="condition">
          ${weatherIcon(current.weather_code, current.is_day === 1)}
          <span>${escapeHtml(meta.label)}</span>
        </p>
      </div>
      <dl class="stats">
        <div class="stat">
          <dt>Feels like</dt>
          <dd>${escapeHtml(formatTemp(current.apparent_temperature, unit))}</dd>
        </div>
        <div class="stat">
          <dt>Humidity</dt>
          <dd>${current.relative_humidity_2m}%</dd>
        </div>
        <div class="stat">
          <dt>Wind</dt>
          <dd>${escapeHtml(wind)}</dd>
        </div>
        <div class="stat">
          <dt>Precipitation</dt>
          <dd>${escapeHtml(formatPrecip(current.precipitation, unit))}</dd>
        </div>
      </dl>
    </section>
    ${
      hourlyItems.length
        ? `
      <section class="hourly panel">
        <p class="kicker">Next hours</p>
        <div class="hourly-scroller">${hourlyItems.join("")}</div>
      </section>
    `
        : ""
    }
    <section class="daily panel">
      <p class="kicker">7-day forecast</p>
      <div class="day-list">${days}</div>
    </section>
  `;
}

async function searchCity(rawQuery: string): Promise<void> {
  const query = rawQuery.trim();
  if (!query) {
    setStatus("error", "Enter a city name to search.");
    cityInput.focus();
    return;
  }

  hideSuggestions();
  setStatus("loading", `Looking up ${query}…`);

  try {
    const places = await searchPlaces(query);
    if (!places.length) {
      showEmpty();
      setStatus(
        "empty",
        `No matching city for “${query}”. Try a different spelling, or add a country — e.g. “Paris, Texas”.`,
      );
      return;
    }
    cityInput.value = places[0].name;
    await loadWeather(toSavedPlace(places[0], "search"));
  } catch (error) {
    showEmpty();
    const message =
      error instanceof ApiError
        ? error.message
        : "Could not search for that city. Please try again.";
    setStatus("error", message);
  }
}

function requestLocation(): void {
  if (!("geolocation" in navigator)) {
    setStatus("error", "This browser does not support location lookup. Search for a city instead.");
    return;
  }

  locateBtn.disabled = true;
  setStatus("loading", "Requesting your location…");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const place: SavedPlace = {
          name: "Your location",
          latitude,
          longitude,
          source: "geo",
        };
        cityInput.value = place.name;
        await loadWeather(place, "Loading weather for your location…");
      } catch (error) {
        showEmpty();
        const message =
          error instanceof ApiError
            ? error.message
            : "Could not load weather for your location.";
        setStatus("error", message);
      } finally {
        locateBtn.disabled = false;
      }
    },
    (error) => {
      locateBtn.disabled = false;
      showEmpty();
      const messages: Record<number, string> = {
        1: "Location permission was denied. You can still search by city name.",
        2: "Your location is currently unavailable. Search by city instead.",
        3: "Location request timed out. Try again or search by city.",
      };
      setStatus("error", messages[error.code] ?? "Could not read your location.");
    },
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
  );
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (highlightIndex >= 0 && suggestionItems[highlightIndex]) {
    const place = suggestionItems[highlightIndex];
    cityInput.value = place.name;
    void loadWeather(toSavedPlace(place, "search"));
    return;
  }
  void searchCity(cityInput.value);
});

cityInput.addEventListener("focus", () => {
  cityInput.select();
});

cityInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    void loadSuggestions(cityInput.value);
  }, 220);
});

cityInput.addEventListener("keydown", (event) => {
  if (suggestionsEl.hidden) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    updateHighlight(highlightIndex + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    updateHighlight(highlightIndex - 1);
  } else if (event.key === "Escape") {
    hideSuggestions();
  }
});

suggestionsEl.addEventListener("mousedown", (event) => {
  const button = (event.target as HTMLElement).closest("button[data-index]");
  if (!button) return;
  const index = Number(button.getAttribute("data-index"));
  const place = suggestionItems[index];
  if (!place) return;
  cityInput.value = place.name;
  void loadWeather(toSavedPlace(place, "search"));
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Node)) return;
  if (!searchForm.contains(event.target)) hideSuggestions();
});

appEl.addEventListener("click", (event) => {
  const chip = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-city]");
  if (!chip?.dataset.city) return;
  cityInput.value = chip.dataset.city;
  void searchCity(chip.dataset.city);
});

locateBtn.addEventListener("click", () => requestLocation());
unitC.addEventListener("click", () => setUnit("c"));
unitF.addEventListener("click", () => setUnit("f"));

setUnit(unit);

const last = loadLastPlace();
if (last) {
  cityInput.value = last.name;
  void loadWeather(last, `Restoring weather for ${last.name}…`);
} else {
  setStatus("idle");
}
