#!/usr/bin/env node
/*
 * Builds docs/data/world.js: country borders as compact SVG paths for the Map tab.
 *
 * Run only when you want to regenerate the map (the output is committed):
 *   cd scripts && npm i world-atlas topojson-client topojson-simplify d3-geo world-countries && node build_map.js
 *
 * Borders: Natural Earth 1:50m via the world-atlas package (public domain), simplified
 * on the shared-arc topology so neighbouring borders stay aligned.
 * Names / regions: world-countries package.
 *
 * Path coordinates are integers in tenths of a map unit, relative (l) after the first point.
 * The page draws them inside <g transform="scale(.1)">.
 */
const fs = require("fs");
const path = require("path");
const topo = require("world-atlas/countries-50m.json");
const { feature } = require("topojson-client");
const simp = require("topojson-simplify");
const { geoNaturalEarth1, geoPath, geoArea } = require("d3-geo");
const wc = require("world-countries");

const OUT = path.join(__dirname, "..", "docs", "data", "world.js");
const W = 960;
const KEEP = 0.45; /* quantile of arc points kept by the simplifier (higher = more detail) */

/* Natural Earth features that carry no ISO number, merged into a neighbour or named by hand. */
const MERGE = { "Somaliland": "SOM", "N. Cyprus": "CYP", "Indian Ocean Ter.": "AUS" };
const SKIP_NAMES = new Set(["Siachen Glacier"]);
const KOSOVO = { n: "Kosovo", r: "Europe", sr: "Southeast Europe", dep: 0 };

/* Shorter map labels for long names. */
const SHORT = {
  "Bosnia and Herzegovina": "Bosnia & Herz.", "Central African Republic": "C. African Rep.",
  "Dominican Republic": "Dominican Rep.", "Equatorial Guinea": "Eq. Guinea",
  "United Arab Emirates": "UAE", "Republic of the Congo": "Congo", "Papua New Guinea": "Papua N. Guinea",
  "Trinidad and Tobago": "Trinidad & Tobago", "Saint Vincent and the Grenadines": "St Vincent & Gren.",
  "Saint Kitts and Nevis": "St Kitts & Nevis", "Antigua and Barbuda": "Antigua & Barb.",
  "São Tomé and Príncipe": "São Tomé & P.", "Falkland Islands": "Falkland Is.",
  "French Southern and Antarctic Lands": "Fr. S. Antarctic L.", "Marshall Islands": "Marshall Is.",
  "Solomon Islands": "Solomon Is.", "Cayman Islands": "Cayman Is.", "British Virgin Islands": "British Virgin Is.",
  "United States Virgin Islands": "US Virgin Is.", "Northern Mariana Islands": "N. Mariana Is.",
  "Turks and Caicos Islands": "Turks & Caicos", "Saint Pierre and Miquelon": "St Pierre & Miq.",
  "Wallis and Futuna": "Wallis & Futuna", "Heard Island and McDonald Islands": "Heard & McDonald Is.",
  "South Georgia": "S. Georgia", "North Macedonia": "N. Macedonia", "South Sudan": "S. Sudan",
  "Western Sahara": "W. Sahara", "Saint Helena, Ascension and Tristan da Cunha": "St Helena",
  "Saint Lucia": "St Lucia", "Saint Barthélemy": "St Barthélemy", "Saint Martin": "St Martin",
  "Sint Maarten": "Sint Maarten", "Cocos (Keeling) Islands": "Cocos Is.", "Cook Islands": "Cook Is.",
  "Norfolk Island": "Norfolk Is.", "Pitcairn Islands": "Pitcairn Is."
};

/* Hand-set label anchors [lon, lat] where the centroid of the biggest polygon looks wrong. */
const LABEL_AT = { NOR: [9.5, 61.5], FRA: [2.5, 46.6], USA: [-98, 39.5], ITA: [12.6, 42.5], JPN: [138.5, 36.5], GBR: [-2, 53.5] };

const byNum = {};
wc.forEach(c => { if (c.ccn3) byNum[c.ccn3] = c; });

/* simplify on the arc topology */
const pre = simp.presimplify(topo, simp.sphericalTriangleArea);
const stopo = simp.simplify(pre, simp.quantile(pre, 1 - KEEP));
const all = feature(stopo, stopo.objects.countries).features.filter(f => f.id !== "010"); /* drop Antarctica */
const fc = { type: "FeatureCollection", features: all };
const proj = geoNaturalEarth1().fitWidth(W, fc);
const H = Math.ceil(geoPath(proj).bounds(fc)[1][1]);

