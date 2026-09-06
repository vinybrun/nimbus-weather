# Nimbus

A polished, responsive weather app. Search any city, optionally use browser geolocation, and read current conditions plus a 7-day forecast. Data comes from [Open-Meteo](https://open-meteo.com/) — no API key.

**Live:** https://vinybrun.github.io/nimbus-weather/

## Features

- City search with live suggestions and keyboard navigation
- Invalid-city handling when Open-Meteo finds no match
- Optional “Near me” via the browser Geolocation API
- Current temperature, description, humidity, wind, feels-like, and precipitation
- °C / °F toggle (wind and precipitation convert with it)
- Next-12-hours strip and 7-day forecast
- Loading skeletons, network errors, and permission-denied states
- Last city and unit preference saved in `localStorage`
- Mobile and desktop layouts, with atmosphere-aware backgrounds

## Run locally

Requires Node.js 18+.

From this directory (the folder that contains `package.json`):

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

Other scripts:

```bash
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript only
```

In the original workspace the project lives at `weather-app/`. After cloning the GitHub repo, this README is the project root.

## API

No keys. The browser calls Open-Meteo directly:

| Purpose | Endpoint |
| --- | --- |
| City search | `https://geocoding-api.open-meteo.com/v1/search` |
| Forecast | `https://api.open-meteo.com/v1/forecast` |

Browser geolocation supplies coordinates. Open-Meteo has no reverse-geocoding endpoint, so the app labels that view from the forecast timezone (for example `Europe/Lisbon` → Lisbon) and shows the coordinates underneath.

Current fields: `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `weather_code`, `wind_speed_10m`, `wind_direction_10m`, `precipitation`. Daily fields cover 7 days of highs, lows, weather code, and precipitation probability.

## Deploy

The production build is a static site in `dist/`.

### GitHub Pages (included)

This repo includes `.github/workflows/deploy.yml`. After the repo exists on GitHub:

1. Push `main`.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow publishes `dist/` to `https://<user>.github.io/<repo>/`.

### Vercel

```bash
npx vercel --prod
```

Or import the GitHub repo in the Vercel dashboard. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.

### Netlify

```bash
npx netlify deploy --prod --dir=dist
```

Or set build command `npm run build` and publish directory `dist`.

### Cloudflare Pages

Create a Pages project from the repo. Build command `npm run build`, output directory `dist`.

## License

Weather data © Open-Meteo contributors. App source is provided as-is for this project.
