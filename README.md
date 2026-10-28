# Precursor Chemical ID

A quick-reference tool for **law enforcement, customs and regulatory officers** to identify drug precursors and other chemicals frequently used in illicit drug manufacture — by **CAS number, UN number, HS code or name** — and to check whether the **company named on a chemical sticker** is a known producer/supplier of that chemical.

It runs entirely in the browser (no server, no tracking, works offline), so it is usable on a phone or tablet at a border post, warehouse or lab.

## What it does

| Feature | Description |
|---|---|
| **Identify** | Search by name/synonym, CAS (`108-24-7`), UN (`UN1715` or `1715`), or HS code (`2915.24`). Salts, esters and trade names are matched. |
| **What it is used for** | Each entry shows which drugs it is linked to (heroin, cocaine, methamphetamine, MDMA, fentanyl, LSD, …), its role, legitimate uses and appearance. |
| **Sticker / label check** | Type the company printed on the label. The tool tells you if that company is a known producer/supplier of the chemical, tolerating spelling errors. |
| **Label consistency** | Cross-checks product name ↔ CAS ↔ UN number, and validates the **CAS check digit** (an invalid CAS can't exist — a red flag for falsified labels). |
| **Browse / export** | Full list with status filter and CSV download. |
| **My companies** | Add companies you have verified; saved only on your device; export as JSON to contribute back. |

## Coverage

* **INCB Table I and Table II** of the 1988 UN Convention — all **51 substances** from the *INCB Red List, 23rd edition (July 2025)*, including the newest fentanyl precursors (4-AP, 1-boc-4-AP, norfentanyl, 1-boc-4-piperidone, 4-piperidone), designer pre-precursors (MAPA, APAA, APAAN, 3,4-MDP-2-P and P-2-P glycidic acids/esters) and common salt CAS numbers.
* **53 non-scheduled chemicals** widely reported in clandestine laboratories (red phosphorus, iodine, hydriodic acid, methylamine, benzyl cyanide, GBL, propionyl chloride, common solvents, bases, reducing agents, …).
* The INCB's **limited International Special Surveillance List (ISSL)** is restricted to governments and is **not reproduced**; non-scheduled entries come from publicly available information only.

## Use it

* **Online:** enable GitHub Pages (Settings → Pages → *Deploy from a branch* → `main` / `/docs`), or use the included workflow (see below). Open `https://<user>.github.io/Precursor-Chemical-ID/`.
* **Offline single file:** open `dist/precursor-chemical-id.html` in any browser, or email/copy it — it contains everything.
* **Locally:** `python3 -m http.server -d docs` and browse to `http://localhost:8000`.

## Repository layout

```
data/chemicals.json        source of truth for chemicals (edit this)
data/manufacturers.json    companies known to produce/supply chemicals (edit this)
scripts/build.py           validates data (CAS checksums etc.) and builds the bundles
scripts/test_app.js        smoke tests (jsdom)
docs/                      the web app (served by GitHub Pages)
dist/                      single-file offline build
.github/workflows/         CI: validate data and deploy Pages
```

After editing data run:

```bash
python3 scripts/build.py      # validates and rebuilds docs/data/*.js and dist/*.html
```

## Data quality rules

* Every CAS number must pass the CAS check-digit test and be unique across the file (the build fails otherwise).
* UN numbers are recorded **only where one is established** for the chemical. Many precursors are not dangerous goods and have none; a missing UN number is not suspicious by itself.
* Company records need a `source`. The company list is deliberately small and **indicative** — it is not an authorisation list.

## Important limitations

* Reference aid only — **not legal advice** and not a substitute for forensic identification. A label is never proof of contents; confirm with a field test or laboratory analysis and keep chain of custody.
* Salts, isomers and preparations of Table I/II substances are controlled but have different CAS numbers; a CAS that is not listed may still be a controlled item.
* Legal status differs by country and region (e.g. EU Regulations 273/2004 and 111/2005, US CSA List I/II). Check national law.
* "Company not in database" does **not** mean a product is fake, and "known producer" does **not** mean a container is genuine — counterfeit and re-labelled containers exist.

## Sources

* INCB, *Red List — List of Precursors and Chemicals Frequently Used in the Illicit Manufacture of Narcotic Drugs and Psychotropic Substances under International Control*, 23rd edition, July 2025 — <https://www.incb.org/incb/en/precursors/red-list.html>
* UNODC *Multilingual Dictionary of Precursors and Chemicals* — <https://www.unodc.org/unodc/en/scientists/multilingual-dictionary-of-precursors-and-chemicals>
* UN Recommendations on the Transport of Dangerous Goods / ADR (UN numbers)
* WCO Harmonized System (HS codes)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Corrections to CAS/UN numbers or company records (with a source) are very welcome.

## License

Code: MIT (see `LICENSE`). Chemical identifiers (CAS, UN, HS) are facts; the Red List content is published by the INCB for exactly this identification purpose.

## World map (nationally controlled chemicals)

The **World map** tab shows every country and territory with clear borders and names. Clicking one lists the chemicals it controls that are *not* in INCB Table I or II, with CAS numbers and a link to the source law.

- Data: `data/countries.json` (hand-researched from national legislation; every entry has a source). `scripts/build.py` validates it (CAS check digits, nothing INCB-scheduled listed as an extra) and writes `docs/data/countries.js`.
- Coverage is graded *verified* (full national list read), *partial* or *no public list found*. The INCB publishes no per-country list, so missing data is not proof of no controls. To add or correct a country, edit `data/countries.json` and open a pull request.
- Borders: Natural Earth 1:50m (public domain) via `scripts/build_map.js`, which writes `docs/data/world.js`. Only needed when changing the map; the output is committed.