/* compact path serializer: integer tenths, relative lines */
function makeCtx() {
  let out = "", px = 0, py = 0, inL = false, lastNum = false;
  const num = n => { const s = String(n); const r = (lastNum && n >= 0 ? " " : "") + s; lastNum = true; return r; };
  return {
    moveTo(x, y) { const X = Math.round(x * 10), Y = Math.round(y * 10); lastNum = false; out += "M" + num(X) + num(Y); px = X; py = Y; inL = false; },
    lineTo(x, y) {
      const X = Math.round(x * 10), Y = Math.round(y * 10), dx = X - px, dy = Y - py;
      if (!dx && !dy) return;
      if (!inL) { out += "l"; lastNum = false; inL = true; }
      out += num(dx) + num(dy); px = X; py = Y;
    },
    closePath() { out += "z"; inL = false; lastNum = false; },
    arc() {}, rect() {}, bezierCurveTo() {}, quadraticCurveTo() {},
    take() { const o = out; out = ""; px = py = 0; inL = false; lastNum = false; return o; }
  };
}
const ctx = makeCtx();
const gpCtx = geoPath(proj, ctx);
const gp = geoPath(proj); /* for centroids and bounds */

const gp0 = null;
function largestPolygon(f) {
  const g = f.geometry;
  if (g.type === "Polygon") return f;
  let best = null, ba = -1;
  g.coordinates.forEach(c => {
    const p = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: c } };
    const a = gp.area(p);
    if (a > ba) { ba = a; best = p; }
  });
  return best;
}

const items = {};
const pending = [];
all.forEach(f => {
  const nm = f.properties.name;
  if (SKIP_NAMES.has(nm)) return;
  let iso, meta = null;
  if (f.id && byNum[f.id]) {
    const c = byNum[f.id];
    iso = c.cca3;
    meta = { n: c.name.common, r: c.region, sr: c.subregion, dep: c.independent ? 0 : 1 };
  } else if (nm === "Kosovo") { iso = "XKX"; meta = KOSOVO; }
  else if (MERGE[nm]) { iso = MERGE[nm]; }
  else { console.warn("unmapped feature", f.id, nm); return; }
  const add = it => {
    gpCtx(f);
    it.d.push(ctx.take());
    it.area += geoArea(f);
  };
  if (meta) {
    const it = items[iso] || (items[iso] = Object.assign({ i: iso, d: [], area: 0 }, meta));
    add(it);
    const lp = largestPolygon(f);
    const pa = gp.area(lp);
    if (it.pa === undefined || pa > it.pa) { /* label/bbox come from the biggest part across all features of this country */
      const b = gp.bounds(lp);
      let [cx, cy] = gp.centroid(lp);
      if (!isFinite(cx) || !isFinite(cy)) { cx = (b[0][0] + b[1][0]) / 2; cy = (b[0][1] + b[1][1]) / 2; }
      if (!isFinite(cx) || !isFinite(cy)) { const ll = (byNum[f.id] || {}).latlng; const q = ll ? proj([ll[1], ll[0]]) : [0, 0]; cx = q[0]; cy = q[1]; }
      it.pa = pa; it.x = +cx.toFixed(1); it.y = +cy.toFixed(1);
      it.bw = +(b[1][0] - b[0][0]).toFixed(1) || 0; it.bh = +(b[1][1] - b[0][1]).toFixed(1) || 0;
    }
  } else pending.push([iso, add]);
});
pending.forEach(([iso, add]) => {
  if (!items[iso]) { console.warn("merge target missing", iso); return; }
  add(items[iso]);
});

/* Tuvalu is too small for the 1:50m data: add it as a point. */
const tv = byNum["798"];
if (tv && !items[tv.cca3]) {
  const p = proj([179.2, -8.5]);
  items[tv.cca3] = { i: tv.cca3, n: tv.name.common, r: tv.region, sr: tv.subregion, dep: 0, d: [], area: 0, x: +p[0].toFixed(1), y: +p[1].toFixed(1), bw: 0, bh: 0, pt: 1 };
}

Object.keys(LABEL_AT).forEach(k => {
  if (items[k]) { const p = proj(LABEL_AT[k]); items[k].x = +p[0].toFixed(1); items[k].y = +p[1].toFixed(1); }
});

const list = Object.values(items).map(it => {
  const o = {
    i: it.i, n: it.n, l: SHORT[it.n] || it.n, r: it.r || "", sr: it.sr || "", dep: it.dep ? 1 : 0,
    d: it.d.join(""), x: it.x, y: it.y, bw: it.bw || 0, bh: it.bh || 0
  };
  if (Math.max(o.bw, o.bh) < 7 || it.pt) o.p = 1; /* also draw a clickable dot */
  o._a = it.area;
  return o;
});
list.sort((a, b) => b._a - a._a); /* big first, small on top */
list.forEach(o => delete o._a);

const out = "window.WORLD=" + JSON.stringify({ w: W, h: H, countries: list }) + ";";
fs.writeFileSync(OUT, out);
console.log("countries:", list.length, "size KB:", Math.round(out.length / 1024), "viewBox", W, H);
