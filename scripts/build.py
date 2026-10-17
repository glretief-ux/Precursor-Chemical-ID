#!/usr/bin/env python3
"""Validate the data files and build the web app bundles.

Usage:  python3 scripts/build.py          (validate + build)
        python3 scripts/build.py --check  (validate only; used in CI)

Outputs:
  docs/data/chemicals.js, docs/data/manufacturers.js   (loaded by docs/index.html)
  dist/precursor-chemical-id.html                       (single offline file for phone/tablet/USB)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAS_RE = re.compile(r"^\d{2,7}-\d{2}-\d$")
UN_RE = re.compile(r"^UN\d{4}$")
HS_RE = re.compile(r"^\d{4}\.\d{2}$")


def cas_ok(cas: str) -> bool:
    if not CAS_RE.match(cas):
        return False
    digits = cas.replace("-", "")
    body, check = digits[:-1], int(digits[-1])
    total = sum((i + 1) * int(d) for i, d in enumerate(reversed(body)))
    return total % 10 == check


def validate(chems, comps):
    errors = []
    seen_cas, seen_id = {}, set()
    for c in chems:
        for k in ("id", "name", "regime"):
            if not c.get(k):
                errors.append(f"{c.get('id', '?')}: missing {k}")
        if c["id"] in seen_id:
            errors.append(f"duplicate id {c['id']}")
        seen_id.add(c["id"])
        all_cas = ([c["cas"]] if c.get("cas") else []) + [o["cas"] for o in c.get("other_cas", [])]
        for cas in all_cas:
            if not cas_ok(cas):
                errors.append(f"{c['id']}: invalid CAS {cas}")
            if cas in seen_cas:
                errors.append(f"{c['id']}: CAS {cas} also used by {seen_cas[cas]}")
            seen_cas[cas] = c["id"]
        for u in c.get("un", []):
            if not UN_RE.match(u):
                errors.append(f"{c['id']}: bad UN {u}")
        if c.get("hs") and not HS_RE.match(c["hs"]):
            errors.append(f"{c['id']}: bad HS {c['hs']}")
    for co in comps:
        for cas in co.get("cas", []):
            if cas not in seen_cas:
                errors.append(f"company {co['id']}: CAS {cas} not in chemicals.json")
    return errors


def main():
    chems = json.loads((ROOT / "data" / "chemicals.json").read_text(encoding="utf-8"))
    comps = json.loads((ROOT / "data" / "manufacturers.json").read_text(encoding="utf-8"))["companies"]
    errors = validate(chems, comps)
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    t1 = sum(1 for c in chems if c["regime"].startswith("INCB Table I "))
    t2 = sum(1 for c in chems if c["regime"].startswith("INCB Table II"))
    print(f"OK: {len(chems)} chemicals (Table I: {t1}, Table II: {t2}, other: {len(chems)-t1-t2}); {len(comps)} companies")
    if "--check" in sys.argv:
        return

    meta = {
        "redListEdition": "INCB Red List, 23rd edition (July 2025)",
    }
    chem_js = "window.CHEMICALS=" + json.dumps(chems, ensure_ascii=False) + ";window.META=" + json.dumps(meta) + ";"
    comp_js = "window.COMPANIES=" + json.dumps(comps, ensure_ascii=False) + ";"
    out = ROOT / "docs" / "data"
    out.mkdir(parents=True, exist_ok=True)
    (out / "chemicals.js").write_text(chem_js, encoding="utf-8")
    (out / "manufacturers.js").write_text(comp_js, encoding="utf-8")

    html = (ROOT / "docs" / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "docs" / "styles.css").read_text(encoding="utf-8")
    app = (ROOT / "docs" / "app.js").read_text(encoding="utf-8")
    html = re.sub(r'<link rel="stylesheet" href="styles.css">', lambda m: f"<style>\n{css}\n</style>", html)
    html = re.sub(r'<script src="data/chemicals.js"></script>', lambda m: f"<script>\n{chem_js}\n</script>", html)
    html = re.sub(r'<script src="data/manufacturers.js"></script>', lambda m: f"<script>\n{comp_js}\n</script>", html)
    html = re.sub(r'<script src="app.js"></script>', lambda m: f"<script>\n{app}\n</script>", html)
    import base64
    logo = base64.b64encode((ROOT / "docs" / "logo.png").read_bytes()).decode()
    html = html.replace('src="logo.png"', 'src="data:image/png;base64,' + logo + '"')
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    (dist / "precursor-chemical-id.html").write_text(html, encoding="utf-8")
    print("Built docs/data/*.js and dist/precursor-chemical-id.html")


if __name__ == "__main__":
    main()
