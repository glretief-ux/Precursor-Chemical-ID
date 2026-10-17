# Contributing

Thanks for helping keep this reference accurate.

## What to contribute

* **Corrections** to CAS, UN, HS, synonyms or control status — please cite the source (INCB Red List, UN Orange Book/ADR, WCO HS, a manufacturer SDS).
* **New chemicals** that are widely documented in clandestine laboratories (cite a public source such as an INCB/UNODC report).
* **Company records** — producers/suppliers you can verify. Every record needs a `source` (company site, SDS, regulator listing).

## What NOT to contribute

* Synthesis routes, reaction conditions, quantities or any "how-to" content. This tool is for **identification** only.
* Restricted material (e.g. the government-only INCB ISSL) or anything not publicly available.
* Personal data or unverified accusations about companies.

## How

1. Edit `data/chemicals.json` and/or `data/manufacturers.json`.
2. Run `python3 scripts/build.py` — it validates CAS check digits, duplicates and references and rebuilds the app.
3. Optional: `cd scripts && npm i jsdom && node test_app.js`.
4. Open a pull request describing your source.

Users can also export their locally saved companies from the app (**About & sources → My companies → Export JSON**) and attach the file to an issue.
