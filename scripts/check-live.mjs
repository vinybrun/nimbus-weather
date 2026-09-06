#!/usr/bin/env node
/**
 * Lightweight live-site check. No extra dependencies.
 * Usage: node scripts/check-live.mjs [url]
 */

const base = (process.argv[2] ?? "https://vinybrun.github.io/nimbus-weather/").replace(/\/?$/, "/");

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function get(path, { expectType } = {}) {
  const url = new URL(path, base).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  assert(response.ok, `${url} -> HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (expectType) assert(type.includes(expectType), `${url} content-type ${type}`);
  return { url, type, body: await response.text() };
}

const html = await get("./", { expectType: "text/html" });
assert(html.body.includes("Nimbus"), "HTML missing Nimbus title/brand");
assert(html.body.includes("city-input"), "HTML missing city search");
assert(html.body.includes("locate-btn"), "HTML missing geolocation control");
assert(html.body.includes("./app.js"), "HTML missing app.js");
assert(html.body.includes("./app.css"), "HTML missing app.css");

const js = await get("./app.js", { expectType: "javascript" });
assert(js.body.includes("open-meteo.com"), "bundle does not call Open-Meteo");
assert(js.body.includes("geocoding-api.open-meteo.com"), "bundle missing geocoding");

const css = await get("./app.css", { expectType: "text/css" });
assert(css.body.includes(".hero") || css.body.includes(".search"), "CSS missing layout rules");

const icon = await get("./favicon.svg");
assert(icon.body.includes("<svg"), "favicon missing");

console.log(`OK  ${base}`);
console.log(`    html=${html.body.length}B  js=${js.body.length}B  css=${css.body.length}B`);
